import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp, { type AvailableFormatInfo, type FormatEnum } from 'sharp'
import { buildOutputFilename, withCollisionSuffix } from '../shared/image-actions'
import type {
  ImageActionId,
  ImageTransformOptions,
  WorkspaceImageItem,
  WorkspaceMetadata,
  WorkspaceOutput
} from '../shared/types'

const METADATA_FILE = 'workspace.json'
const ACTIVE_FILE = 'active-workspace.txt'
const MAX_IMAGE_BYTES = 100 * 1024 * 1024

const MIME_BY_FORMAT: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  tiff: 'image/tiff',
  webp: 'image/webp'
}

const EXTENSION_BY_FORMAT: Record<string, string> = {
  avif: 'avif',
  gif: 'gif',
  heif: 'heif',
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  tiff: 'tiff',
  webp: 'webp'
}

function assertImageDimensions(
  width: number | undefined,
  height: number | undefined,
  format: string | undefined
): asserts width is number {
  if (!width || !height || !format) {
    throw new Error('The selected file is not a supported image.')
  }
}

function isPathWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate)
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

function sanitizeSourceName(filename: string): string {
  const safe = path.basename(filename).replace(/[\0<>:"/\\|?*]/g, '-').trim()
  return safe || 'image'
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`
  await fs.writeFile(temporaryPath, content, 'utf8')
  await fs.rename(temporaryPath, filePath)
}

async function readDataUrl(filePath: string): Promise<string> {
  const extension = path.extname(filePath).slice(1).toLowerCase()
  const mimeType = MIME_BY_FORMAT[extension] ?? 'image/jpeg'
  const value = await fs.readFile(filePath)
  return `data:${mimeType};base64,${value.toString('base64')}`
}

export class WorkspaceService {
  private active: WorkspaceMetadata | null = null

  constructor(private readonly rootDirectory: string) {}

  async initialize(): Promise<WorkspaceMetadata> {
    await fs.mkdir(this.rootDirectory, { recursive: true })

    try {
      const activeId = (await fs.readFile(path.join(this.rootDirectory, ACTIVE_FILE), 'utf8')).trim()
      if (activeId) {
        this.active = await this.loadWorkspace(activeId)
        return this.withPreviews(this.active)
      }
    } catch {
      // Missing or invalid active workspace: create a fresh one below.
    }

    return this.createWorkspace()
  }

  async createWorkspace(): Promise<WorkspaceMetadata> {
    const id = randomUUID()
    const now = new Date().toISOString()
    const workspace: WorkspaceMetadata = {
      id,
      name: `Workspace ${now.slice(0, 10)}`,
      createdAt: now,
      updatedAt: now,
      items: [],
      outputs: []
    }

    await Promise.all([
      fs.mkdir(this.directoryFor(id, 'inputs'), { recursive: true }),
      fs.mkdir(this.directoryFor(id, 'outputs'), { recursive: true }),
      fs.mkdir(this.directoryFor(id, 'previews'), { recursive: true })
    ])

    this.active = workspace
    await this.persist(workspace)
    await writeAtomic(path.join(this.rootDirectory, ACTIVE_FILE), id)
    return this.withPreviews(workspace)
  }

  async getActiveWorkspace(): Promise<WorkspaceMetadata> {
    const workspace = this.requireActive()
    return this.withPreviews(workspace)
  }

  async importImagePaths(sourcePaths: string[]): Promise<WorkspaceMetadata> {
    if (sourcePaths.length === 0) return this.getActiveWorkspace()
    if (sourcePaths.length > 50) throw new Error('Import is limited to 50 images at once.')

    for (const sourcePath of sourcePaths) {
      if (!path.isAbsolute(sourcePath)) throw new Error('Image path must be absolute.')
      const stat = await fs.stat(sourcePath)
      if (!stat.isFile()) throw new Error(`${path.basename(sourcePath)} is not a file.`)
      if (stat.size > MAX_IMAGE_BYTES) {
        throw new Error(`${path.basename(sourcePath)} is larger than 100 MB.`)
      }
      await this.importImageBuffer(await fs.readFile(sourcePath), path.basename(sourcePath))
    }

    return this.getActiveWorkspace()
  }

  async importImageBuffer(buffer: Buffer, sourceName: string): Promise<WorkspaceImageItem> {
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
      throw new Error('Image must be between 1 byte and 100 MB.')
    }

    const workspace = this.requireActive()
    const metadata = await sharp(buffer, { animated: false }).metadata()
    assertImageDimensions(metadata.width, metadata.height, metadata.format)

    const itemId = randomUUID()
    const safeName = sanitizeSourceName(sourceName)
    const inputFilename = await this.availableFilename(
      this.directoryFor(workspace.id, 'inputs'),
      safeName
    )
    const relativePath = path.join('inputs', inputFilename)
    const absolutePath = this.resolveWorkspacePath(workspace.id, relativePath)
    await fs.writeFile(absolutePath, buffer)

    const previewRelativePath = path.join('previews', `${itemId}.jpg`)
    await this.createPreview(absolutePath, this.resolveWorkspacePath(workspace.id, previewRelativePath))

    const now = new Date().toISOString()
    const item: WorkspaceImageItem = {
      id: itemId,
      kind: 'image',
      name: inputFilename,
      sourceName: safeName,
      relativePath,
      previewRelativePath,
      mimeType: MIME_BY_FORMAT[metadata.format] ?? 'application/octet-stream',
      format: metadata.format,
      width: metadata.width,
      height: metadata.height!,
      sizeBytes: buffer.byteLength,
      createdAt: now
    }

    workspace.items.push(item)
    workspace.updatedAt = now
    await this.persist(workspace)
    return {
      ...item,
      previewDataUrl: await readDataUrl(
        this.resolveWorkspacePath(workspace.id, previewRelativePath)
      )
    }
  }

  async transformImage(
    itemId: string,
    actionId: ImageActionId,
    options: ImageTransformOptions = {}
  ): Promise<{ workspace: WorkspaceMetadata; output: WorkspaceOutput }> {
    const workspace = this.requireActive()
    const item = workspace.items.find((candidate) => candidate.id === itemId)
    if (!item) throw new Error('Image item no longer exists in this workspace.')

    const sourcePath = this.resolveWorkspacePath(workspace.id, item.relativePath)
    const sourceMetadata = await sharp(sourcePath).metadata()
    assertImageDimensions(sourceMetadata.width, sourceMetadata.height, sourceMetadata.format)

    const outputFormat = this.outputFormat(actionId, sourceMetadata.format)
    const desiredFilename = buildOutputFilename(
      item.sourceName,
      actionId,
      EXTENSION_BY_FORMAT[outputFormat] ?? outputFormat
    )
    const outputFilename = await this.availableFilename(
      this.directoryFor(workspace.id, 'outputs'),
      desiredFilename
    )
    const outputRelativePath = path.join('outputs', outputFilename)
    const outputPath = this.resolveWorkspacePath(workspace.id, outputRelativePath)

    await this.processImage(sourcePath, outputPath, actionId, outputFormat, options)

    const transformedMetadata = await sharp(outputPath).metadata()
    assertImageDimensions(
      transformedMetadata.width,
      transformedMetadata.height,
      transformedMetadata.format
    )
    const outputStat = await fs.stat(outputPath)
    const outputId = randomUUID()
    const previewRelativePath = path.join('previews', `${outputId}.jpg`)
    await this.createPreview(
      outputPath,
      this.resolveWorkspacePath(workspace.id, previewRelativePath)
    )

    const now = new Date().toISOString()
    const output: WorkspaceOutput = {
      id: outputId,
      sourceItemId: itemId,
      kind: 'image',
      actionId,
      name: outputFilename,
      relativePath: outputRelativePath,
      previewRelativePath,
      mimeType: MIME_BY_FORMAT[transformedMetadata.format] ?? 'application/octet-stream',
      format: transformedMetadata.format,
      width: transformedMetadata.width,
      height: transformedMetadata.height!,
      sizeBytes: outputStat.size,
      createdAt: now
    }

    workspace.outputs.push(output)
    workspace.updatedAt = now
    await this.persist(workspace)
    const snapshot = await this.withPreviews(workspace)
    const hydratedOutput = snapshot.outputs.find((candidate) => candidate.id === output.id)!
    return { workspace: snapshot, output: hydratedOutput }
  }

  getOutputPath(outputId: string): string {
    const workspace = this.requireActive()
    const output = workspace.outputs.find((candidate) => candidate.id === outputId)
    if (!output) throw new Error('Output no longer exists in this workspace.')
    return this.resolveWorkspacePath(workspace.id, output.relativePath)
  }

  getRootDirectory(): string {
    return this.rootDirectory
  }

  async clearTemporaryFiles(): Promise<WorkspaceMetadata> {
    await fs.rm(this.rootDirectory, { recursive: true, force: true })
    this.active = null
    return this.initialize()
  }

  private requireActive(): WorkspaceMetadata {
    if (!this.active) throw new Error('Workspace service has not been initialized.')
    return this.active
  }

  private directoryFor(workspaceId: string, child?: string): string {
    const base = path.join(this.rootDirectory, workspaceId)
    return child ? path.join(base, child) : base
  }

  private resolveWorkspacePath(workspaceId: string, relativePath: string): string {
    const workspaceDirectory = this.directoryFor(workspaceId)
    const resolved = path.resolve(workspaceDirectory, relativePath)
    if (!isPathWithin(workspaceDirectory, resolved)) {
      throw new Error('Workspace path escaped its sandbox.')
    }
    return resolved
  }

  private async loadWorkspace(id: string): Promise<WorkspaceMetadata> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Invalid workspace identifier.')
    const filePath = path.join(this.directoryFor(id), METADATA_FILE)
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8')) as WorkspaceMetadata
    if (parsed.id !== id || !Array.isArray(parsed.items) || !Array.isArray(parsed.outputs)) {
      throw new Error('Workspace metadata is invalid.')
    }
    return parsed
  }

  private async persist(workspace: WorkspaceMetadata): Promise<void> {
    const serializable: WorkspaceMetadata = {
      ...workspace,
      items: workspace.items.map(({ previewDataUrl: _preview, ...item }) => item),
      outputs: workspace.outputs.map(({ previewDataUrl: _preview, ...output }) => output)
    }
    await writeAtomic(
      path.join(this.directoryFor(workspace.id), METADATA_FILE),
      JSON.stringify(serializable, null, 2)
    )
  }

  private async withPreviews(workspace: WorkspaceMetadata): Promise<WorkspaceMetadata> {
    const hydrate = async <T extends WorkspaceImageItem | WorkspaceOutput>(value: T): Promise<T> => {
      try {
        return {
          ...value,
          previewDataUrl: await readDataUrl(
            this.resolveWorkspacePath(workspace.id, value.previewRelativePath)
          )
        }
      } catch {
        return { ...value, previewDataUrl: undefined }
      }
    }

    return {
      ...workspace,
      items: await Promise.all(workspace.items.map(hydrate)),
      outputs: await Promise.all(workspace.outputs.map(hydrate))
    }
  }

  private async availableFilename(directory: string, desired: string): Promise<string> {
    const extension = path.extname(desired)
    const base = path.basename(desired, extension)
    let sequence = 1

    while (true) {
      const candidate = withCollisionSuffix(`${base}${extension}`, sequence)
      try {
        await fs.access(path.join(directory, candidate))
        sequence += 1
      } catch {
        return candidate
      }
    }
  }

  private async createPreview(sourcePath: string, destinationPath: string): Promise<void> {
    await sharp(sourcePath)
      .rotate()
      .resize({ width: 420, height: 300, fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#19191f' })
      .jpeg({ quality: 76, mozjpeg: true })
      .toFile(destinationPath)
  }

  private outputFormat(actionId: ImageActionId, sourceFormat: string): string {
    if (actionId === 'convert-webp' || actionId === 'shop-image') return 'webp'
    if (['jpeg', 'png', 'webp', 'avif', 'tiff'].includes(sourceFormat)) return sourceFormat
    return 'webp'
  }

  private async processImage(
    sourcePath: string,
    outputPath: string,
    actionId: ImageActionId,
    format: string,
    options: ImageTransformOptions
  ): Promise<void> {
    const maxWidth = Math.min(Math.max(options.maxWidth ?? 1600, 64), 10_000)
    const maxHeight = Math.min(Math.max(options.maxHeight ?? 1600, 64), 10_000)
    const quality = Math.min(Math.max(options.quality ?? 82, 1), 100)
    let pipeline = sharp(sourcePath).rotate()

    if (actionId === 'resize-image' || actionId === 'shop-image') {
      pipeline = pipeline.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true
      })
    }

    const targetFormat = format as keyof FormatEnum
    const formatOptions: AvailableFormatInfo = sharp.format[targetFormat]
    if (!formatOptions?.output) throw new Error(`Output format ${format} is not supported.`)

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality: actionId === 'compress-image' ? 72 : quality, mozjpeg: true })
        break
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 9, palette: actionId === 'compress-image' })
        break
      case 'webp':
        pipeline = pipeline.webp({ quality: actionId === 'compress-image' ? 72 : quality, effort: 4 })
        break
      case 'avif':
        pipeline = pipeline.avif({ quality: actionId === 'compress-image' ? 55 : quality, effort: 4 })
        break
      case 'tiff':
        pipeline = pipeline.tiff({ quality: actionId === 'compress-image' ? 72 : quality })
        break
      default:
        pipeline = pipeline.webp({ quality, effort: 4 })
    }

    await pipeline.toFile(outputPath)
  }
}

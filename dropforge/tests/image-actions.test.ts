import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import {
  buildOutputFilename,
  cleanImageBaseName,
  withCollisionSuffix
} from '../src/shared/image-actions'
import { WorkspaceService } from '../src/main/workspace'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dropforge-test-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      fs.rm(directory, { recursive: true, force: true })
    )
  )
})

describe('image filenames', () => {
  it('creates shop-safe output names and deterministic collisions', () => {
    expect(cleanImageBaseName('KEF LS50 Métà & White.jpg')).toBe(
      'kef-ls50-meta-and-white'
    )
    expect(buildOutputFilename('KEF LS50 Métà & White.jpg', 'shop-image', 'webp')).toBe(
      'kef-ls50-meta-and-white.webp'
    )
    expect(withCollisionSuffix('product.webp', 3)).toBe('product-3.webp')
  })
})

describe('workspace image processing', () => {
  it('persists imports and creates non-destructive Shop Image outputs', async () => {
    const root = await temporaryDirectory()
    const sourceDirectory = await temporaryDirectory()
    const sourcePath = path.join(sourceDirectory, 'KEF LS50 Meta White Front.png')
    const original = await sharp({
      create: {
        width: 2000,
        height: 1000,
        channels: 4,
        background: { r: 240, g: 240, b: 240, alpha: 1 }
      }
    })
      .png()
      .toBuffer()
    await fs.writeFile(sourcePath, original)

    const service = new WorkspaceService(root)
    await service.initialize()
    const imported = await service.importImagePaths([sourcePath])
    expect(imported.items).toHaveLength(1)
    expect(imported.items[0].previewDataUrl).toMatch(/^data:image\/jpeg;base64,/)

    const first = await service.transformImage(imported.items[0].id, 'shop-image')
    expect(first.output.name).toBe('kef-ls50-meta-white-front.webp')
    expect(first.output.format).toBe('webp')
    expect(first.output.width).toBe(1600)
    expect(first.output.height).toBe(800)
    expect(first.output.previewDataUrl).toMatch(/^data:image\/jpeg;base64,/)
    expect(await fs.readFile(sourcePath)).toEqual(original)

    const second = await service.transformImage(imported.items[0].id, 'shop-image')
    expect(second.output.name).toBe('kef-ls50-meta-white-front-2.webp')

    const restored = new WorkspaceService(root)
    const restoredWorkspace = await restored.initialize()
    expect(restoredWorkspace.id).toBe(imported.id)
    expect(restoredWorkspace.items).toHaveLength(1)
    expect(restoredWorkspace.outputs).toHaveLength(2)

    const outputMetadata = await sharp(restored.getOutputPath(first.output.id)).metadata()
    expect(outputMetadata.format).toBe('webp')
    expect(outputMetadata.width).toBe(1600)
  })
})

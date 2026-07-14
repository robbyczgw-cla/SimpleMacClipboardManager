import path from 'node:path'
import type { ImageActionId } from './types'
import { slugify } from './actions'

export interface ImageActionDefinition {
  id: ImageActionId
  label: string
  description: string
}

export const IMAGE_ACTION_DEFINITIONS: ImageActionDefinition[] = [
  {
    id: 'resize-image',
    label: 'Resize',
    description: 'Fit inside 1600 × 1600 without upscaling.'
  },
  {
    id: 'convert-webp',
    label: 'Convert to WebP',
    description: 'Create a balanced WebP copy at quality 82.'
  },
  {
    id: 'compress-image',
    label: 'Compress',
    description: 'Create a smaller copy while preserving the source format.'
  },
  {
    id: 'strip-metadata',
    label: 'Strip metadata',
    description: 'Remove EXIF and other unnecessary metadata.'
  },
  {
    id: 'shop-image',
    label: 'Shop Image',
    description: 'Resize, convert to WebP, strip metadata, and clean the filename.'
  }
]

export function cleanImageBaseName(filename: string): string {
  const extension = path.extname(filename)
  const base = path.basename(filename, extension)
  return slugify(base) || 'image'
}

export function buildOutputFilename(
  sourceName: string,
  actionId: ImageActionId,
  extension: string
): string {
  const cleanExtension = extension.replace(/^\./, '').toLowerCase()
  const base = cleanImageBaseName(sourceName)
  const suffixByAction: Record<ImageActionId, string> = {
    'resize-image': '-resized',
    'convert-webp': '',
    'compress-image': '-compressed',
    'strip-metadata': '-clean',
    'shop-image': ''
  }

  return `${base}${suffixByAction[actionId]}.${cleanExtension}`
}

export function withCollisionSuffix(filename: string, sequence: number): string {
  if (sequence <= 1) return filename
  const extension = path.extname(filename)
  const base = path.basename(filename, extension)
  return `${base}-${sequence}${extension}`
}

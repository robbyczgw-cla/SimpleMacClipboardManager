import { isAbsolute, relative, resolve, sep } from 'node:path'

/**
 * Check that a file is a descendant of a managed directory.
 *
 * `resolve` closes `..` traversal attempts and the relative-path check avoids
 * treating a sibling directory with a shared prefix as managed. The managed
 * directory itself is not a valid file target.
 */
export function isPathWithinDirectory(filePath: string, directory: string): boolean {
  if (!isAbsolute(filePath) || !isAbsolute(directory)) return false

  const target = resolve(filePath)
  const root = resolve(directory)
  const child = relative(root, target)

  return child.length > 0 && child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child)
}

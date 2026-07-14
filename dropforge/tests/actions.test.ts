import { describe, expect, it } from 'vitest'
import {
  BUILTIN_RECIPES,
  cleanUrl,
  detectKind,
  executeAction,
  executeRecipe,
  normalizeWhitespace,
  slugify
} from '../src/shared/actions'

describe('content detection', () => {
  it('detects URLs before general text', () => {
    expect(detectKind('https://example.com?a=1')).toBe('url')
  })

  it('detects valid JSON', () => {
    expect(detectKind('{"name":"DropForge"}')).toBe('json')
  })
})

describe('text transformations', () => {
  it('normalizes repeated whitespace', () => {
    expect(normalizeWhitespace('  one\n\t two   three  ')).toBe('one two three')
  })

  it('creates stable ASCII slugs', () => {
    expect(slugify('KEF LS50 Métà & White')).toBe('kef-ls50-meta-and-white')
  })
})

describe('URL cleanup', () => {
  it('removes tracking parameters while preserving meaningful query and fragment', () => {
    expect(
      cleanUrl(
        'https://example.com/product?id=42&utm_source=newsletter&fbclid=abc#specs'
      )
    ).toBe('https://example.com/product?id=42#specs')
  })

  it('removes all utm-prefixed parameters case-insensitively', () => {
    expect(cleanUrl('https://example.com/?UTM_Custom=x&size=large')).toBe(
      'https://example.com/?size=large'
    )
  })
})

describe('JSON actions', () => {
  it('pretty prints and minifies JSON', () => {
    const source = '{"name":"DropForge","ready":true}'
    const pretty = executeAction('json-pretty', source)
    expect(pretty).toContain('\n  "name"')
    expect(executeAction('json-minify', pretty)).toBe(source)
  })
})

describe('recipe execution', () => {
  it('executes recipe steps in order', () => {
    const recipe = BUILTIN_RECIPES.find((item) => item.id === 'clean-text')
    expect(recipe).toBeDefined()
    expect(executeRecipe(recipe!, '  hello\n   world  ')).toBe('hello world')
  })

  it('rejects incompatible recipes', () => {
    const recipe = BUILTIN_RECIPES.find((item) => item.id === 'clean-url')
    expect(() => executeRecipe(recipe!, 'plain text')).toThrow(/not available/)
  })
})

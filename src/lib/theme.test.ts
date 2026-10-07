import { describe, expect, it } from 'vitest'
import { defaultInkColor, prefersDarkScheme, shellBackground } from './theme'

describe('theme', () => {
  it('maps shell backgrounds for light and dark', () => {
    expect(shellBackground(false)).toBe('#f7f4ef')
    expect(shellBackground(true)).toBe('#1c1917')
  })

  it('reads prefers-color-scheme from media', () => {
    expect(prefersDarkScheme({ matches: true })).toBe(true)
    expect(prefersDarkScheme({ matches: false })).toBe(false)
  })

  it('picks default ink for the color picker', () => {
    expect(defaultInkColor(false)).toBe('#1c1917')
    expect(defaultInkColor(true)).toBe('#f5f5f4')
  })
})

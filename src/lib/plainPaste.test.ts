import { describe, expect, it } from 'vitest'
import { normalizePlainText } from './plainPaste'

describe('normalizePlainText', () => {
  it('preserves newlines and strips trailing spaces per line', () => {
    expect(normalizePlainText('hello  \nworld\t\n')).toBe('hello\nworld')
  })

  it('returns empty string for blank input', () => {
    expect(normalizePlainText('   ')).toBe('')
  })
})

import { describe, expect, it } from 'vitest'
import { normalizeNameInput } from './nameInput'

describe('normalizeNameInput', () => {
  it('returns null when cancelled', () => {
    expect(normalizeNameInput(null)).toBeNull()
  })

  it('trims and rejects blank names', () => {
    expect(normalizeNameInput('   ')).toBeNull()
    expect(normalizeNameInput('\n\t')).toBeNull()
  })

  it('returns trimmed name', () => {
    expect(normalizeNameInput('  Ideas  ')).toBe('Ideas')
  })
})

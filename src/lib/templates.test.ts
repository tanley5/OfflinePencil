import { describe, expect, it } from 'vitest'
import { PAGE_TEMPLATES, getTemplate } from './templates'

describe('templates', () => {
  it('exposes blank, lined, dotted, and planner templates', () => {
    expect(PAGE_TEMPLATES.map((t) => t.id)).toEqual([
      'blank',
      'lined',
      'dotted',
      'planner',
    ])
  })

  it('returns CSS class for a template id', () => {
    expect(getTemplate('lined')?.cssClass).toBe('template-lined')
    expect(getTemplate('missing' as 'blank')).toBeUndefined()
  })
})

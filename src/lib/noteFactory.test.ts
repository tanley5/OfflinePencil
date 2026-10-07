import { describe, expect, it } from 'vitest'
import {
  createEmptyContainer,
  createEmptyTipTapDoc,
  emptyParagraphDoc,
  nextZIndex,
} from './noteFactory'

describe('noteFactory', () => {
  it('creates an empty TipTap doc with one paragraph', () => {
    const doc = createEmptyTipTapDoc()
    expect(doc.type).toBe('doc')
    expect(doc.content).toEqual([{ type: 'paragraph' }])
  })

  it('creates a container at the click point with default size', () => {
    const container = createEmptyContainer(120, 200, 3)
    expect(container.x).toBe(120)
    expect(container.y).toBe(200)
    expect(container.width).toBe(280)
    expect(container.height).toBe(140)
    expect(container.zIndex).toBe(3)
    expect(container.content).toEqual(emptyParagraphDoc())
    expect(container.id).toBeTruthy()
  })

  it('computes next z-index above existing containers', () => {
    expect(nextZIndex([])).toBe(1)
    expect(
      nextZIndex([
        { zIndex: 1 },
        { zIndex: 4 },
        { zIndex: 2 },
      ]),
    ).toBe(5)
  })
})

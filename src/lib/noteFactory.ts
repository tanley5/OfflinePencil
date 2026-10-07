import type { NoteContainer, TipTapDoc } from '../../shared/types'

export function emptyParagraphDoc(): TipTapDoc {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

export function createEmptyTipTapDoc(): TipTapDoc {
  return emptyParagraphDoc()
}

export function createEmptyContainer(
  x: number,
  y: number,
  zIndex: number,
): NoteContainer {
  return {
    id: crypto.randomUUID(),
    x,
    y,
    width: 280,
    height: 140,
    zIndex,
    content: emptyParagraphDoc(),
  }
}

export function nextZIndex(containers: Array<{ zIndex: number }>): number {
  if (containers.length === 0) return 1
  return Math.max(...containers.map((c) => c.zIndex)) + 1
}

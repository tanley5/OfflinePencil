import { useCallback, useRef, useState } from 'react'
import type { NoteContainer, TipTapDoc } from '../../shared/types'
import { NoteEditor, type NoteEditorHandle } from './NoteEditor'

type Props = {
  container: NoteContainer
  selected: boolean
  onSelect: () => void
  onChangeContent: (content: TipTapDoc) => void
  onMove: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
  onEditorReady: (id: string, handle: NoteEditorHandle | null) => void
}

export function NoteContainerView({
  container,
  selected,
  onSelect,
  onChangeContent,
  onMove,
  onResize,
  onEditorReady,
}: Props) {
  const dragStart = useRef<{
    pointerX: number
    pointerY: number
    x: number
    y: number
  } | null>(null)
  const resizeStart = useRef<{
    pointerX: number
    pointerY: number
    width: number
    height: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  const onEditorReadyForId = useCallback(
    (handle: NoteEditorHandle | null) => onEditorReady(container.id, handle),
    [container.id, onEditorReady],
  )

  return (
    <div
      className={`note-container${selected ? ' selected' : ''}`}
      style={{
        left: container.x,
        top: container.y,
        width: container.width,
        height: container.height,
        zIndex: container.zIndex,
        cursor: dragging ? 'grabbing' : undefined,
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <div
        className="note-drag"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onSelect()
          dragStart.current = {
            pointerX: e.clientX,
            pointerY: e.clientY,
            x: container.x,
            y: container.y,
          }
          setDragging(true)
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!dragStart.current) return
          const dx = e.clientX - dragStart.current.pointerX
          const dy = e.clientY - dragStart.current.pointerY
          onMove(
            Math.max(0, dragStart.current.x + dx),
            Math.max(0, dragStart.current.y + dy),
          )
        }}
        onPointerUp={() => {
          dragStart.current = null
          setDragging(false)
        }}
      />
      <NoteEditor
        content={container.content}
        editable={selected}
        onChange={onChangeContent}
        onEditorReady={onEditorReadyForId}
      />
      <div
        className="resize-handle"
        onPointerDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onSelect()
          resizeStart.current = {
            pointerX: e.clientX,
            pointerY: e.clientY,
            width: container.width,
            height: container.height,
          }
          ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!resizeStart.current) return
          const dx = e.clientX - resizeStart.current.pointerX
          const dy = e.clientY - resizeStart.current.pointerY
          onResize(
            Math.max(160, resizeStart.current.width + dx),
            Math.max(80, resizeStart.current.height + dy),
          )
        }}
        onPointerUp={() => {
          resizeStart.current = null
        }}
      />
    </div>
  )
}

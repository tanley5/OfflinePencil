import type { NoteContainer, PageDocument, TipTapDoc } from '../../shared/types'
import { getTemplate } from '../lib/templates'
import { createEmptyContainer, nextZIndex } from '../lib/noteFactory'
import { NoteContainerView } from './NoteContainerView'
import type { NoteEditorHandle } from './NoteEditor'

type Props = {
  page: PageDocument
  selectedId: string | null
  onSelect: (id: string | null) => void
  onChangePage: (page: PageDocument) => void
  onEditorReady: (id: string, handle: NoteEditorHandle | null) => void
}

export function PageCanvas({
  page,
  selectedId,
  onSelect,
  onChangePage,
  onEditorReady,
}: Props) {
  const template = getTemplate(page.templateId)

  function updateContainer(id: string, patch: Partial<NoteContainer>) {
    onChangePage({
      ...page,
      containers: page.containers.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    })
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const container = createEmptyContainer(
      x,
      y,
      nextZIndex(page.containers),
    )
    onChangePage({
      ...page,
      containers: [...page.containers, container],
    })
    onSelect(container.id)
  }

  return (
    <div className="page-canvas-wrap">
      <div
        className={`page-canvas ${template?.cssClass ?? 'template-blank'}`}
        onClick={handleCanvasClick}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onSelect(null)
        }}
      >
        {page.containers.length === 0 && (
          <div className="empty-hint">Click anywhere to start a note</div>
        )}
        {page.containers.map((container) => (
          <NoteContainerView
            key={container.id}
            container={container}
            selected={selectedId === container.id}
            onSelect={() => {
              updateContainer(container.id, {
                zIndex: nextZIndex(page.containers),
              })
              onSelect(container.id)
            }}
            onChangeContent={(content: TipTapDoc) =>
              updateContainer(container.id, { content })
            }
            onMove={(x, y) => updateContainer(container.id, { x, y })}
            onResize={(width, height) =>
              updateContainer(container.id, { width, height })
            }
            onEditorReady={onEditorReady}
          />
        ))}
      </div>
    </div>
  )
}

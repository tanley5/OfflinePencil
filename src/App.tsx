import { useCallback, useEffect, useRef, useState } from 'react'
import { PageCanvas } from './components/PageCanvas'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import type { NoteEditorHandle } from './components/NoteEditor'
import type {
  LibraryIndex,
  LibrarySnapshot,
  PageDocument,
  TemplateId,
} from '../shared/types'
import { createDebouncedSaver } from './lib/debounceSave'

function api() {
  if (!window.pencil) {
    throw new Error('Pencil bridge unavailable. Run via Electron.')
  }
  return window.pencil
}

export default function App() {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const editors = useRef(new Map<string, NoteEditorHandle>())
  const pageRef = useRef<PageDocument | null>(null)
  const saver = useRef(
    createDebouncedSaver((page: PageDocument) => {
      pageRef.current = page
      void api().savePage(page)
    }, 400),
  )

  const refresh = useCallback(async (next?: LibrarySnapshot) => {
    const data = next ?? (await api().load())
    setSnapshot(data)
    pageRef.current = data.page
  }, [])

  useEffect(() => {
    refresh().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : String(err))
    })
  }, [refresh])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedId(null)
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        void pastePlain()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // pastePlain reads latest selectedId/editors via refs/state at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  useEffect(() => {
    function flush() {
      saver.current.flush()
    }
    window.addEventListener('beforeunload', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      flush()
    }
  }, [])

  function onChangePage(page: PageDocument) {
    pageRef.current = page
    setSnapshot((prev) => (prev ? { ...prev, page } : prev))
    saver.current.schedule(page)
  }

  async function selectPage(
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) {
    const next = await api().setActive({ notebookId, sectionId, pageId })
    setSelectedId(null)
    await refresh(next)
  }

  async function createNotebook() {
    const title = window.prompt('Notebook name', 'New Notebook')
    if (!title) return
    await api().createNotebook(title)
    await refresh()
  }

  async function createSection() {
    const notebookId = snapshot?.index.active.notebookId
    if (!notebookId) return
    const title = window.prompt('Section name', 'New Section')
    if (!title) return
    await api().createSection(notebookId, title)
    await refresh()
  }

  async function createPage() {
    const { notebookId, sectionId } = snapshot?.index.active ?? {}
    if (!notebookId || !sectionId) return
    const title = window.prompt('Page name', 'Untitled')
    if (!title) return
    await api().createPage(notebookId, sectionId, title)
    await refresh()
  }

  async function renamePage(
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) {
    const current = snapshot?.index.notebooks
      .find((n) => n.id === notebookId)
      ?.sections.find((s) => s.id === sectionId)
      ?.pages.find((p) => p.id === pageId)
    const title = window.prompt('Rename page', current?.title ?? 'Untitled')
    if (!title) return
    const next = await api().renamePage(notebookId, sectionId, pageId, title)
    await refresh(next)
  }

  async function deletePage(
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) {
    if (!window.confirm('Delete this page?')) return
    const next = await api().deletePage(notebookId, sectionId, pageId)
    setSelectedId(null)
    await refresh(next)
  }

  function onTemplateChange(templateId: TemplateId) {
    if (!snapshot?.page) return
    onChangePage({ ...snapshot.page, templateId })
  }

  function onEditorReady(id: string, handle: NoteEditorHandle | null) {
    if (handle) editors.current.set(id, handle)
    else editors.current.delete(id)
  }

  async function pastePlain() {
    if (!selectedId) return
    const handle = editors.current.get(selectedId)
    if (!handle) return
    const text = await navigator.clipboard.readText()
    handle.pastePlain(text)
  }

  if (error) return <div className="status">{error}</div>
  if (!snapshot) return <div className="status">Loading library…</div>

  const index: LibraryIndex = snapshot.index
  const page = snapshot.page
  const activeEditor = selectedId
    ? (editors.current.get(selectedId) ?? null)
    : null

  return (
    <div className="app">
      <Toolbar
        templateId={page?.templateId ?? 'blank'}
        editor={activeEditor}
        onTemplateChange={onTemplateChange}
        onPastePlain={() => void pastePlain()}
      />
      <Sidebar
        index={index}
        onSelectPage={(n, s, p) => void selectPage(n, s, p)}
        onCreateNotebook={() => void createNotebook()}
        onCreateSection={() => void createSection()}
        onCreatePage={() => void createPage()}
        onRenamePage={(n, s, p) => void renamePage(n, s, p)}
        onDeletePage={(n, s, p) => void deletePage(n, s, p)}
      />
      <div className="workspace">
        {page ? (
          <PageCanvas
            page={page}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onChangePage={onChangePage}
            onEditorReady={onEditorReady}
          />
        ) : (
          <div className="status">Select or create a page.</div>
        )}
      </div>
    </div>
  )
}

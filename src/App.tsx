import { useCallback, useEffect, useRef, useState } from 'react'
import { PageCanvas } from './components/PageCanvas'
import { Sidebar } from './components/Sidebar'
import { Toolbar } from './components/Toolbar'
import { NameDialog } from './components/NameDialog'
import { ConfirmDialog } from './components/ConfirmDialog'
import type { NoteEditorHandle } from './components/NoteEditor'
import type {
  LibraryIndex,
  LibrarySnapshot,
  PageDocument,
  TemplateId,
} from '../shared/types'
import { createDebouncedSaver } from './lib/debounceSave'
import { normalizeNameInput } from './lib/nameInput'

function api() {
  if (!window.pencil) {
    throw new Error('Pencil bridge unavailable. Run via Electron.')
  }
  return window.pencil
}

type NamePrompt =
  | { kind: 'create-notebook' }
  | { kind: 'create-section' }
  | { kind: 'create-page' }
  | { kind: 'rename-notebook'; notebookId: string; current: string }
  | {
      kind: 'rename-section'
      notebookId: string
      sectionId: string
      current: string
    }
  | {
      kind: 'rename-page'
      notebookId: string
      sectionId: string
      pageId: string
      current: string
    }

type ConfirmPrompt =
  | { kind: 'delete-notebook'; notebookId: string; title: string }
  | {
      kind: 'delete-section'
      notebookId: string
      sectionId: string
      title: string
    }
  | {
      kind: 'delete-page'
      notebookId: string
      sectionId: string
      pageId: string
      title: string
    }

export default function App() {
  const [snapshot, setSnapshot] = useState<LibrarySnapshot | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [namePrompt, setNamePrompt] = useState<NamePrompt | null>(null)
  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmPrompt | null>(
    null,
  )
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
    return api().onExportRequest(() => {
      void (async () => {
        saver.current.flush()
        const page = pageRef.current
        if (page) await api().savePage(page)
        await api().exportNotes()
      })()
    })
  }, [])

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

  async function handleNameConfirm(raw: string) {
    const title = normalizeNameInput(raw)
    const prompt = namePrompt
    setNamePrompt(null)
    if (!title || !prompt) return

    switch (prompt.kind) {
      case 'create-notebook':
        await api().createNotebook(title)
        await refresh()
        break
      case 'create-section': {
        const notebookId = snapshot?.index.active.notebookId
        if (!notebookId) return
        await api().createSection(notebookId, title)
        await refresh()
        break
      }
      case 'create-page': {
        const { notebookId, sectionId } = snapshot?.index.active ?? {}
        if (!notebookId || !sectionId) return
        await api().createPage(notebookId, sectionId, title)
        await refresh()
        break
      }
      case 'rename-notebook': {
        const next = await api().renameNotebook(prompt.notebookId, title)
        await refresh(next)
        break
      }
      case 'rename-section': {
        const next = await api().renameSection(
          prompt.notebookId,
          prompt.sectionId,
          title,
        )
        await refresh(next)
        break
      }
      case 'rename-page': {
        const next = await api().renamePage(
          prompt.notebookId,
          prompt.sectionId,
          prompt.pageId,
          title,
        )
        await refresh(next)
        break
      }
    }
  }

  async function handleConfirmDelete() {
    const prompt = confirmPrompt
    setConfirmPrompt(null)
    if (!prompt) return
    let next: LibrarySnapshot
    if (prompt.kind === 'delete-notebook') {
      next = await api().deleteNotebook(prompt.notebookId)
    } else if (prompt.kind === 'delete-section') {
      next = await api().deleteSection(prompt.notebookId, prompt.sectionId)
    } else {
      next = await api().deletePage(
        prompt.notebookId,
        prompt.sectionId,
        prompt.pageId,
      )
    }
    setSelectedId(null)
    await refresh(next)
  }

  function openRenameNotebook(notebookId: string) {
    const current =
      snapshot?.index.notebooks.find((n) => n.id === notebookId)?.title ??
      'Notebook'
    setNamePrompt({ kind: 'rename-notebook', notebookId, current })
  }

  function openRenameSection(notebookId: string, sectionId: string) {
    const current =
      snapshot?.index.notebooks
        .find((n) => n.id === notebookId)
        ?.sections.find((s) => s.id === sectionId)?.title ?? 'Section'
    setNamePrompt({
      kind: 'rename-section',
      notebookId,
      sectionId,
      current,
    })
  }

  function openRenamePage(
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) {
    const current =
      snapshot?.index.notebooks
        .find((n) => n.id === notebookId)
        ?.sections.find((s) => s.id === sectionId)
        ?.pages.find((p) => p.id === pageId)?.title ?? 'Untitled'
    setNamePrompt({
      kind: 'rename-page',
      notebookId,
      sectionId,
      pageId,
      current,
    })
  }

  function openDeleteNotebook(notebookId: string) {
    const title =
      snapshot?.index.notebooks.find((n) => n.id === notebookId)?.title ??
      'this notebook'
    setConfirmPrompt({ kind: 'delete-notebook', notebookId, title })
  }

  function openDeleteSection(notebookId: string, sectionId: string) {
    const title =
      snapshot?.index.notebooks
        .find((n) => n.id === notebookId)
        ?.sections.find((s) => s.id === sectionId)?.title ?? 'this section'
    setConfirmPrompt({
      kind: 'delete-section',
      notebookId,
      sectionId,
      title,
    })
  }

  function openDeletePage(
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) {
    const title =
      snapshot?.index.notebooks
        .find((n) => n.id === notebookId)
        ?.sections.find((s) => s.id === sectionId)
        ?.pages.find((p) => p.id === pageId)?.title ?? 'this page'
    setConfirmPrompt({
      kind: 'delete-page',
      notebookId,
      sectionId,
      pageId,
      title,
    })
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

  const nameDialogCopy = namePrompt
    ? {
        'create-notebook': {
          title: 'New notebook',
          label: 'Name',
          initial: 'New Notebook',
          confirm: 'Create',
        },
        'create-section': {
          title: 'New section',
          label: 'Name',
          initial: 'New Section',
          confirm: 'Create',
        },
        'create-page': {
          title: 'New page',
          label: 'Name',
          initial: 'Untitled',
          confirm: 'Create',
        },
        'rename-notebook': {
          title: 'Rename notebook',
          label: 'Name',
          initial: namePrompt.kind === 'rename-notebook' ? namePrompt.current : '',
          confirm: 'Rename',
        },
        'rename-section': {
          title: 'Rename section',
          label: 'Name',
          initial: namePrompt.kind === 'rename-section' ? namePrompt.current : '',
          confirm: 'Rename',
        },
        'rename-page': {
          title: 'Rename page',
          label: 'Name',
          initial: namePrompt.kind === 'rename-page' ? namePrompt.current : '',
          confirm: 'Rename',
        },
      }[namePrompt.kind]
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
        onCreateNotebook={() => setNamePrompt({ kind: 'create-notebook' })}
        onCreateSection={() => setNamePrompt({ kind: 'create-section' })}
        onCreatePage={() => setNamePrompt({ kind: 'create-page' })}
        onRenameNotebook={openRenameNotebook}
        onRenameSection={openRenameSection}
        onRenamePage={openRenamePage}
        onDeleteNotebook={openDeleteNotebook}
        onDeleteSection={openDeleteSection}
        onDeletePage={openDeletePage}
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
      {namePrompt && nameDialogCopy && (
        <NameDialog
          title={nameDialogCopy.title}
          label={nameDialogCopy.label}
          initialValue={nameDialogCopy.initial}
          confirmLabel={nameDialogCopy.confirm}
          onCancel={() => setNamePrompt(null)}
          onConfirm={(value) => void handleNameConfirm(value)}
        />
      )}
      {confirmPrompt && (
        <ConfirmDialog
          title={
            confirmPrompt.kind === 'delete-notebook'
              ? 'Delete notebook'
              : confirmPrompt.kind === 'delete-section'
                ? 'Delete section'
                : 'Delete page'
          }
          message={
            confirmPrompt.kind === 'delete-notebook'
              ? `Delete notebook “${confirmPrompt.title}” and all of its sections and pages? This cannot be undone.`
              : confirmPrompt.kind === 'delete-section'
                ? `Delete section “${confirmPrompt.title}” and all of its pages? This cannot be undone.`
                : `Delete page “${confirmPrompt.title}”? This cannot be undone.`
          }
          confirmLabel="Delete"
          onCancel={() => setConfirmPrompt(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      )}
    </div>
  )
}

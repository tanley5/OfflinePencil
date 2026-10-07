import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LibraryStore } from './store'

describe('LibraryStore', () => {
  let root: string
  let store: LibraryStore

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'pencil-lib-'))
    store = new LibraryStore(root)
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  it('bootstraps a default notebook, section, and page on first load', () => {
    const snapshot = store.load()

    expect(snapshot.index.notebooks).toHaveLength(1)
    expect(snapshot.index.notebooks[0].title).toBe('My Notebook')
    expect(snapshot.index.notebooks[0].sections).toHaveLength(1)
    expect(snapshot.index.notebooks[0].sections[0].pages).toHaveLength(1)
    expect(snapshot.page).not.toBeNull()
    expect(snapshot.page?.templateId).toBe('blank')
    expect(snapshot.page?.containers).toEqual([])
    expect(fs.existsSync(path.join(root, 'index.json'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'pages', `${snapshot.page!.id}.json`))).toBe(
      true,
    )
  })

  it('persists a new notebook and reloads it', () => {
    store.load()
    const notebook = store.createNotebook('Work')
    const reloaded = store.load()

    expect(reloaded.index.notebooks.map((n) => n.title)).toContain('Work')
    expect(reloaded.index.notebooks.some((n) => n.id === notebook.id)).toBe(true)
  })

  it('creates sections and pages under a notebook', () => {
    const { index } = store.load()
    const notebookId = index.notebooks[0].id
    const section = store.createSection(notebookId, 'Ideas')
    const page = store.createPage(notebookId, section.id, 'Brainstorm')

    const reloaded = store.load()
    const found = reloaded.index.notebooks[0].sections.find((s) => s.id === section.id)
    expect(found?.title).toBe('Ideas')
    expect(found?.pages.some((p) => p.id === page.id && p.title === 'Brainstorm')).toBe(
      true,
    )
    expect(fs.existsSync(path.join(root, 'pages', `${page.id}.json`))).toBe(true)
  })

  it('renames and deletes a page, removing its JSON file', () => {
    const { index } = store.load()
    const notebookId = index.notebooks[0].id
    const sectionId = index.notebooks[0].sections[0].id
    const page = store.createPage(notebookId, sectionId, 'Temp')

    store.renamePage(notebookId, sectionId, page.id, 'Renamed')
    expect(
      store
        .load()
        .index.notebooks[0].sections[0].pages.find((p) => p.id === page.id)?.title,
    ).toBe('Renamed')

    store.deletePage(notebookId, sectionId, page.id)
    expect(fs.existsSync(path.join(root, 'pages', `${page.id}.json`))).toBe(false)
    expect(
      store.load().index.notebooks[0].sections[0].pages.some((p) => p.id === page.id),
    ).toBe(false)
  })

  it('saves page containers and template atomically', () => {
    const snapshot = store.load()
    const pageId = snapshot.page!.id

    store.savePage({
      id: pageId,
      templateId: 'lined',
      containers: [
        {
          id: 'c1',
          x: 40,
          y: 60,
          width: 240,
          height: 120,
          zIndex: 1,
          content: { type: 'doc', content: [{ type: 'paragraph' }] },
        },
      ],
    })

    const reloaded = store.getPage(pageId)
    expect(reloaded?.templateId).toBe('lined')
    expect(reloaded?.containers).toHaveLength(1)
    expect(reloaded?.containers[0].x).toBe(40)
  })

  it('updates active selection', () => {
    const { index } = store.load()
    const notebookId = index.notebooks[0].id
    const sectionId = index.notebooks[0].sections[0].id
    const pageId = index.notebooks[0].sections[0].pages[0].id

    store.setActive({ notebookId, sectionId, pageId })
    expect(store.load().index.active).toEqual({ notebookId, sectionId, pageId })
  })

  it('writes via temp file then rename (no leftover .tmp after success)', () => {
    const snapshot = store.load()
    store.savePage({
      ...snapshot.page!,
      templateId: 'dotted',
    })

    const pagesDir = path.join(root, 'pages')
    const leftovers = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.tmp'))
    expect(leftovers).toEqual([])
  })
})

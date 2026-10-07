import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type {
  LibraryIndex,
  LibrarySnapshot,
  NotebookMeta,
  PageDocument,
  PageMeta,
  SectionMeta,
} from '../types'

function createDefaultPage(): PageDocument {
  return {
    id: randomUUID(),
    templateId: 'blank',
    containers: [],
  }
}

function createDefaultIndex(page: PageMeta): LibraryIndex {
  const section: SectionMeta = {
    id: randomUUID(),
    title: 'Section 1',
    pages: [page],
  }
  const notebook: NotebookMeta = {
    id: randomUUID(),
    title: 'My Notebook',
    sections: [section],
  }
  return {
    notebooks: [notebook],
    active: {
      notebookId: notebook.id,
      sectionId: section.id,
      pageId: page.id,
    },
  }
}

export class LibraryStore {
  private readonly pagesDir: string
  private readonly indexPath: string

  constructor(private readonly root: string) {
    this.pagesDir = path.join(root, 'pages')
    this.indexPath = path.join(root, 'index.json')
  }

  load(): LibrarySnapshot {
    this.ensureDirs()
    if (!fs.existsSync(this.indexPath)) {
      const pageDoc = createDefaultPage()
      const pageMeta: PageMeta = { id: pageDoc.id, title: 'Untitled' }
      const index = createDefaultIndex(pageMeta)
      this.writeJson(this.indexPath, index)
      this.writeJson(this.pagePath(pageDoc.id), pageDoc)
      return { index, page: pageDoc }
    }

    const index = this.readJson<LibraryIndex>(this.indexPath)
    const pageId = index.active.pageId
    const page = pageId ? this.getPage(pageId) : null
    return { index, page }
  }

  getPage(pageId: string): PageDocument | null {
    const file = this.pagePath(pageId)
    if (!fs.existsSync(file)) return null
    return this.readJson<PageDocument>(file)
  }

  savePage(page: PageDocument): PageDocument {
    this.ensureDirs()
    this.writeJson(this.pagePath(page.id), page)
    return page
  }

  createNotebook(title: string): NotebookMeta {
    const index = this.readIndex()
    const pageDoc = createDefaultPage()
    const pageMeta: PageMeta = { id: pageDoc.id, title: 'Untitled' }
    const section: SectionMeta = {
      id: randomUUID(),
      title: 'Section 1',
      pages: [pageMeta],
    }
    const notebook: NotebookMeta = {
      id: randomUUID(),
      title,
      sections: [section],
    }
    index.notebooks.push(notebook)
    index.active = {
      notebookId: notebook.id,
      sectionId: section.id,
      pageId: pageMeta.id,
    }
    this.writeJson(this.pagePath(pageDoc.id), pageDoc)
    this.writeJson(this.indexPath, index)
    return notebook
  }

  createSection(notebookId: string, title: string): SectionMeta {
    const index = this.readIndex()
    const notebook = this.requireNotebook(index, notebookId)
    const pageDoc = createDefaultPage()
    const pageMeta: PageMeta = { id: pageDoc.id, title: 'Untitled' }
    const section: SectionMeta = {
      id: randomUUID(),
      title,
      pages: [pageMeta],
    }
    notebook.sections.push(section)
    index.active = {
      notebookId,
      sectionId: section.id,
      pageId: pageMeta.id,
    }
    this.writeJson(this.pagePath(pageDoc.id), pageDoc)
    this.writeJson(this.indexPath, index)
    return section
  }

  createPage(notebookId: string, sectionId: string, title: string): PageMeta {
    const index = this.readIndex()
    const section = this.requireSection(index, notebookId, sectionId)
    const pageDoc = createDefaultPage()
    const pageMeta: PageMeta = { id: pageDoc.id, title }
    section.pages.push(pageMeta)
    index.active = { notebookId, sectionId, pageId: pageMeta.id }
    this.writeJson(this.pagePath(pageDoc.id), pageDoc)
    this.writeJson(this.indexPath, index)
    return pageMeta
  }

  renameNotebook(notebookId: string, title: string): void {
    const index = this.readIndex()
    this.requireNotebook(index, notebookId).title = title
    this.writeJson(this.indexPath, index)
  }

  renameSection(notebookId: string, sectionId: string, title: string): void {
    const index = this.readIndex()
    this.requireSection(index, notebookId, sectionId).title = title
    this.writeJson(this.indexPath, index)
  }

  renamePage(
    notebookId: string,
    sectionId: string,
    pageId: string,
    title: string,
  ): void {
    const index = this.readIndex()
    const page = this.requirePage(index, notebookId, sectionId, pageId)
    page.title = title
    this.writeJson(this.indexPath, index)
  }

  deletePage(notebookId: string, sectionId: string, pageId: string): void {
    const index = this.readIndex()
    const section = this.requireSection(index, notebookId, sectionId)
    section.pages = section.pages.filter((p) => p.id !== pageId)
    const file = this.pagePath(pageId)
    if (fs.existsSync(file)) fs.unlinkSync(file)

    if (index.active.pageId === pageId) {
      const fallback = section.pages[0]?.id ?? null
      index.active.pageId = fallback
    }
    this.writeJson(this.indexPath, index)
  }

  deleteSection(notebookId: string, sectionId: string): void {
    const index = this.readIndex()
    const notebook = this.requireNotebook(index, notebookId)
    const section = this.requireSection(index, notebookId, sectionId)
    for (const page of section.pages) {
      const file = this.pagePath(page.id)
      if (fs.existsSync(file)) fs.unlinkSync(file)
    }
    notebook.sections = notebook.sections.filter((s) => s.id !== sectionId)
    if (index.active.sectionId === sectionId) {
      const next = notebook.sections[0]
      index.active.sectionId = next?.id ?? null
      index.active.pageId = next?.pages[0]?.id ?? null
    }
    this.writeJson(this.indexPath, index)
  }

  deleteNotebook(notebookId: string): void {
    const index = this.readIndex()
    const notebook = this.requireNotebook(index, notebookId)
    for (const section of notebook.sections) {
      for (const page of section.pages) {
        const file = this.pagePath(page.id)
        if (fs.existsSync(file)) fs.unlinkSync(file)
      }
    }
    index.notebooks = index.notebooks.filter((n) => n.id !== notebookId)
    if (index.active.notebookId === notebookId) {
      const next = index.notebooks[0]
      index.active.notebookId = next?.id ?? null
      index.active.sectionId = next?.sections[0]?.id ?? null
      index.active.pageId = next?.sections[0]?.pages[0]?.id ?? null
    }
    this.writeJson(this.indexPath, index)
  }

  setActive(active: LibraryIndex['active']): void {
    const index = this.readIndex()
    index.active = active
    this.writeJson(this.indexPath, index)
  }

  private ensureDirs(): void {
    fs.mkdirSync(this.pagesDir, { recursive: true })
  }

  private pagePath(pageId: string): string {
    return path.join(this.pagesDir, `${pageId}.json`)
  }

  private readIndex(): LibraryIndex {
    this.ensureDirs()
    if (!fs.existsSync(this.indexPath)) {
      return this.load().index
    }
    return this.readJson<LibraryIndex>(this.indexPath)
  }

  private requireNotebook(index: LibraryIndex, notebookId: string): NotebookMeta {
    const notebook = index.notebooks.find((n) => n.id === notebookId)
    if (!notebook) throw new Error(`Notebook not found: ${notebookId}`)
    return notebook
  }

  private requireSection(
    index: LibraryIndex,
    notebookId: string,
    sectionId: string,
  ): SectionMeta {
    const section = this.requireNotebook(index, notebookId).sections.find(
      (s) => s.id === sectionId,
    )
    if (!section) throw new Error(`Section not found: ${sectionId}`)
    return section
  }

  private requirePage(
    index: LibraryIndex,
    notebookId: string,
    sectionId: string,
    pageId: string,
  ): PageMeta {
    const page = this.requireSection(index, notebookId, sectionId).pages.find(
      (p) => p.id === pageId,
    )
    if (!page) throw new Error(`Page not found: ${pageId}`)
    return page
  }

  private readJson<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T
  }

  private writeJson(filePath: string, data: unknown): void {
    const dir = path.dirname(filePath)
    fs.mkdirSync(dir, { recursive: true })
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8')
    fs.renameSync(tmp, filePath)
  }
}

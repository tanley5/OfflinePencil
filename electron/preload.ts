import { contextBridge, ipcRenderer } from 'electron'
import type {
  LibraryIndex,
  LibrarySnapshot,
  NotebookMeta,
  PageDocument,
  PageMeta,
  SectionMeta,
} from './types'

export type PencilApi = {
  load: () => Promise<LibrarySnapshot>
  getPage: (pageId: string) => Promise<PageDocument | null>
  savePage: (page: PageDocument) => Promise<PageDocument>
  createNotebook: (title: string) => Promise<NotebookMeta>
  createSection: (notebookId: string, title: string) => Promise<SectionMeta>
  createPage: (
    notebookId: string,
    sectionId: string,
    title: string,
  ) => Promise<PageMeta>
  renameNotebook: (
    notebookId: string,
    title: string,
  ) => Promise<LibrarySnapshot>
  renameSection: (
    notebookId: string,
    sectionId: string,
    title: string,
  ) => Promise<LibrarySnapshot>
  renamePage: (
    notebookId: string,
    sectionId: string,
    pageId: string,
    title: string,
  ) => Promise<LibrarySnapshot>
  deletePage: (
    notebookId: string,
    sectionId: string,
    pageId: string,
  ) => Promise<LibrarySnapshot>
  deleteSection: (
    notebookId: string,
    sectionId: string,
  ) => Promise<LibrarySnapshot>
  deleteNotebook: (notebookId: string) => Promise<LibrarySnapshot>
  setActive: (active: LibraryIndex['active']) => Promise<LibrarySnapshot>
}

const api: PencilApi = {
  load: () => ipcRenderer.invoke('library:load'),
  getPage: (pageId) => ipcRenderer.invoke('library:getPage', pageId),
  savePage: (page) => ipcRenderer.invoke('library:savePage', page),
  createNotebook: (title) => ipcRenderer.invoke('library:createNotebook', title),
  createSection: (notebookId, title) =>
    ipcRenderer.invoke('library:createSection', notebookId, title),
  createPage: (notebookId, sectionId, title) =>
    ipcRenderer.invoke('library:createPage', notebookId, sectionId, title),
  renameNotebook: (notebookId, title) =>
    ipcRenderer.invoke('library:renameNotebook', notebookId, title),
  renameSection: (notebookId, sectionId, title) =>
    ipcRenderer.invoke('library:renameSection', notebookId, sectionId, title),
  renamePage: (notebookId, sectionId, pageId, title) =>
    ipcRenderer.invoke(
      'library:renamePage',
      notebookId,
      sectionId,
      pageId,
      title,
    ),
  deletePage: (notebookId, sectionId, pageId) =>
    ipcRenderer.invoke('library:deletePage', notebookId, sectionId, pageId),
  deleteSection: (notebookId, sectionId) =>
    ipcRenderer.invoke('library:deleteSection', notebookId, sectionId),
  deleteNotebook: (notebookId) =>
    ipcRenderer.invoke('library:deleteNotebook', notebookId),
  setActive: (active) => ipcRenderer.invoke('library:setActive', active),
}

contextBridge.exposeInMainWorld('pencil', api)

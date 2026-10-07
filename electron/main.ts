import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { LibraryStore } from './library/store'
import type { LibraryIndex, PageDocument } from './types'

let mainWindow: BrowserWindow | null = null
let store: LibraryStore

function libraryRoot(): string {
  return path.join(app.getPath('userData'), 'library')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'Pencil',
    backgroundColor: '#f7f4ef',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function registerIpc() {
  ipcMain.handle('library:load', () => store.load())

  ipcMain.handle('library:getPage', (_e, pageId: string) => store.getPage(pageId))

  ipcMain.handle('library:savePage', (_e, page: PageDocument) => store.savePage(page))

  ipcMain.handle('library:createNotebook', (_e, title: string) =>
    store.createNotebook(title),
  )

  ipcMain.handle(
    'library:createSection',
    (_e, notebookId: string, title: string) =>
      store.createSection(notebookId, title),
  )

  ipcMain.handle(
    'library:createPage',
    (_e, notebookId: string, sectionId: string, title: string) =>
      store.createPage(notebookId, sectionId, title),
  )

  ipcMain.handle(
    'library:renameNotebook',
    (_e, notebookId: string, title: string) => {
      store.renameNotebook(notebookId, title)
      return store.load()
    },
  )

  ipcMain.handle(
    'library:renameSection',
    (_e, notebookId: string, sectionId: string, title: string) => {
      store.renameSection(notebookId, sectionId, title)
      return store.load()
    },
  )

  ipcMain.handle(
    'library:renamePage',
    (
      _e,
      notebookId: string,
      sectionId: string,
      pageId: string,
      title: string,
    ) => {
      store.renamePage(notebookId, sectionId, pageId, title)
      return store.load()
    },
  )

  ipcMain.handle(
    'library:deletePage',
    (_e, notebookId: string, sectionId: string, pageId: string) => {
      store.deletePage(notebookId, sectionId, pageId)
      return store.load()
    },
  )

  ipcMain.handle(
    'library:deleteSection',
    (_e, notebookId: string, sectionId: string) => {
      store.deleteSection(notebookId, sectionId)
      return store.load()
    },
  )

  ipcMain.handle('library:deleteNotebook', (_e, notebookId: string) => {
    store.deleteNotebook(notebookId)
    return store.load()
  })

  ipcMain.handle('library:setActive', (_e, active: LibraryIndex['active']) => {
    store.setActive(active)
    return store.load()
  })
}

app.whenReady().then(() => {
  store = new LibraryStore(libraryRoot())
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

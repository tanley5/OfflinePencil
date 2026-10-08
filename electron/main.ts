import {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain,
  nativeTheme,
  shell,
} from 'electron'
import path from 'node:path'
import { LibraryStore } from './library/store'
import { writeNotesZip } from './library/exportNotes'
import type { LibraryIndex, PageDocument } from './types'

let mainWindow: BrowserWindow | null = null
let store: LibraryStore

function libraryRoot(): string {
  return path.join(app.getPath('userData'), 'library')
}

function shellBackground(): string {
  return nativeTheme.shouldUseDarkColors ? '#1c1917' : '#f7f4ef'
}

function buildMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const },
            ],
          },
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Notes…',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow?.webContents.send('export:request')
          },
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' } : { role: 'quit' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

function createWindow() {
  nativeTheme.themeSource = 'system'

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'Pencil',
    backgroundColor: shellBackground(),
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

  ipcMain.handle('library:exportNotes', async () => {
    const zipPath = path.join(app.getPath('downloads'), 'pencil_notes.zip')
    const result = await writeNotesZip(store, zipPath)
    if (mainWindow) {
      const { response } = await dialog.showMessageBox(mainWindow, {
        type: 'info',
        buttons: ['Show in Folder', 'OK'],
        defaultId: 1,
        cancelId: 1,
        title: 'Export complete',
        message: `Exported ${result.pageCount} page(s) as text files.`,
        detail: result.zipPath,
      })
      if (response === 0) {
        shell.showItemInFolder(result.zipPath)
      }
    }
    return result
  })
}

app.whenReady().then(() => {
  store = new LibraryStore(libraryRoot())
  registerIpc()
  buildMenu()
  createWindow()

  nativeTheme.on('updated', () => {
    mainWindow?.setBackgroundColor(shellBackground())
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

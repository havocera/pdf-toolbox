import { app, BrowserWindow, Menu } from 'electron'
import * as path from 'path'
import { pythonManager } from './python/manager'
import { registerPdfHandlers } from './ipc/pdf.handlers'
import { registerSystemHandlers } from './ipc/system.handlers'

const isDev = !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    show: false,
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../dist-react/index.html'))
  }

  win.once('ready-to-show', () => win.show())
}

app.whenReady().then(async () => {
  try {
    console.log('[Main] Starting Python backend...')
    await pythonManager.start()
    console.log('[Main] Python backend ready')
  } catch (err) {
    console.error('[Main] Python backend failed to start:', err)
  }

  registerPdfHandlers()
  registerSystemHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  pythonManager.stop()
})

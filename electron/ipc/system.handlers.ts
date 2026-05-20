import { ipcMain, dialog, shell } from 'electron'

export function registerSystemHandlers() {
  ipcMain.handle('system:select-files', async (_event, options) => {
    const result = await dialog.showOpenDialog(options)
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle('system:select-save-dir', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.handle('system:open-folder', async (_event, folderPath: string) => {
    await shell.openPath(folderPath)
  })
}

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  selectFiles: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('system:select-files', options),

  selectSaveDir: () =>
    ipcRenderer.invoke('system:select-save-dir'),

  openFolder: (folderPath: string) =>
    ipcRenderer.invoke('system:open-folder', folderPath),

  pdf: {
    merge:    (params: unknown) => ipcRenderer.invoke('pdf:merge',    params),
    split:    (params: unknown) => ipcRenderer.invoke('pdf:split',    params),
    compress: (params: unknown) => ipcRenderer.invoke('pdf:compress', params),
    toWord:   (params: unknown) => ipcRenderer.invoke('pdf:to-word',  params),
    toImage:  (params: unknown) => ipcRenderer.invoke('pdf:to-image', params),
    rotate:   (params: unknown) => ipcRenderer.invoke('pdf:rotate',   params),
    edit: {
      renderPage:    (params: unknown) => ipcRenderer.invoke('pdf:edit:render-page',    params),
      extractImages: (params: unknown) => ipcRenderer.invoke('pdf:edit:extract-images', params),
      extractText:   (params: unknown) => ipcRenderer.invoke('pdf:edit:extract-text',   params),
      addText:       (params: unknown) => ipcRenderer.invoke('pdf:edit:add-text',       params),
      insertImage:   (params: unknown) => ipcRenderer.invoke('pdf:edit:insert-image',   params),
      pageBlocks:    (params: unknown) => ipcRenderer.invoke('pdf:edit:page-blocks',    params),
      applyEdits:    (params: unknown) => ipcRenderer.invoke('pdf:edit:apply-edits',    params),
    },
  },
})

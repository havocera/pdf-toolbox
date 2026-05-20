export {}

declare global {
  interface Window {
    electronAPI: {
      selectFiles: (options: Electron.OpenDialogOptions) => Promise<string[]>
      selectSaveDir: () => Promise<string | null>
      openFolder: (folderPath: string) => Promise<void>
      pdf: {
        merge:    (params: unknown) => Promise<IpcResult>
        split:    (params: unknown) => Promise<IpcResult>
        compress: (params: unknown) => Promise<IpcResult>
        toWord:   (params: unknown) => Promise<IpcResult>
        toImage:  (params: unknown) => Promise<IpcResult>
        rotate:   (params: unknown) => Promise<IpcResult>
        edit: {
          renderPage:    (params: unknown) => Promise<IpcResult>
          extractImages: (params: unknown) => Promise<IpcResult>
          extractText:   (params: unknown) => Promise<IpcResult>
          addText:       (params: unknown) => Promise<IpcResult>
          insertImage:   (params: unknown) => Promise<IpcResult>
          pageBlocks:    (params: unknown) => Promise<IpcResult>
          applyEdits:    (params: unknown) => Promise<IpcResult>
        }
      }
    }
  }
}

export interface IpcResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

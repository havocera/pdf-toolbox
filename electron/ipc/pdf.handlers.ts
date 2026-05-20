import { ipcMain } from 'electron'
import { pythonBridge } from '../python/bridge'

const routes: Array<[string, string]> = [
  ['pdf:merge',               '/api/merge'],
  ['pdf:split',               '/api/split'],
  ['pdf:compress',            '/api/compress'],
  ['pdf:to-word',             '/api/convert/word'],
  ['pdf:to-image',            '/api/convert/image'],
  ['pdf:rotate',              '/api/rotate'],
  ['pdf:edit:render-page',    '/api/edit/render-page'],
  ['pdf:edit:extract-images', '/api/edit/extract-images'],
  ['pdf:edit:extract-text',   '/api/edit/extract-text'],
  ['pdf:edit:add-text',       '/api/edit/add-text'],
  ['pdf:edit:insert-image',   '/api/edit/insert-image'],
  ['pdf:edit:page-blocks',    '/api/edit/page-blocks'],
  ['pdf:edit:apply-edits',    '/api/edit/apply-edits'],
]

export function registerPdfHandlers() {
  for (const [channel, endpoint] of routes) {
    ipcMain.handle(channel, async (_event, params) => {
      try {
        const data = await pythonBridge.post(endpoint, params)
        return { success: true, data }
      } catch (err: any) {
        const message = err?.response?.data?.detail ?? err.message ?? 'Unknown error'
        return { success: false, error: message }
      }
    })
  }
}

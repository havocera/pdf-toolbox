import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

type RotateMode = 'rotate' | 'reorder'

export default function Rotate() {
  const [filePath, setFilePath] = useState('')
  const [fileName, setFileName] = useState('')
  const [mode, setMode] = useState<RotateMode>('rotate')
  const [rotateAll, setRotateAll] = useState<90 | 180 | 270>(90)
  const [reorderText, setReorderText] = useState('')
  const [outputDir, setOutputDir] = useState('')
  const [modal, setModal] = useState<{ visible: boolean; progress: number; status: 'processing' | 'done' | 'error' }>({ visible: false, progress: 0, status: 'processing' })
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState('')

  const handleFile = (paths: string[]) => {
    setFilePath(paths[0])
    setFileName(paths[0].split(/[/\\]/).pop() || paths[0])
    setResult(null)
  }

  const handleProcess = async () => {
    if (!filePath) return
    setResult(null)
    setError('')
    setModal({ visible: true, progress: 30, status: 'processing' })

    let res
    if (mode === 'rotate') {
      // rotate all pages by the same angle
      res = await window.electronAPI.pdf.rotate({
        input_path: filePath,
        output_dir: outputDir || undefined,
        rotations: { all: rotateAll },
      })
    } else {
      const order = reorderText
        .split(',')
        .map((s) => parseInt(s.trim()) - 1)
        .filter((n) => !isNaN(n))

      if (order.length === 0) {
        setModal({ visible: true, progress: 0, status: 'error' })
        setError('请输入有效的页码顺序，如：3, 1, 2')
        return
      }

      res = await window.electronAPI.pdf.rotate({
        input_path: filePath,
        output_dir: outputDir || undefined,
        new_order: order,
        mode: 'reorder',
      })
    }

    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult([(res.data as any).output])
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '处理失败')
    }
  }

  const reset = () => {
    setFilePath('')
    setFileName('')
    setResult(null)
    setError('')
    setModal({ visible: false, progress: 0, status: 'processing' })
  }

  return (
    <PageLayout title="旋转 / 重排页面">
      {result ? (
        <ResultPanel outputs={result} outputDir={outputDir} onReset={reset} />
      ) : (
        <div className="space-y-5">
          {!filePath ? (
            <FileDropZone onFiles={handleFile} multiple={false} />
          ) : (
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-red-500 text-xl">📄</span>
              <span className="flex-1 text-sm text-gray-700 truncate">{fileName}</span>
              <button onClick={() => setFilePath('')} className="text-gray-300 hover:text-red-400 text-xl">×</button>
            </div>
          )}

          {filePath && (
            <>
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <div className="flex gap-3">
                  {(['rotate', 'reorder'] as RotateMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        mode === m
                          ? 'border-purple-400 text-purple-600 bg-purple-50'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {m === 'rotate' ? '旋转页面' : '重排页面'}
                    </button>
                  ))}
                </div>

                {mode === 'rotate' && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">旋转角度（所有页面）</p>
                    <div className="flex gap-3">
                      {([90, 180, 270] as const).map((deg) => (
                        <button
                          key={deg}
                          onClick={() => setRotateAll(deg)}
                          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                            rotateAll === deg
                              ? 'border-purple-400 text-purple-600 bg-purple-50'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300'
                          }`}
                        >
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'reorder' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      新页面顺序（如：3, 1, 2 表示将第3页移到最前）
                    </label>
                    <input
                      type="text"
                      value={reorderText}
                      onChange={(e) => setReorderText(e.target.value)}
                      placeholder="3, 1, 2"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={async () => { const dir = await window.electronAPI.selectSaveDir(); if (dir) setOutputDir(dir) }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors"
              >
                {outputDir ? `📁 ${outputDir.split(/[/\\]/).pop()}` : '选择输出目录（可选）'}
              </button>

              <button
                onClick={handleProcess}
                className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: '#9B59B6' }}
              >
                {mode === 'rotate' ? '旋转页面' : '重排页面'}
              </button>
            </>
          )}
        </div>
      )}

      <ProgressModal
        visible={modal.visible}
        progress={modal.progress}
        status={modal.status as any}
        message={error}
        onClose={() => setModal((m) => ({ ...m, visible: false }))}
      />
    </PageLayout>
  )
}

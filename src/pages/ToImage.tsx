import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

type Fmt = 'jpeg' | 'png'

export default function ToImage() {
  const [filePath, setFilePath] = useState('')
  const [fileName, setFileName] = useState('')
  const [fmt, setFmt] = useState<Fmt>('jpeg')
  const [dpi, setDpi] = useState(150)
  const [outputDir, setOutputDir] = useState('')
  const [modal, setModal] = useState<{ visible: boolean; progress: number; status: 'processing' | 'done' | 'error' }>({ visible: false, progress: 0, status: 'processing' })
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState('')

  const handleFile = (paths: string[]) => {
    setFilePath(paths[0])
    setFileName(paths[0].split(/[/\\]/).pop() || paths[0])
    setResult(null)
  }

  const handleConvert = async () => {
    if (!filePath) return
    setResult(null)
    setError('')
    setModal({ visible: true, progress: 30, status: 'processing' })

    const res = await window.electronAPI.pdf.toImage({
      input_path: filePath,
      output_dir: outputDir || undefined,
      fmt,
      dpi,
    })

    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult((res.data as any).outputs)
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '转换失败')
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
    <PageLayout title="PDF 转图片">
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
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">输出格式</p>
                  <div className="flex gap-3">
                    {(['jpeg', 'png'] as Fmt[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFmt(f)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          fmt === f
                            ? 'border-orange-400 text-orange-600 bg-orange-50'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">分辨率（DPI）</p>
                  <div className="flex gap-3">
                    {[72, 150, 300].map((d) => (
                      <button
                        key={d}
                        onClick={() => setDpi(d)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                          dpi === d
                            ? 'border-orange-400 text-orange-600 bg-orange-50'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={async () => { const dir = await window.electronAPI.selectSaveDir(); if (dir) setOutputDir(dir) }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors"
              >
                {outputDir ? `📁 ${outputDir.split(/[/\\]/).pop()}` : '选择输出目录（可选）'}
              </button>

              <button
                onClick={handleConvert}
                className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: '#FF8C00' }}
              >
                转换为图片
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

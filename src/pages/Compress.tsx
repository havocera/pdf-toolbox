import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

type Level = 'low' | 'medium' | 'high'

const LEVELS: { value: Level; label: string; desc: string }[] = [
  { value: 'low',    label: '轻度压缩', desc: '文件略小，质量最佳' },
  { value: 'medium', label: '中度压缩', desc: '平衡质量与体积' },
  { value: 'high',   label: '深度压缩', desc: '体积最小，质量降低' },
]

export default function Compress() {
  const [filePath, setFilePath] = useState('')
  const [fileName, setFileName] = useState('')
  const [level, setLevel] = useState<Level>('medium')
  const [outputDir, setOutputDir] = useState('')
  const [modal, setModal] = useState<{ visible: boolean; progress: number; status: 'processing' | 'done' | 'error' }>({ visible: false, progress: 0, status: 'processing' })
  const [result, setResult] = useState<{ output: string; original_size: number; compressed_size: number; ratio: number } | null>(null)
  const [error, setError] = useState('')

  const handleFile = (paths: string[]) => {
    setFilePath(paths[0])
    setFileName(paths[0].split(/[/\\]/).pop() || paths[0])
    setResult(null)
  }

  const handleCompress = async () => {
    if (!filePath) return
    setResult(null)
    setError('')
    setModal({ visible: true, progress: 40, status: 'processing' })

    const res = await window.electronAPI.pdf.compress({
      input_path: filePath,
      output_dir: outputDir || undefined,
      level,
    })

    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult(res.data as any)
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '压缩失败')
    }
  }

  const reset = () => {
    setFilePath('')
    setFileName('')
    setResult(null)
    setError('')
    setModal({ visible: false, progress: 0, status: 'processing' })
  }

  const fmt = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / 1024 / 1024).toFixed(2)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`

  return (
    <PageLayout title="压缩 PDF">
      {result ? (
        <div className="space-y-5">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <p className="font-semibold text-green-800 mb-4">压缩完成</p>
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              <div>
                <p className="text-xs text-gray-400 mb-1">原始大小</p>
                <p className="font-semibold text-gray-700">{fmt(result.original_size)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">压缩后</p>
                <p className="font-semibold text-green-600">{fmt(result.compressed_size)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">压缩率</p>
                <p className="font-semibold text-green-600">{result.ratio}%</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.electronAPI.openFolder(result.output.replace(/[/\\][^/\\]+$/, ''))}
                className="flex-1 py-2.5 rounded-xl border border-green-400 text-green-700 font-medium hover:bg-green-100 transition-colors"
              >
                打开文件夹
              </button>
              <button
                onClick={reset}
                className="flex-1 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
                style={{ background: '#E8192C' }}
              >
                继续压缩
              </button>
            </div>
          </div>
        </div>
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
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-sm font-medium text-gray-700 mb-3">压缩级别</p>
                <div className="space-y-2">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                        level === l.value
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={`font-medium text-sm ${level === l.value ? 'text-red-600' : 'text-gray-700'}`}>
                        {l.label}
                      </span>
                      <span className="text-xs text-gray-400">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={async () => { const dir = await window.electronAPI.selectSaveDir(); if (dir) setOutputDir(dir) }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors"
              >
                {outputDir ? `📁 ${outputDir.split(/[/\\]/).pop()}` : '选择输出目录（可选）'}
              </button>

              <button
                onClick={handleCompress}
                className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: '#E8192C' }}
              >
                压缩 PDF
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

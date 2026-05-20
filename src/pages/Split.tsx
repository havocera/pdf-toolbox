import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

type SplitMode = 'every_page' | 'ranges'

export default function Split() {
  const [filePath, setFilePath] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')
  const [mode, setMode] = useState<SplitMode>('every_page')
  const [rangesText, setRangesText] = useState<string>('')
  const [outputDir, setOutputDir] = useState<string>('')
  const [modal, setModal] = useState<{ visible: boolean; progress: number; status: 'processing' | 'done' | 'error' }>({ visible: false, progress: 0, status: 'processing' })
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState<string>('')

  const handleFile = (paths: string[]) => {
    setFilePath(paths[0])
    setFileName(paths[0].split(/[/\\]/).pop() || paths[0])
    setResult(null)
  }

  const parseRanges = (): number[][] | null => {
    try {
      return rangesText.split(',').map((part) => {
        const [a, b] = part.trim().split('-').map((n) => parseInt(n.trim()) - 1)
        return b !== undefined ? [a, b] : [a, a]
      })
    } catch {
      return null
    }
  }

  const handleSplit = async () => {
    if (!filePath) return
    setResult(null)
    setError('')
    setModal({ visible: true, progress: 30, status: 'processing' })

    const params: Record<string, unknown> = {
      input_path: filePath,
      output_dir: outputDir || undefined,
      mode,
    }

    if (mode === 'ranges') {
      const ranges = parseRanges()
      if (!ranges) {
        setModal({ visible: true, progress: 0, status: 'error' })
        setError('页码格式错误，请使用如 "1-3, 4-6" 的格式')
        return
      }
      params.ranges = ranges
    }

    const res = await window.electronAPI.pdf.split(params)

    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult((res.data as any).outputs)
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '拆分失败')
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
    <PageLayout title="拆分 PDF">
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
                <p className="text-sm font-medium text-gray-700">拆分方式</p>
                <div className="flex gap-3">
                  {(['every_page', 'ranges'] as SplitMode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        mode === m
                          ? 'border-red-400 text-red-600 bg-red-50'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {m === 'every_page' ? '每页单独拆分' : '按页码范围'}
                    </button>
                  ))}
                </div>

                {mode === 'ranges' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">
                      页码范围（如：1-3, 4-6, 7）
                    </label>
                    <input
                      type="text"
                      value={rangesText}
                      onChange={(e) => setRangesText(e.target.value)}
                      placeholder="1-3, 4-6, 7"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
                    />
                  </div>
                )}
              </div>

              <button
                onClick={async () => {
                  const dir = await window.electronAPI.selectSaveDir()
                  if (dir) setOutputDir(dir)
                }}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors"
              >
                {outputDir ? `📁 ${outputDir.split(/[/\\]/).pop()}` : '选择输出目录（可选）'}
              </button>

              <button
                onClick={handleSplit}
                className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90"
                style={{ background: '#E8192C' }}
              >
                拆分 PDF
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

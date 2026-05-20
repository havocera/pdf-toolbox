import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

export default function ToWord() {
  const [filePath, setFilePath] = useState('')
  const [fileName, setFileName] = useState('')
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
    setModal({ visible: true, progress: 20, status: 'processing' })

    const res = await window.electronAPI.pdf.toWord({
      input_path: filePath,
      output_dir: outputDir || undefined,
    })

    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult([(res.data as any).output])
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
    <PageLayout title="PDF 转 Word">
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                将 PDF 转换为可编辑的 .docx 文件。转换质量取决于 PDF 的原始格式，扫描件效果有限。
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
                style={{ background: '#2B579A' }}
              >
                转换为 Word
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

import { useState } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import FileList, { FileItem } from '../components/FileList'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

export default function Merge() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [outputDir, setOutputDir] = useState<string>('')
  const [modal, setModal] = useState<{ visible: boolean; progress: number; status: 'processing' | 'done' | 'error' }>({ visible: false, progress: 0, status: 'processing' })
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState<string>('')

  const addFiles = (paths: string[]) => {
    const newItems: FileItem[] = paths.map((p) => ({
      id: p + Date.now(),
      path: p,
      name: p.split(/[/\\]/).pop() || p,
    }))
    setFiles((prev) => [...prev, ...newItems])
  }

  const selectOutputDir = async () => {
    const dir = await window.electronAPI.selectSaveDir()
    if (dir) setOutputDir(dir)
  }

  const handleMerge = async () => {
    if (files.length < 2) return
    setResult(null)
    setError('')
    setModal({ visible: true, progress: 30, status: 'processing' })

    const res = await window.electronAPI.pdf.merge({
      input_paths: files.map((f) => f.path),
      output_dir: outputDir || undefined,
    })

    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult([(res.data as any).output])
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '合并失败')
    }
  }

  const reset = () => {
    setFiles([])
    setResult(null)
    setError('')
    setModal({ visible: false, progress: 0, status: 'processing' })
  }

  return (
    <PageLayout title="合并 PDF">
      {result ? (
        <ResultPanel outputs={result} outputDir={outputDir} onReset={reset} />
      ) : (
        <div className="space-y-5">
          <FileDropZone onFiles={addFiles} />

          {files.length > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  已选 {files.length} 个文件（拖拽可调整顺序）
                </p>
                <FileList
                  files={files}
                  onChange={setFiles}
                  onRemove={(id) => setFiles((prev) => prev.filter((f) => f.id !== id))}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={selectOutputDir}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors"
                >
                  {outputDir ? `📁 ${outputDir.split(/[/\\]/).pop()}` : '选择输出目录（可选）'}
                </button>
              </div>

              <button
                onClick={handleMerge}
                disabled={files.length < 2}
                className="w-full py-3 rounded-xl text-white font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{ background: '#E8192C' }}
              >
                合并 PDF
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

import { useState } from 'react'

interface Props {
  onFiles: (paths: string[]) => void
  multiple?: boolean
}

export default function FileDropZone({ onFiles, multiple = true }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const paths = Array.from(e.dataTransfer.files)
      .filter((f) => f.name.toLowerCase().endsWith('.pdf'))
      .map((f) => (f as any).path as string)
    if (paths.length) onFiles(paths)
  }

  const handleClick = async () => {
    const paths = await window.electronAPI.selectFiles({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    })
    if (paths.length) onFiles(paths)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`
        border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200
        ${dragging
          ? 'border-red-400 bg-red-50'
          : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
        }
      `}
    >
      <div className="text-5xl mb-4 select-none">📄</div>
      <p className="text-base font-medium text-gray-700">拖拽 PDF 文件到此处</p>
      <p className="text-sm text-gray-400 mt-1">或点击选择文件</p>
      {multiple && (
        <p className="text-xs text-gray-300 mt-2">支持同时选择多个文件</p>
      )}
    </div>
  )
}

interface Props {
  outputs: string[]
  outputDir?: string
  onReset: () => void
}

export default function ResultPanel({ outputs, outputDir, onReset }: Props) {
  const handleOpenFolder = () => {
    const dir = outputDir || (outputs[0] ? outputs[0].replace(/[/\\][^/\\]+$/, '') : '')
    if (dir) window.electronAPI.openFolder(dir)
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-semibold text-green-800">处理完成</p>
          <p className="text-sm text-green-600">共生成 {outputs.length} 个文件</p>
        </div>
      </div>

      <div className="space-y-2 mb-5 max-h-40 overflow-y-auto">
        {outputs.map((p, i) => (
          <div key={i} className="text-xs text-gray-500 bg-white rounded-lg px-3 py-2 truncate">
            {p}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleOpenFolder}
          className="flex-1 py-2.5 rounded-xl border border-green-400 text-green-700 font-medium hover:bg-green-100 transition-colors"
        >
          打开文件夹
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-2.5 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
          style={{ background: '#E8192C' }}
        >
          继续处理
        </button>
      </div>
    </div>
  )
}

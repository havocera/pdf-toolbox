interface Props {
  visible: boolean
  progress: number
  status: 'processing' | 'done' | 'error'
  message?: string
  onClose: () => void
}

export default function ProgressModal({ visible, progress, status, message, onClose }: Props) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl">
        <h3 className="text-lg font-semibold mb-5 text-gray-900">
          {status === 'done' ? '处理完成' : status === 'error' ? '处理失败' : '正在处理...'}
        </h3>

        {status !== 'error' && (
          <>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
              <div
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  background: status === 'done' ? '#00A86B' : '#E8192C',
                }}
              />
            </div>
            <p className="text-sm text-gray-400 text-center mb-5">{progress}%</p>
          </>
        )}

        {status === 'error' && message && (
          <p className="text-sm text-red-500 mb-5 bg-red-50 rounded-lg p-3">{message}</p>
        )}

        {(status === 'done' || status === 'error') && (
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
            style={{ background: status === 'done' ? '#00A86B' : '#E8192C' }}
          >
            {status === 'done' ? '查看结果' : '关闭'}
          </button>
        )}
      </div>
    </div>
  )
}

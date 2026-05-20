import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  children: React.ReactNode
}

export default function PageLayout({ title, children }: Props) {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-gray-700 transition-colors text-sm flex items-center gap-1"
        >
          ← 返回
        </button>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
          style={{ background: '#E8192C' }}
        >
          P
        </div>
        <span className="text-lg font-semibold text-gray-900">{title}</span>
      </header>
      <div className="max-w-3xl mx-auto px-8 py-10">{children}</div>
    </div>
  )
}

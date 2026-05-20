import { useNavigate } from 'react-router-dom'

const TOOLS = [
  {
    id: 'merge',
    icon: '🔗',
    title: '合并 PDF',
    desc: '将多个 PDF 合并为一个文件',
    color: '#E8192C',
    bg: '#fff0f1',
    path: '/merge',
  },
  {
    id: 'split',
    icon: '✂️',
    title: '拆分 PDF',
    desc: '按页范围或逐页拆分 PDF',
    color: '#0066FF',
    bg: '#f0f4ff',
    path: '/split',
  },
  {
    id: 'compress',
    icon: '🗜️',
    title: '压缩 PDF',
    desc: '减小文件体积，保留质量',
    color: '#00A86B',
    bg: '#f0fff8',
    path: '/compress',
  },
  {
    id: 'to-word',
    icon: '📝',
    title: 'PDF 转 Word',
    desc: '转换为可编辑的 .docx 文件',
    color: '#2B579A',
    bg: '#f0f4ff',
    path: '/to-word',
  },
  {
    id: 'to-image',
    icon: '🖼️',
    title: 'PDF 转图片',
    desc: '每页导出为 JPG 或 PNG',
    color: '#FF8C00',
    bg: '#fff8f0',
    path: '/to-image',
  },
  {
    id: 'rotate',
    icon: '🔄',
    title: '旋转页面',
    desc: '旋转或重新排列 PDF 页面',
    color: '#9B59B6',
    bg: '#faf0ff',
    path: '/rotate',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          style={{ background: '#E8192C' }}
        >
          P
        </div>
        <span className="text-xl font-bold text-gray-900">PDF 工具箱</span>
        <div className="flex-1" />
        <a
          href="https://ifdian.net/a/ihavoc"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-amber-300 text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          ☕ 请作者喝杯咖啡
        </a>
      </header>

      {/* Hero */}
      <div className="text-center py-14 px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          每个 PDF 问题，都有解决方案
        </h1>
        <p className="text-gray-500 text-lg">免费、离线、快速的 PDF 处理工具</p>
      </div>

      {/* Tool Grid */}
      <div className="max-w-5xl mx-auto px-8 pb-10 grid grid-cols-3 gap-5 auto-rows-fr">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigate(tool.path)}
            className="group text-left rounded-2xl p-6 border border-gray-200 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer"
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
              style={{ background: tool.bg }}
            >
              {tool.icon}
            </div>
            <h3
              className="text-lg font-semibold mb-1 group-hover:opacity-80 transition-opacity"
              style={{ color: tool.color }}
            >
              {tool.title}
            </h3>
            <p className="text-sm text-gray-500">{tool.desc}</p>
          </button>
        ))}
      </div>

      {/* Donate footer */}
      <div className="max-w-5xl mx-auto px-8 pb-12 text-center">
        <div className="border border-amber-200 bg-amber-50 rounded-2xl px-8 py-6 inline-flex flex-col items-center gap-3">
          <p className="text-gray-600 text-sm">如果这个工具对你有帮助，欢迎请作者喝杯咖啡 ☕</p>
          <a
            href="https://ifdian.net/a/ihavoc"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ background: '#f59e0b' }}
          >
            ❤️ 支持作者
          </a>
          <p className="text-xs text-gray-400">跳转到爱发电捐赠页面</p>
        </div>
      </div>
    </div>
  )
}

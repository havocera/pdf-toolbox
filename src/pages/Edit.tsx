import { useState, useRef, useCallback } from 'react'
import PageLayout from '../components/PageLayout'
import FileDropZone from '../components/FileDropZone'
import ProgressModal from '../components/ProgressModal'
import ResultPanel from '../components/ResultPanel'

type UIMode = 'edit' | 'extract-images' | 'extract-text' | 'insert-stamp'

interface Span {
  text: string
  bbox: [number, number, number, number]
  font: string
  size: number
  color_hex: string
  bold: boolean
  italic: boolean
}

interface TextBlock { id: string; bbox: [number, number, number, number]; spans: Span[] }
interface ImageBlock { id: string; bbox: [number, number, number, number] }
interface ExtractedImage { path: string; ext: string; width: number; height: number; page: number; thumbnail: string }

interface BlockEdit {
  new_text: string
  font_size: number
  color_hex: string
  bold: boolean
  italic: boolean
  original_bbox: [number, number, number, number]
  dirty: boolean
}

type EditMap = Record<string, BlockEdit>

interface ClickPos { pdfX: number; pdfY: number; displayX: number; displayY: number }
export default function Edit() {
  // File
  const [filePath, setFilePath] = useState('')
  const [fileName, setFileName] = useState('')

  // Page
  const [currentPage, setCurrentPage] = useState(0)
  const [pageCount, setPageCount] = useState(0)
  const [pageImage, setPageImage] = useState('')
  const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 })
  const [imgLoaded, setImgLoaded] = useState(false)
  const [pageLoading, setPageLoading] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Blocks
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [imageBlocks, setImageBlocks] = useState<ImageBlock[]>([])
  const [editMap, setEditMap] = useState<EditMap>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Toolbar
  const [toolbar, setToolbar] = useState({ fontSize: 12, color: '#000000', bold: false, italic: false })

  // UI mode
  const [uiMode, setUIMode] = useState<UIMode>('edit')

  // Side panel state
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([])
  const [extracting, setExtracting] = useState(false)
  const [textPages, setTextPages] = useState<string[]>([])
  const [textPageIdx, setTextPageIdx] = useState(0)
  const [stampPath, setStampPath] = useState('')
  const [stampName, setStampName] = useState('')
  const [stampSize, setStampSize] = useState({ w: 120, h: 120 })
  const [clickPos, setClickPos] = useState<ClickPos | null>(null)

  // Output / result
  const [outputDir, setOutputDir] = useState('')
  const [modal, setModal] = useState<{ visible: boolean; progress: number; status: 'processing' | 'done' | 'error' }>({ visible: false, progress: 0, status: 'processing' })
  const [result, setResult] = useState<string[] | null>(null)
  const [error, setError] = useState('')
  const pdfToDisplay = useCallback((bbox: [number, number, number, number]) => {
    if (!imgRef.current || pdfSize.width === 0) return null
    const w = imgRef.current.offsetWidth
    const h = imgRef.current.offsetHeight
    if (!w || !h) return null
    const sx = w / pdfSize.width
    const sy = h / pdfSize.height
    return { left: bbox[0] * sx, top: bbox[1] * sy, width: (bbox[2] - bbox[0]) * sx, height: (bbox[3] - bbox[1]) * sy }
  }, [pdfSize, imgLoaded])

  const loadPage = useCallback(async (path: string, idx: number) => {
    setPageLoading(true)
    setImgLoaded(false)
    setSelectedId(null)
    const [renderRes, blocksRes] = await Promise.all([
      window.electronAPI.pdf.edit.renderPage({ input_path: path, page_index: idx }),
      window.electronAPI.pdf.edit.pageBlocks({ input_path: path, page_index: idx }),
    ])
    setPageLoading(false)
    if (renderRes.success) {
      const d = renderRes.data as any
      setPageImage(d.image)
      setPdfSize({ width: d.pdf_width, height: d.pdf_height })
      setPageCount(d.page_count)
    }
    if (blocksRes.success) {
      const d = blocksRes.data as any
      setTextBlocks(d.text_blocks)
      setImageBlocks(d.image_blocks)
      const map: EditMap = {}
      for (const block of d.text_blocks as TextBlock[]) {
        const s = block.spans[0]
        map[block.id] = {
          new_text: block.spans.map(sp => sp.text).join(''),
          font_size: s?.size ?? 12,
          color_hex: s?.color_hex ?? '#000000',
          bold: s?.bold ?? false,
          italic: s?.italic ?? false,
          original_bbox: block.bbox,
          dirty: false,
        }
      }
      setEditMap(map)
    }
  }, [])

  const handleFile = async (paths: string[]) => {
    const p = paths[0]
    setFilePath(p)
    setFileName(p.split(/[/\\]/).pop() || p)
    setCurrentPage(0)
    setExtractedImages([])
    setTextPages([])
    setResult(null)
    setClickPos(null)
    await loadPage(p, 0)
  }

  const changePage = async (idx: number) => {
    if (idx < 0 || idx >= pageCount) return
    const hasDirty = Object.values(editMap).some(e => e.dirty)
    if (hasDirty && !confirm('当前页有未保存的修改，切换页面将丢失。继续？')) return
    setCurrentPage(idx)
    await loadPage(filePath, idx)
  }

  const selectBlock = (block: TextBlock) => {
    setSelectedId(block.id)
    const e = editMap[block.id]
    if (e) setToolbar({ fontSize: e.font_size, color: e.color_hex, bold: e.bold, italic: e.italic })
  }

  const applyToolbar = (patch: Partial<typeof toolbar>) => {
    setToolbar(t => ({ ...t, ...patch }))
    if (!selectedId) return
    setEditMap(m => ({
      ...m,
      [selectedId]: {
        ...m[selectedId],
        ...(patch.fontSize !== undefined && { font_size: patch.fontSize }),
        ...(patch.color !== undefined && { color_hex: patch.color }),
        ...(patch.bold !== undefined && { bold: patch.bold }),
        ...(patch.italic !== undefined && { italic: patch.italic }),
        dirty: true,
      }
    }))
  }
  const hasDirty = Object.values(editMap).some(e => e.dirty)

  const handleApplyEdits = async () => {
    const dirtyEdits = Object.entries(editMap)
      .filter(([, v]) => v.dirty)
      .map(([blockId, v]) => ({
        block_id: blockId, original_bbox: v.original_bbox,
        new_text: v.new_text, font_size: v.font_size,
        color_hex: v.color_hex, bold: v.bold, italic: v.italic,
      }))
    setError(''); setResult(null)
    setModal({ visible: true, progress: 50, status: 'processing' })
    const res = await window.electronAPI.pdf.edit.applyEdits({
      input_path: filePath, output_dir: outputDir || undefined,
      page_index: currentPage, edits: dirtyEdits,
    })
    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult([(res.data as any).output])
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '保存失败')
    }
  }

  const handleExtractImages = async () => {
    setExtracting(true)
    const res = await window.electronAPI.pdf.edit.extractImages({ input_path: filePath })
    setExtracting(false)
    if (res.success) setExtractedImages((res.data as any).images)
  }

  const handleExtractText = async () => {
    const res = await window.electronAPI.pdf.edit.extractText({ input_path: filePath })
    if (res.success) { const d = res.data as any; setTextPages(d.pages); setTextPageIdx(0) }
  }

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return
    const imgRect = imgRef.current.getBoundingClientRect()
    const displayX = e.clientX - imgRect.left
    const displayY = e.clientY - imgRect.top
    setClickPos({
      pdfX: (displayX / imgRef.current.offsetWidth) * pdfSize.width,
      pdfY: (displayY / imgRef.current.offsetHeight) * pdfSize.height,
      displayX: (displayX / imgRef.current.offsetWidth) * imgRef.current.offsetWidth,
      displayY: (displayY / imgRef.current.offsetHeight) * imgRef.current.offsetHeight,
    })
  }

  const handleInsertStamp = async () => {
    if (!clickPos || !stampPath) return
    setError(''); setResult(null)
    setModal({ visible: true, progress: 50, status: 'processing' })
    const hw = stampSize.w / 2, hh = stampSize.h / 2
    const res = await window.electronAPI.pdf.edit.insertImage({
      input_path: filePath, output_dir: outputDir || undefined,
      page_index: currentPage,
      x0: clickPos.pdfX - hw, y0: clickPos.pdfY - hh,
      x1: clickPos.pdfX + hw, y1: clickPos.pdfY + hh,
      image_path: stampPath,
    })
    if (res.success) {
      setModal({ visible: true, progress: 100, status: 'done' })
      setResult([(res.data as any).output])
    } else {
      setModal({ visible: true, progress: 0, status: 'error' })
      setError(res.error || '失败')
    }
  }

  // ── Toolbar ──────────────────────────────────────────────────────────────
  const toolbar_ui = (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white flex-wrap">
      {/* Text format tools */}
      <input type="number" min={6} max={96} value={toolbar.fontSize} disabled={!selectedId}
        onChange={e => applyToolbar({ fontSize: Number(e.target.value) })}
        className="w-14 border border-gray-200 rounded px-2 py-1 text-sm disabled:opacity-40" />
      <input type="color" value={toolbar.color} disabled={!selectedId}
        onChange={e => applyToolbar({ color: e.target.value })}
        className="w-8 h-8 border border-gray-200 rounded cursor-pointer disabled:opacity-40" title="文字颜色" />
      <button disabled={!selectedId} onClick={() => applyToolbar({ bold: !toolbar.bold })}
        className={`px-2.5 py-1 rounded border text-sm font-bold transition-colors disabled:opacity-40 ${toolbar.bold ? 'bg-gray-200 border-gray-400' : 'border-gray-200 hover:border-gray-400'}`}>B</button>
      <button disabled={!selectedId} onClick={() => applyToolbar({ italic: !toolbar.italic })}
        className={`px-2.5 py-1 rounded border text-sm italic transition-colors disabled:opacity-40 ${toolbar.italic ? 'bg-gray-200 border-gray-400' : 'border-gray-200 hover:border-gray-400'}`}>I</button>

      <div className="w-px h-5 bg-gray-200 mx-1" />

      {/* Mode buttons */}
      {(['extract-images', 'extract-text', 'insert-stamp'] as UIMode[]).map(m => {
        const labels: Record<string, string> = { 'extract-images': '🖼️ 提取图片', 'extract-text': '📋 提取文字', 'insert-stamp': '🔖 插入印章' }
        return (
          <button key={m} onClick={() => setUIMode(uiMode === m ? 'edit' : m)}
            className={`px-3 py-1 rounded border text-sm transition-colors ${uiMode === m ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            {labels[m]}
          </button>
        )
      })}

      <div className="flex-1" />

      <button onClick={async () => { const d = await window.electronAPI.selectSaveDir(); if (d) setOutputDir(d) }}
        className="px-3 py-1 rounded border border-gray-200 text-sm text-gray-500 hover:border-gray-400 transition-colors">
        {outputDir ? `📁 ${outputDir.split(/[/\\]/).pop()}` : '输出目录'}
      </button>
      <button onClick={handleApplyEdits} disabled={!hasDirty}
        className="px-4 py-1.5 rounded text-white text-sm font-medium disabled:opacity-40 transition-opacity hover:opacity-90"
        style={{ background: '#E8192C' }}>
        保存编辑
      </button>
    </div>
  )
  // ── Page viewer with editable overlay ────────────────────────────────────
  const editor_area = (
    <div className="flex-1 min-w-0 overflow-auto bg-gray-100 rounded-xl p-4 flex flex-col items-center gap-3">
      {pageLoading && <div className="text-gray-400 text-sm py-8">渲染中...</div>}

      {pageImage && (
        <div className="relative inline-block shadow-lg" style={{ lineHeight: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null) }}>

          {/* Background: rendered PDF page */}
          <img ref={imgRef} src={`data:image/png;base64,${pageImage}`}
            alt={`第${currentPage + 1}页`} draggable={false}
            style={{ display: 'block', maxHeight: '72vh', width: 'auto' }}
            onLoad={() => requestAnimationFrame(() => setImgLoaded(true))} />

          {/* Editable text block overlays */}
          {imgLoaded && uiMode === 'edit' && textBlocks.map(block => {
            const pos = pdfToDisplay(block.bbox)
            if (!pos) return null
            const edit = editMap[block.id]
            const isSel = selectedId === block.id
            return (
              <div key={block.id}
                style={{ position: 'absolute', left: pos.left, top: pos.top, width: pos.width, minHeight: pos.height, boxSizing: 'border-box' }}
                className={`group cursor-text rounded-sm transition-all ${isSel ? 'ring-2 ring-blue-400 bg-white/90' : 'hover:ring-1 hover:ring-blue-300'}`}
                onClick={e => { e.stopPropagation(); selectBlock(block) }}>
                {isSel ? (
                  <textarea autoFocus value={edit?.new_text ?? ''}
                    onChange={e => setEditMap(m => ({ ...m, [block.id]: { ...m[block.id], new_text: e.target.value, dirty: true } }))}
                    style={{ width: '100%', minHeight: pos.height, border: 'none', outline: 'none', background: 'transparent', resize: 'none', padding: '1px 2px', lineHeight: 1.3,
                      fontSize: `${(edit?.font_size ?? 12) * (pos.height / (block.bbox[3] - block.bbox[1]))}px`,
                      fontWeight: edit?.bold ? 'bold' : 'normal', fontStyle: edit?.italic ? 'italic' : 'normal', color: edit?.color_hex ?? '#000' }} />
                ) : (
                  edit?.dirty ? (
                    <div style={{ padding: '1px 2px', lineHeight: 1.3, pointerEvents: 'none', whiteSpace: 'pre-wrap', color: '#1d4ed8',
                      fontSize: `${(edit.font_size) * (pos.height / (block.bbox[3] - block.bbox[1]))}px`,
                      fontWeight: edit.bold ? 'bold' : 'normal', fontStyle: edit.italic ? 'italic' : 'normal' }}>
                      {edit.new_text}
                    </div>
                  ) : <div style={{ width: '100%', height: pos.height }} />
                )}
              </div>
            )
          })}

          {/* Image block outlines */}
          {imgLoaded && imageBlocks.map(block => {
            const pos = pdfToDisplay(block.bbox)
            if (!pos) return null
            return (
              <div key={block.id} title="点击提取图片"
                style={{ position: 'absolute', left: pos.left, top: pos.top, width: pos.width, height: pos.height, boxSizing: 'border-box' }}
                className="border border-dashed border-amber-400 cursor-pointer hover:bg-amber-50/40 transition-colors"
                onClick={() => setUIMode('extract-images')} />
            )
          })}

          {/* Insert stamp click overlay */}
          {uiMode === 'insert-stamp' && imgLoaded && (
            <div className="absolute inset-0 cursor-crosshair" onClick={handlePageClick} />
          )}
          {clickPos && uiMode === 'insert-stamp' && (
            <div className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              style={{ left: clickPos.displayX, top: clickPos.displayY }}>
              <div className="w-full h-full rounded-full bg-red-500 opacity-60 animate-ping absolute" />
              <div className="w-full h-full rounded-full bg-red-500 relative" />
            </div>
          )}
        </div>
      )}

      {/* Page navigation */}
      {pageCount > 1 && (
        <div className="flex items-center gap-4">
          <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 0}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-30 hover:border-gray-500 transition-colors bg-white">← 上一页</button>
          <span className="text-sm text-gray-500">{currentPage + 1} / {pageCount}</span>
          <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === pageCount - 1}
            className="px-3 py-1 rounded-lg border border-gray-300 text-sm disabled:opacity-30 hover:border-gray-500 transition-colors bg-white">下一页 →</button>
        </div>
      )}
    </div>
  )
  // ── Right side panel ─────────────────────────────────────────────────────
  const side_panel = uiMode !== 'edit' && (
    <div className="w-72 shrink-0 bg-white border border-gray-200 rounded-xl p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '80vh' }}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-gray-700">
          {uiMode === 'extract-images' ? '提取图片' : uiMode === 'extract-text' ? '提取文字' : '插入印章'}
        </span>
        <button onClick={() => setUIMode('edit')} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {/* Extract images panel */}
      {uiMode === 'extract-images' && (
        <>
          <button onClick={handleExtractImages} disabled={extracting}
            className="w-full py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ background: '#E8192C' }}>
            {extracting ? '提取中...' : '提取所有图片'}
          </button>
          {extractedImages.length === 0 && !extracting && (
            <p className="text-xs text-gray-400 text-center">点击上方按钮提取 PDF 中的图片和印章</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            {extractedImages.map((img, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <img src={`data:image/${img.ext};base64,${img.thumbnail}`} alt={`图片${i+1}`} className="w-full h-20 object-contain p-1" />
                <div className="px-2 pb-2">
                  <p className="text-xs text-gray-400 truncate">{img.width}×{img.height}</p>
                  <button onClick={() => window.electronAPI.openFolder(img.path.replace(/[/\\][^/\\]+$/, ''))}
                    className="w-full text-xs py-1 mt-1 rounded border border-gray-200 hover:border-gray-400 transition-colors">打开目录</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Extract text panel */}
      {uiMode === 'extract-text' && (
        <>
          <button onClick={handleExtractText}
            className="w-full py-2 rounded-xl text-white text-sm font-medium"
            style={{ background: '#E8192C' }}>提取文字内容</button>
          {textPages.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              {textPages.map((_, i) => (
                <button key={i} onClick={() => setTextPageIdx(i)}
                  className={`px-2 py-0.5 rounded text-xs border transition-colors ${textPageIdx === i ? 'border-red-400 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500'}`}>
                  第{i+1}页
                </button>
              ))}
            </div>
          )}
          {textPages[textPageIdx] && (
            <>
              <textarea readOnly value={textPages[textPageIdx]}
                className="w-full h-48 text-xs border border-gray-200 rounded-xl p-3 resize-none bg-gray-50 focus:outline-none" />
              <button onClick={() => navigator.clipboard.writeText(textPages[textPageIdx])}
                className="w-full py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors">复制文字</button>
            </>
          )}
        </>
      )}

      {/* Insert stamp panel */}
      {uiMode === 'insert-stamp' && (
        <>
          <p className="text-xs text-blue-600 bg-blue-50 rounded-xl px-3 py-2">选择印章图片，然后点击左侧页面定位</p>
          <button onClick={async () => {
            const paths = await window.electronAPI.selectFiles({ filters: [{ name: '图片', extensions: ['png','jpg','jpeg','bmp'] }], properties: ['openFile'] })
            if (paths[0]) { setStampPath(paths[0]); setStampName(paths[0].split(/[/\\]/).pop() || '') }
          }} className="w-full py-2 rounded-xl border border-gray-300 text-sm text-gray-600 hover:border-gray-400 transition-colors">
            {stampName ? `🖼️ ${stampName}` : '选择印章图片'}
          </button>
          {stampPath && <img src={`file://${stampPath}`} alt="stamp" className="w-full max-h-24 object-contain border border-gray-200 rounded-xl p-2" />}
          {clickPos && <p className="text-xs text-green-600 bg-green-50 rounded-xl px-3 py-2">已选位置：({Math.round(clickPos.pdfX)}, {Math.round(clickPos.pdfY)})</p>}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">宽(pt)</label>
              <input type="number" value={stampSize.w} min={20} max={500}
                onChange={e => setStampSize(s => ({ ...s, w: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">高(pt)</label>
              <input type="number" value={stampSize.h} min={20} max={500}
                onChange={e => setStampSize(s => ({ ...s, h: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-red-400" />
            </div>
          </div>
          <button onClick={handleInsertStamp} disabled={!clickPos || !stampPath}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-40"
            style={{ background: '#E8192C' }}>插入印章</button>
        </>
      )}
    </div>
  )
  // ── Main render ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <PageLayout title="PDF 编辑">
        <ResultPanel outputs={result} outputDir={outputDir} onReset={() => { setResult(null); setClickPos(null) }} />
      </PageLayout>
    )
  }

  if (!filePath) {
    return (
      <PageLayout title="PDF 编辑">
        <FileDropZone onFiles={handleFile} multiple={false} />
      </PageLayout>
    )
  }

  return (
    <PageLayout title="PDF 编辑">
      <div className="flex flex-col gap-0 -mx-8 -mt-10">
        {/* File bar */}
        <div className="flex items-center gap-3 px-8 py-3 border-b border-gray-200 bg-white">
          <span className="text-red-500">📄</span>
          <span className="flex-1 text-sm text-gray-700 truncate font-medium">{fileName}</span>
          {hasDirty && <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">有未保存修改</span>}
          <button onClick={() => { setFilePath(''); setPageImage(''); setTextBlocks([]); setImageBlocks([]) }}
            className="text-gray-300 hover:text-red-400 text-xl transition-colors">×</button>
        </div>

        {/* Toolbar */}
        {toolbar_ui}

        {/* Editor area */}
        <div className="flex gap-4 p-4 bg-gray-50 min-h-0">
          {editor_area}
          {side_panel}
        </div>
      </div>

      <ProgressModal visible={modal.visible} progress={modal.progress} status={modal.status}
        message={error} onClose={() => setModal(m => ({ ...m, visible: false }))} />
    </PageLayout>
  )
}

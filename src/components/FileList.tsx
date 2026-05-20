import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface FileItem {
  id: string
  path: string
  name: string
}

interface Props {
  files: FileItem[]
  onChange: (files: FileItem[]) => void
  onRemove: (id: string) => void
}

function SortableFile({ file, onRemove }: { file: FileItem; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: file.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-white border rounded-xl px-4 py-3 ${
        isDragging ? 'shadow-lg border-red-300 opacity-80' : 'border-gray-200'
      }`}
    >
      <span
        {...attributes}
        {...listeners}
        className="text-gray-300 cursor-grab active:cursor-grabbing select-none text-lg"
      >
        ⠿
      </span>
      <span className="text-red-500 text-lg">📄</span>
      <span className="flex-1 text-sm text-gray-700 truncate">{file.name}</span>
      <button
        onClick={() => onRemove(file.id)}
        className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
      >
        ×
      </button>
    </div>
  )
}

export default function FileList({ files, onChange, onRemove }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = files.findIndex((f) => f.id === active.id)
      const newIndex = files.findIndex((f) => f.id === over.id)
      onChange(arrayMove(files, oldIndex, newIndex))
    }
  }

  if (files.length === 0) return null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {files.map((file) => (
            <SortableFile key={file.id} file={file} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export type { FileItem }

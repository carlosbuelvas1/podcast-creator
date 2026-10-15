import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useStore, useProject } from '../context'
import StepSheet from './StepSheet'
import { Segmented } from '../Sheet'
import { PlusIcon } from '../icons'
import { byDueDate, daysUntil, dueLabel } from '../dates'
import { COLUMNS, PEOPLE, personClass, progressOf } from '../constants'

export default function Tareas() {
  const { actions, me } = useStore()
  const { tasks, phases } = useProject()
  const current = phases.find((ph) => progressOf(tasks.filter((t) => t.phase_id === ph.id)).pct < 100) ?? phases[0]
  const phaseName = Object.fromEntries(phases.map((p) => [p.id, p.title]))
  const phaseOrder = Object.fromEntries(phases.map((p) => [p.id, p.position]))
  const byPlan = (a, b) =>
    a.due_date || b.due_date ? byDueDate(a, b) : phaseOrder[a.phase_id] - phaseOrder[b.phase_id] || a.position - b.position
  const [filter, setFilter] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [editing, setEditing] = useState(null)

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  )

  const visible = tasks.filter((t) => filter === 'all' || t.owner === filter)
  const active = tasks.find((t) => t.id === activeId)

  const onDragEnd = ({ active, over }) => {
    setActiveId(null)
    const task = tasks.find((t) => t.id === active.id)
    if (task && over && task.status !== over.id) actions.updateTask(task.id, { status: over.id })
  }

  return (
    <>
      <div className="page-head">
        <h1>Tareas</h1>
        <button className="btn primary" onClick={() => setEditing({ status: 'todo', owner: me, phase_id: current?.id })}>
          <PlusIcon width={18} height={18} /> Nueva
        </button>
      </div>

      <Segmented
        name="Filtrar por persona"
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'Todas' }, ...PEOPLE.map((p) => ({ value: p, label: p }))]}
      />
      <p className="hint">Mantén presionada una tarea y arrástrala a otra columna.</p>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="board">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={visible.filter((t) => t.status === col.id).sort(byPlan)}
              onOpen={setEditing}
              phaseName={phaseName}
              onAdd={() => setEditing({ status: col.id, owner: filter === 'all' ? me : filter, phase_id: current?.id })}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{active ? <TaskCard task={active} phase={phaseName[active.phase_id]} overlay /> : null}</DragOverlay>
      </DndContext>

      {editing && <StepSheet task={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function Column({ column, tasks, onOpen, onAdd, phaseName }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section ref={setNodeRef} className={`column ${column.id} ${isOver ? 'over' : ''}`}>
      <div className="column-head">
        <h2>{column.label}</h2>
        <span className="count">{tasks.length}</span>
        <button className="icon-btn" onClick={onAdd} aria-label={`Añadir tarea en ${column.label}`}>
          <PlusIcon width={18} height={18} />
        </button>
      </div>
      <div className="column-body">
        {tasks.map((t) => (
          <DraggableTask key={t.id} task={t} onOpen={onOpen} phase={phaseName[t.phase_id]} />
        ))}
        {tasks.length === 0 && <p className="drop-empty">Suelta una tarea aquí</p>}
      </div>
    </section>
  )
}

function DraggableTask({ task, onOpen, phase }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: task.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={`drag ${isDragging ? 'ghost' : ''}`}>
      <TaskCard task={task} phase={phase} onClick={() => onOpen(task)} />
    </div>
  )
}

function TaskCard({ task, onClick, overlay, phase }) {
  const late = task.status !== 'done' && daysUntil(task.due_date) < 0
  return (
    <div
      className={`task ${task.status} ${overlay ? 'overlay-card' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {phase && <p className="task-phase">{phase}</p>}
      <p className="task-title">{task.title}</p>
      <div className="task-meta">
        <span className={`owner ${personClass(task.owner)}`}>{task.owner ?? 'Sin asignar'}</span>
        {task.due_date && <span className={`due ${late ? 'late' : ''}`}>{dueLabel(task.due_date)}</span>}
      </div>
    </div>
  )
}

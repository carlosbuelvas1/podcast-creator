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
import { useStore } from '../context'
import Sheet, { Segmented } from '../Sheet'
import { PlusIcon, TrashIcon } from '../icons'
import { byDueDate, daysUntil, dueLabel } from '../dates'
import { COLUMNS, PEOPLE, personClass } from '../constants'

export default function Tareas() {
  const { tasks, actions, me } = useStore()
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
        <button className="btn primary" onClick={() => setEditing({ status: 'todo', owner: me })}>
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
              tasks={visible.filter((t) => t.status === col.id).sort(byDueDate)}
              onOpen={setEditing}
              onAdd={() => setEditing({ status: col.id, owner: filter === 'all' ? me : filter })}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>{active ? <TaskCard task={active} overlay /> : null}</DragOverlay>
      </DndContext>

      {editing && <TaskEditor task={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function Column({ column, tasks, onOpen, onAdd }) {
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
          <DraggableTask key={t.id} task={t} onOpen={onOpen} />
        ))}
        {tasks.length === 0 && <p className="drop-empty">Suelta una tarea aquí</p>}
      </div>
    </section>
  )
}

function DraggableTask({ task, onOpen }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: task.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={`drag ${isDragging ? 'ghost' : ''}`}>
      <TaskCard task={task} onClick={() => onOpen(task)} />
    </div>
  )
}

function TaskCard({ task, onClick, overlay }) {
  const late = task.status !== 'done' && daysUntil(task.due_date) < 0
  return (
    <div
      className={`task ${task.status} ${overlay ? 'overlay-card' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <p className="task-title">{task.title}</p>
      <div className="task-meta">
        <span className={`owner ${personClass(task.owner)}`}>{task.owner}</span>
        {task.due_date && <span className={`due ${late ? 'late' : ''}`}>{dueLabel(task.due_date)}</span>}
      </div>
    </div>
  )
}

function TaskEditor({ task, onClose }) {
  const { actions } = useStore()
  const [title, setTitle] = useState(task.title ?? '')
  const [owner, setOwner] = useState(task.owner ?? PEOPLE[0])
  const [due, setDue] = useState(task.due_date ?? '')
  const [status, setStatus] = useState(task.status ?? 'todo')
  const isNew = !task.id

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const fields = { title: title.trim(), owner, due_date: due || null, status }
    if (isNew) actions.addTask(fields)
    else actions.updateTask(task.id, fields)
    onClose()
  }

  const remove = () => {
    if (window.confirm('¿Borrar esta tarea?')) {
      actions.deleteTask(task.id)
      onClose()
    }
  }

  return (
    <Sheet title={isNew ? 'Nueva tarea' : 'Editar tarea'} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>¿Qué hay que hacer?</span>
          <input autoFocus={isNew} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Grabar la intro" required />
        </label>
        <div className="field">
          <span>¿Quién se encarga?</span>
          <Segmented
            name="Responsable"
            value={owner}
            onChange={setOwner}
            options={PEOPLE.map((p) => ({ value: p, label: p, className: personClass(p) }))}
          />
        </div>
        <label className="field">
          <span>Fecha límite</span>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <div className="field">
          <span>Estado</span>
          <Segmented name="Estado" value={status} onChange={setStatus} options={COLUMNS.map((c) => ({ value: c.id, label: c.label }))} />
        </div>
        <button className="btn primary full">{isNew ? 'Crear tarea' : 'Guardar'}</button>
        {!isNew && (
          <button type="button" className="btn danger-ghost full" onClick={remove}>
            <TrashIcon width={18} height={18} /> Borrar tarea
          </button>
        )}
      </form>
    </Sheet>
  )
}

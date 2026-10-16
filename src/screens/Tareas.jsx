import { useRef, useState } from 'react'
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
import { buildIndex, lockReason, lockState, phaseProgress } from '../recommend'
import { LockIcon } from '../icons'
import { t } from '../i18n'

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
  const [column, setColumn] = useState('todo')
  const track = useRef(null)
  const pick = (id) => {
    setColumn(id)
    const i = COLUMNS.findIndex((c) => c.id === id)
    track.current?.scrollTo({ left: i * track.current.clientWidth })
  }
  const onSwipe = (e) => {
    const id = COLUMNS[Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth)]?.id
    if (id && id !== column) setColumn(id)
  }
  const onKeys = (e) => {
    const i = COLUMNS.findIndex((c) => c.id === column)
    const next = COLUMNS[e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : -1]
    if (e.target !== e.currentTarget || !next) return
    e.preventDefault()
    pick(next.id)
  }
  const index = buildIndex(phases, tasks)
  const progress = phaseProgress(phases, tasks)
  const lockOf = (t) => (t.status === 'done' ? '' : lockReason(lockState(t, phases, tasks, index, progress)))

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
        <h1>{t('Tareas')}</h1>
        <button className="btn primary" onClick={() => setEditing({ status: 'todo', owner: me, phase_id: current?.id })}>
          <PlusIcon width={18} height={18} /> Nueva
        </button>
      </div>

      <Segmented
        name="Filtrar por persona"
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: t('Todas') }, ...PEOPLE.map((p) => ({ value: p, label: p }))]}
      />
      <p className="hint desktop-only">{t('Arrastra una tarea a otra columna para cambiar su estado.')}</p>

      <div className="mobile-list">
        <Segmented
          name="Columna"
          value={column}
          onChange={pick}
          options={COLUMNS.map((c) => ({ value: c.id, label: `${t(c.label)} · ${visible.filter((t) => t.status === c.id).length}` }))}
        />
        <div ref={track} className="swipe-cols" tabIndex={0} aria-label={t('Columnas: deslicen o usen las flechas para cambiar')} onScroll={onSwipe} onKeyDown={onKeys}>
          {COLUMNS.map((c) => {
            const list = visible.filter((task) => task.status === c.id).sort(byPlan)
            return (
              <div key={c.id} className="list-body swipe-col" inert={c.id !== column} data-column={c.id}>
                {list.map((task) => (
                  <div key={task.id} className="list-row">
                    <TaskCard task={task} phase={phaseName[task.phase_id]} lock={lockOf(task)} onClick={() => setEditing(task)} />
                    <label className="move">
                      <span className="sr-only">{t('Mover a…')}</span>
                      <select value="" onChange={(e) => e.target.value && actions.updateTask(task.id, { status: e.target.value })}>
                        <option value="">{t('Mover a…')}</option>
                        {COLUMNS.filter((col) => col.id !== task.status).map((col) => (
                          <option key={col.id} value={col.id}>
                            {t(col.label)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                ))}
                {list.length === 0 && (
                  <p className="muted empty">
                    {c.id === 'done' ? t('Todavía no hay pasos hechos. ¡El primero es el más difícil!') : c.id === 'doing' ? t('Nada en progreso. Empiecen el paso recomendado desde Inicio.') : t('No hay pasos por hacer aquí.')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={({ active }) => setActiveId(active.id)}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="board desktop-only">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={visible.filter((t) => t.status === col.id).sort(byPlan)}
              onOpen={setEditing}
              phaseName={phaseName}
              lockOf={lockOf}
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

function Column({ column, tasks, onOpen, onAdd, phaseName, lockOf }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <section ref={setNodeRef} className={`column ${column.id} ${isOver ? 'over' : ''}`}>
      <div className="column-head">
        <h2>{t(column.label)}</h2>
        <span className="count">{tasks.length}</span>
        <button className="icon-btn" onClick={onAdd} aria-label={t('Añadir tarea en {column}', { column: t(column.label) })}>
          <PlusIcon width={18} height={18} />
        </button>
      </div>
      <div className="column-body">
        {tasks.map((t) => (
          <DraggableTask key={t.id} task={t} onOpen={onOpen} phase={phaseName[t.phase_id]} lock={lockOf(t)} />
        ))}
        {tasks.length === 0 && <p className="drop-empty">{t('Suelta un paso aquí')}</p>}
      </div>
    </section>
  )
}

function DraggableTask({ task, onOpen, phase, lock }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: task.id })
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} className={`drag ${isDragging ? 'ghost' : ''}`}>
      <TaskCard task={task} phase={phase} lock={lock} onClick={() => onOpen(task)} />
    </div>
  )
}

function TaskCard({ task, onClick, overlay, phase, lock }) {
  const late = task.status !== 'done' && daysUntil(task.due_date) < 0
  return (
    <div
      className={`task ${task.status} ${overlay ? 'overlay-card' : ''} ${lock ? 'locked' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {phase && <p className="task-phase">{phase}</p>}
      <p className="task-title">{task.title}</p>
      {lock && (
        <p className="lock-note">
          <LockIcon width={12} height={12} /> {lock}
        </p>
      )}
      <div className="task-meta">
        <span className={`owner ${personClass(task.owner)}`}>{task.owner ?? t('Sin asignar')}</span>
        {task.due_date && <span className={`due ${late ? 'late' : ''}`}>{dueLabel(task.due_date)}</span>}
      </div>
    </div>
  )
}

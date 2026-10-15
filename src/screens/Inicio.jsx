import { useState } from 'react'
import { useStore } from '../context'
import Sheet from '../Sheet'
import { CalendarIcon, CheckIcon, EditIcon } from '../icons'
import { byDueDate, daysUntil, dueLabel, longDate } from '../dates'
import { PEOPLE, personClass } from '../constants'

function countdown(date) {
  const days = daysUntil(date)
  if (days === null) return 'Elige la fecha de lanzamiento'
  if (days > 1) return `Faltan ${days} días`
  if (days === 1) return '¡Es mañana!'
  if (days === 0) return '¡Hoy es el lanzamiento!'
  return `Lanzado hace ${-days} ${days === -1 ? 'día' : 'días'}`
}

function Ring({ value }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="ring">
      <svg viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} className="ring-bg" />
        <circle cx="40" cy="40" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c - (c * value) / 100} />
      </svg>
      <div className="ring-label">
        <b>{value}%</b>
        <span>listo</span>
      </div>
    </div>
  )
}

export default function Inicio({ go }) {
  const { settings, tasks, items, me, actions } = useStore()
  const [editing, setEditing] = useState(false)

  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const doneItems = items.filter((i) => i.done).length
  const total = tasks.length + items.length
  const progress = total ? Math.round(((doneTasks + doneItems) / total) * 100) : 0
  const people = [me, ...PEOPLE.filter((p) => p !== me)]

  return (
    <>
      <h1 className="greeting">Hola, {me}</h1>

      <section className="hero">
        <div className="hero-top">
          <span className="eyebrow">Nuestra meta</span>
          <button className="icon-btn on-dark" onClick={() => setEditing(true)} aria-label="Editar meta">
            <EditIcon width={18} height={18} />
          </button>
        </div>
        <div className="hero-body">
          <div>
            <h2 className="hero-goal">{settings?.goal || 'Escribe aquí su gran meta'}</h2>
            <p className="hero-date">
              <CalendarIcon width={16} height={16} />
              {settings?.launch_date ? longDate(settings.launch_date) : 'Sin fecha todavía'}
            </p>
            <span className="countdown">{countdown(settings?.launch_date)}</span>
          </div>
          <Ring value={progress} />
        </div>
        <p className="hero-foot">
          {doneTasks} de {tasks.length} tareas hechas · {doneItems} de {items.length} pasos de metas
        </p>
      </section>

      <div className="people">
        {people.map((name) => (
          <NextTasks key={name} name={name} tasks={tasks} onDone={(id) => actions.updateTask(id, { status: 'done' })} go={go} />
        ))}
      </div>

      {editing && <GoalEditor settings={settings} onClose={() => setEditing(false)} onSave={actions.saveSettings} />}
    </>
  )
}

function NextTasks({ name, tasks, onDone, go }) {
  const next = tasks
    .filter((t) => t.owner === name && t.status !== 'done')
    .sort(byDueDate)
    .slice(0, 3)

  return (
    <section className={`card person ${personClass(name)}`}>
      <div className="person-head">
        <span className={`avatar small ${personClass(name)}`}>{name[0]}</span>
        <h3>Próximas de {name}</h3>
      </div>
      {next.length === 0 ? (
        <p className="muted empty">Nada pendiente por ahora.</p>
      ) : (
        <ul className="next-list">
          {next.map((t) => {
            const late = daysUntil(t.due_date) < 0
            return (
              <li key={t.id}>
                <button className="check" onClick={() => onDone(t.id)} aria-label={`Marcar "${t.title}" como hecha`}>
                  <CheckIcon width={14} height={14} />
                </button>
                <span className="next-title">{t.title}</span>
                {t.status === 'doing' && <span className="tag doing">En progreso</span>}
                {t.due_date && <span className={`due ${late ? 'late' : ''}`}>{dueLabel(t.due_date)}</span>}
              </li>
            )
          })}
        </ul>
      )}
      <button className="link" onClick={() => go('tareas')}>
        Ver todas las tareas
      </button>
    </section>
  )
}

function GoalEditor({ settings, onClose, onSave }) {
  const [goal, setGoal] = useState(settings?.goal ?? '')
  const [date, setDate] = useState(settings?.launch_date ?? '')

  const submit = (e) => {
    e.preventDefault()
    onSave({ goal: goal.trim() || 'Lanzar el podcast Cuadrando', launch_date: date || null })
    onClose()
  }

  return (
    <Sheet title="Nuestra meta" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>¿Cuál es la meta del lanzamiento?</span>
          <textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <label className="field">
          <span>Fecha de lanzamiento</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="btn primary full">Guardar</button>
      </form>
    </Sheet>
  )
}

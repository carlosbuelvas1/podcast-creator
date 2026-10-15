import { useState } from 'react'
import { useStore, useProject } from '../context'
import { ProjectEditor } from './Projects'
import { CalendarIcon, CheckIcon, EditIcon } from '../icons'
import { byDueDate, daysUntil, dueLabel, longDate } from '../dates'
import { PEOPLE, personClass, progressOf } from '../constants'

function countdown(date) {
  const days = daysUntil(date)
  if (days === null) return 'Elijan la fecha de lanzamiento'
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
  const { me, actions } = useStore()
  const { project, phases, tasks } = useProject()
  const [editing, setEditing] = useState(false)

  const overall = progressOf(tasks)
  const people = [me, ...PEOPLE.filter((p) => p !== me)]
  const unassigned = tasks.filter((t) => !t.owner && t.status !== 'done').length

  return (
    <>
      <h1 className="greeting">Hola, {me}</h1>

      <section className="hero">
        <div className="hero-top">
          <span className="eyebrow">Su podcast</span>
          <button className="icon-btn on-dark" onClick={() => setEditing(true)} aria-label="Editar proyecto">
            <EditIcon width={18} height={18} />
          </button>
        </div>
        <div className="hero-body">
          <div>
            <h2 className="hero-goal">{project.name}</h2>
            {project.goal && <p className="hero-sub">{project.goal}</p>}
            <p className="hero-date">
              <CalendarIcon width={16} height={16} />
              {project.launch_date ? longDate(project.launch_date) : 'Sin fecha todavía'}
            </p>
            <span className="countdown">{countdown(project.launch_date)}</span>
          </div>
          <Ring value={overall.pct} />
        </div>
        <p className="hero-foot">
          {overall.done} de {overall.total} pasos hechos
        </p>
      </section>

      <section className="card phase-progress">
        <h3>Progreso por fase</h3>
        <ul>
          {phases.map((ph) => {
            const { done, total, pct } = progressOf(tasks.filter((t) => t.phase_id === ph.id))
            return (
              <li key={ph.id}>
                <button onClick={() => go('fases', ph.id)}>
                  <span className={`num small ${pct === 100 && total ? 'complete' : ''}`}>
                    {pct === 100 && total ? <CheckIcon width={13} height={13} /> : ph.position}
                  </span>
                  <span className="pp-text">
                    <span className="pp-title">{ph.title}</span>
                    <span className="bar thin">
                      <span className="bar-fill" style={{ width: `${pct}%` }} />
                    </span>
                  </span>
                  <span className="pp-pct">
                    {pct}%<small>{done}/{total}</small>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="people">
        {people.map((name) => (
          <NextTasks key={name} name={name} tasks={tasks} phases={phases} onDone={(id) => actions.updateTask(id, { status: 'done' })} go={go} />
        ))}
      </div>

      {unassigned > 0 && (
        <button className="notice" onClick={() => go('fases')}>
          Hay {unassigned} {unassigned === 1 ? 'paso' : 'pasos'} sin responsable. Asígnenlos en Fases.
        </button>
      )}

      {editing && <ProjectEditor project={project} onClose={() => setEditing(false)} />}
    </>
  )
}

function NextTasks({ name, tasks, phases, onDone, go }) {
  const phaseOrder = Object.fromEntries(phases.map((p) => [p.id, p.position]))
  const next = tasks
    .filter((t) => t.owner === name && t.status !== 'done')
    .sort((a, b) => {
      if (a.due_date || b.due_date) return byDueDate(a, b)
      return phaseOrder[a.phase_id] - phaseOrder[b.phase_id] || a.position - b.position
    })
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
            const phase = phases.find((p) => p.id === t.phase_id)
            return (
              <li key={t.id}>
                <button className="check" onClick={() => onDone(t.id)} aria-label={`Marcar "${t.title}" como hecho`}>
                  <CheckIcon width={14} height={14} />
                </button>
                <span className="next-title">
                  {t.title}
                  {phase && <small>{phase.title}</small>}
                </span>
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

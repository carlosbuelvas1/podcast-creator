import { useEffect, useState } from 'react'
import { useStore, useProject } from '../context'
import StepSheet from './StepSheet'
import { CheckIcon, ChevronIcon, PlusIcon } from '../icons'
import { dueLabel, daysUntil } from '../dates'
import { personClass, progressOf } from '../constants'
import { buildIndex, lockReason, lockState, phaseProgress } from '../recommend'
import { LockIcon } from '../icons'
import { t } from '../i18n'

export default function Fases({ focus }) {
  const { phases, tasks, items } = useProject()
  const current = phases.find((ph) => progressOf(tasks.filter((t) => t.phase_id === ph.id)).pct < 100)
  const [open, setOpen] = useState(() => new Set([focus ?? current?.id].filter(Boolean)))
  const [editing, setEditing] = useState(null)
  const index = buildIndex(phases, tasks)
  const progress = phaseProgress(phases, tasks)
  const lockOf = (t) => (t.status === 'done' ? [] : lockState(t, phases, tasks, index, progress))

  useEffect(() => {
    if (focus) document.getElementById(`fase-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [focus])

  const toggle = (id) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <>
      <div className="page-head">
        <h1>{t('Fases')}</h1>
      </div>
      <p className="hint">{t('Sigan las fases en orden. Toquen un paso para ver qué hacer y marcar su lista.')}</p>

      <div className="phases">
        {phases.map((ph) => {
          const phaseTasks = tasks.filter((t) => t.phase_id === ph.id)
          const { done, total, pct } = progressOf(phaseTasks)
          const isOpen = open.has(ph.id)
          return (
            <section key={ph.id} id={`fase-${ph.id}`} className={`card phase ${pct === 100 && total ? 'complete' : ''}`}>
              <button className="phase-head" onClick={() => toggle(ph.id)} aria-expanded={isOpen}>
                <span className="num">{pct === 100 && total ? <CheckIcon width={16} height={16} /> : ph.position}</span>
                <span className="phase-text">
                  <b>{ph.title}</b>
                  <span className="muted small">
                    {t('{done} de {total} pasos', { done, total })} · {pct}%
                  </span>
                </span>
                <ChevronIcon className={`chev ${isOpen ? 'up' : ''}`} />
              </button>
              <div className="bar thin">
                <div className="bar-fill" style={{ width: `${pct}%` }} />
              </div>
              {isOpen && (
                <div className="phase-body">
                  {ph.summary && <p className="phase-summary">{ph.summary}</p>}
                  {phaseTasks.length === 0 && <p className="muted empty">{t('Esta fase no tiene pasos. Añadan el primero.')}</p>}
                  <ul className="steps">
                    {phaseTasks.map((t) => (
                      <StepRow key={t.id} task={t} lock={lockReason(lockOf(t))} items={items.filter((i) => i.task_id === t.id)} onOpen={() => setEditing(t)} />
                    ))}
                  </ul>
                  <button className="btn ghost full" onClick={() => setEditing({ phase_id: ph.id, status: 'todo' })}>
                    <PlusIcon width={18} height={18} /> Añadir paso
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {editing && <StepSheet task={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function StepRow({ task, items, onOpen, lock }) {
  const { actions } = useStore()
  const done = task.status === 'done'
  const late = !done && daysUntil(task.due_date) < 0
  const checked = items.filter((i) => i.done).length

  return (
    <li className={`step ${done ? 'done' : ''} ${lock ? 'locked' : ''}`}>
      <button
        className={`check ${done ? 'on' : ''}`}
        onClick={() => actions.updateTask(task.id, { status: done ? 'todo' : 'done' })}
        aria-label={done ? t('Marcar "{title}" como pendiente', { title: task.title }) : t('Marcar "{title}" como hecho', { title: task.title })}
      >
        <CheckIcon width={14} height={14} />
      </button>
      <button className="step-main" onClick={onOpen}>
        <span className="step-name">{task.title}</span>
        {lock && (
          <span className="lock-note">
            <LockIcon width={12} height={12} /> {lock}
          </span>
        )}
        <span className="step-meta">
          <span className={`owner ${personClass(task.owner)}`}>{task.owner ?? t('Sin asignar')}</span>
          {task.status === 'doing' && <span className="tag doing">{t('En progreso')}</span>}
          {items.length > 0 && (
            <span className="muted small">
              {checked}/{items.length}
            </span>
          )}
          {task.due_date && <span className={`due ${late ? 'late' : ''}`}>{dueLabel(task.due_date)}</span>}
        </span>
      </button>
    </li>
  )
}

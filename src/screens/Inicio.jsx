import { useMemo, useState } from 'react'
import { useStore, useProject } from '../context'
import { ProjectEditor } from './Projects'
import StepSheet from './StepSheet'
import { BriefCard } from './Brief'
import { moduleRecommendations } from '../modules'
import { useSkips } from '../skips'
import { aiEnabled } from '../ai'
import { NAME_FOCUS, NAME_STEP, isProvisional } from '../naming'
import { guideFor, formatMinutes } from '../guide'
import { autoAssign, ownerBalance, phaseProgress, recommend } from '../recommend'
import { CalendarIcon, CheckIcon, EditIcon } from '../icons'
import { byDueDate, daysUntil, dueLabel, longDate } from '../dates'
import { PEOPLE, personClass, progressOf } from '../constants'

function countdown(date) {
  const days = daysUntil(date)
  if (days === null) return null
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
  const { project, phases, tasks, items, modules } = useProject()
  const { skipped, skip } = useSkips()
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(null)

  const partner = PEOPLE.find((p) => p !== me)
  const ranked = useMemo(() => recommend({ phases, tasks, items, me, partner, skipped }), [phases, tasks, items, me, partner, skipped])
  const available = ranked.filter((r) => !r.blockedBy.length && (!r.task.owner || r.task.owner === me))
  const provisional = isProvisional(project)
  const [nameRec] = provisional ? moduleRecommendations(modules, 1, { provisionalName: true }).filter((r) => r.step.code === NAME_STEP) : []
  const [top, ...rest] = available
  const alternatives = nameRec ? available.slice(0, 2) : rest.slice(0, 2)
  const partnerTop = recommend({ phases, tasks, items, me: partner, partner: me }).find((r) => !r.blockedBy.length && r.task.owner === partner)

  const overall = progressOf(tasks)
  const progress = phaseProgress(phases, tasks)
  const balance = ownerBalance(tasks, PEOPLE)
  const overdue = tasks.filter((t) => t.status !== 'done' && daysUntil(t.due_date) < 0)
  const unassigned = tasks.filter((t) => !t.owner && t.status !== 'done')
  const week = tasks
    .filter((t) => t.status !== 'done' && t.due_date && daysUntil(t.due_date) <= 7)
    .sort(byDueDate)
  const phaseName = Object.fromEntries(phases.map((p) => [p.id, p.title]))

  const alerts = []
  if (overdue.length) alerts.push({ tone: 'danger', text: `${overdue.length} ${overdue.length === 1 ? 'paso vencido' : 'pasos vencidos'}. Pónganse al día o cambien la fecha.`, action: ['Ver tareas', () => go('tareas')] })
  if (balance.unbalanced) {
    const [heavy] = Object.entries(balance.counts).sort((a, b) => b[1] - a[1])
    alerts.push({ tone: 'warning', text: `${heavy[0]} tiene ${balance.gap} pasos más que su pareja.`, action: ['Repartir parejo', () => autoAssign(tasks, PEOPLE, phases).forEach((c) => actions.updateTask(c.id, { owner: c.owner }))] })
  } else if (unassigned.length) {
    alerts.push({ tone: 'info', text: `${unassigned.length} ${unassigned.length === 1 ? 'paso sin responsable' : 'pasos sin responsable'}.`, action: ['Repartir', () => autoAssign(tasks, PEOPLE, phases).forEach((c) => actions.updateTask(c.id, { owner: c.owner }))] })
  }
  if (!project.launch_date) alerts.push({ tone: 'info', text: 'Todavía no tienen fecha de lanzamiento.', action: ['Elegir fecha', () => setEditing(true)] })

  return (
    <>
      <div className="page-head">
        <div>
          <p className="eyebrow-muted">
            {project.name}
            {provisional && <span className="badge-prov">Nombre provisional</span>}
          </p>
          <h1 className="greeting">Hola, {me}</h1>
        </div>
        <button className="icon-btn" onClick={() => setEditing(true)} aria-label="Editar proyecto">
          <EditIcon width={18} height={18} />
        </button>
      </div>

      {nameRec ? (
        <section className="hero rec">
          <span className="eyebrow">Siguiente paso recomendado</span>
          <h2 className="hero-goal">{nameRec.step.title}</h2>
          <p className="hero-sub">{nameRec.step.why}</p>
          <div className="chips">
            <span className="chip on-hero">⏱ {formatMinutes(nameRec.step.minutes)}</span>
            {nameRec.reasons.map((r) => (
              <span key={r} className="chip on-hero">{r}</span>
            ))}
          </div>
          <div className="hero-actions">
            <button className="btn on-hero" onClick={() => go('modulos', NAME_FOCUS)}>{aiEnabled() ? 'Crear nombre con IA' : 'Empezar'}</button>
          </div>
        </section>
      ) : top ? (
        <RecommendCard rec={top} onOpen={() => setOpen(top.task)} onSkip={() => skip(top.task.id)} onStart={() => { actions.updateTask(top.task.id, { status: 'doing', owner: top.task.owner ?? me }); setOpen({ ...top.task, status: 'doing' }) }} />
      ) : (
        <section className="hero rec">
          <span className="eyebrow">Siguiente paso recomendado</span>
          <h2 className="hero-goal">{overall.total && overall.done === overall.total ? '¡Terminaron todos los pasos!' : 'Nada disponible para ti ahora'}</h2>
          <p className="hero-sub">{overall.done === overall.total ? 'Celebren y sigan publicando con constancia.' : 'Revisa las fases o ayuda a tu pareja con lo suyo.'}</p>
          <button className="btn on-hero" onClick={() => go('fases')}>Ver fases</button>
        </section>
      )}

      {(alternatives.length > 0 || partnerTop) && (
        <section className="card">
          <h3 className="card-title">También pueden</h3>
          <ul className="mini-list">
            {alternatives.map((r) => (
              <MiniRow key={r.task.id} rec={r} label="Alternativa" phase={phaseName[r.task.phase_id]} onOpen={() => setOpen(r.task)} />
            ))}
            {partnerTop && <MiniRow rec={partnerTop} label={`Lo siguiente de ${partner}`} phase={phaseName[partnerTop.task.phase_id]} onOpen={() => setOpen(partnerTop.task)} person={partner} />}
          </ul>
        </section>
      )}

      {(() => {
        const [m] = moduleRecommendations(modules, 1)
        return m && !nameRec && !overdue.length ? (
          <section className="card">
            <h3 className="card-title">Módulo sugerido</h3>
            <ul className="mini-list">
              <li>
                <button className="mini" onClick={() => go('modulos', m.module.key)}>
                  <span className="mini-label">{m.module.title}</span>
                  <span className="mini-title">{m.step.title}</span>
                  <span className="mini-meta">{m.reasons.join(' · ')}</span>
                </button>
              </li>
            </ul>
          </section>
        ) : null
      })()}

      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map((a) => (
            <div key={a.text} className={`alert ${a.tone}`} role="status">
              <span>{a.text}</span>
              <button className="link" onClick={a.action[1]}>{a.action[0]}</button>
            </div>
          ))}
        </div>
      )}

      <section className="card progress-card">
        <div className="progress-top">
          <Ring value={overall.pct} />
          <div>
            <h3 className="card-title">Progreso general</h3>
            <p className="muted small">{overall.done} de {overall.total} pasos hechos</p>
            <p className="muted small date-line">
              <CalendarIcon width={14} height={14} />
              {project.launch_date ? `${longDate(project.launch_date)} · ${countdown(project.launch_date)}` : 'Sin fecha de lanzamiento'}
            </p>
          </div>
        </div>
        <div className="segments" role="list">
          {progress.map((p) => (
            <button key={p.phase.id} role="listitem" className={`segment ${p.pct === 100 && p.total ? 'complete' : ''}`} onClick={() => go('fases', p.phase.id)} aria-label={`${p.phase.title}: ${p.pct}%`}>
              <span className="segment-bar"><span style={{ width: `${p.pct}%` }} /></span>
              <span className="segment-label">{p.pct === 100 && p.total ? <CheckIcon width={12} height={12} /> : p.phase.position}</span>
            </button>
          ))}
        </div>
      </section>

      <BriefCard onOpen={() => go('modulos', 'brief')} />

      <section className="card">
        <h3 className="card-title">Esta semana</h3>
        {week.length === 0 ? (
          <p className="muted empty">Nada vence esta semana. Usen el paso recomendado para avanzar.</p>
        ) : (
          <ul className="next-list">
            {week.map((t) => (
              <li key={t.id}>
                <button className="check" onClick={() => actions.updateTask(t.id, { status: 'done' })} aria-label={`Marcar "${t.title}" como hecho`}>
                  <CheckIcon width={14} height={14} />
                </button>
                <button className="next-title plain" onClick={() => setOpen(t)}>
                  {t.title}
                  <small>{phaseName[t.phase_id]}</small>
                </button>
                <span className={`owner ${personClass(t.owner)}`}>{t.owner ?? 'Nadie'}</span>
                <span className={`due ${daysUntil(t.due_date) < 0 ? 'late' : ''}`}>{dueLabel(t.due_date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editing && <ProjectEditor project={project} onClose={() => setEditing(false)} />}
      {open && <StepSheet task={tasks.find((t) => t.id === open.id) ?? open} onClose={() => setOpen(null)} />}
    </>
  )
}

function RecommendCard({ rec, onOpen, onSkip, onStart }) {
  const guide = guideFor(rec.code)
  return (
    <section className="hero rec">
      <span className="eyebrow">Siguiente paso recomendado</span>
      <h2 className="hero-goal">{rec.task.title}</h2>
      {(guide.why || rec.task.explanation) && <p className="hero-sub">{guide.why || rec.task.explanation}</p>}
      <div className="chips">
        <span className="chip on-hero">⏱ {formatMinutes(guide.minutes)}</span>
        {rec.reasons.slice(0, 3).map((r) => (
          <span key={r} className="chip on-hero">{r}</span>
        ))}
      </div>
      <div className="hero-actions">
        <button className="btn on-hero" onClick={onStart}>{rec.task.status === 'doing' ? 'Seguir' : 'Empezar'}</button>
        <button className="btn ghost-hero" onClick={onOpen}>Ver guía</button>
        <button className="btn text-hero" onClick={onSkip}>Saltar por ahora</button>
      </div>
    </section>
  )
}

function MiniRow({ rec, label, phase, onOpen, person }) {
  return (
    <li>
      <button className="mini" onClick={onOpen}>
        <span className="mini-label">{label}</span>
        <span className="mini-title">{rec.task.title}</span>
        <span className="mini-meta">
          {phase}
          {person && <span className={`owner ${personClass(person)}`}>{person}</span>}
        </span>
      </button>
    </li>
  )
}

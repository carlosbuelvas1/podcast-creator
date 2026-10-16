import { useMemo, useState } from 'react'
import { useStore, useProject } from '../context'
import Sheet, { Segmented } from '../Sheet'
import { CheckIcon, CloseIcon, DotsIcon, LinkIcon, LockIcon, PlusIcon, TrashIcon, EditIcon } from '../icons'
import { COLUMNS, PEOPLE, personClass } from '../constants'
import { formatMinutes, guideFor } from '../guide'
import { buildIndex, lockReason, lockState, recommend, unlocks } from '../recommend'
import { t } from '../i18n'

const NOTES_KEY = 'podcast-creator-notes'
const readNotes = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTES_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export default function StepSheet({ task, onClose }) {
  const [id, setId] = useState(task.id ?? null)
  const { tasks } = useProject()
  const current = (id && tasks.find((t) => t.id === id)) || task
  if (!current.id) return <StepForm key="new" task={current} onClose={onClose} />
  return <StepGuide key={current.id} task={current} onClose={onClose} onNext={setId} />
}

function StepGuide({ task, onClose, onNext }) {
  const { actions, me } = useStore()
  const { project, phases, tasks, items } = useProject()
  const [menu, setMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [note, setNote] = useState(() => readNotes()[task.id] ?? '')
  const [justDone, setJustDone] = useState(false)

  const index = useMemo(() => buildIndex(phases, tasks), [phases, tasks])
  const code = index.codeOf[task.id]
  const guide = guideFor(code)
  const phase = phases.find((p) => p.id === task.phase_id)
  const checklist = items.filter((i) => i.task_id === task.id)
  const checked = checklist.filter((i) => i.done).length
  const blockedBy = task.status === 'done' ? [] : lockState(task, phases, tasks, index)
  const opens = unlocks(task, phases, tasks, index)
  const partner = PEOPLE.find((p) => p !== me)
  const next = justDone
    ? recommend({ phases, tasks, items, me, partner }).find((r) => r.task.id !== task.id && !r.blockedBy.length)
    : null

  if (editing) return <StepForm task={task} onClose={() => setEditing(false)} />

  const saveNote = (value) => {
    setNote(value)
    const all = readNotes()
    if (value.trim()) all[task.id] = value
    else delete all[task.id]
    localStorage.setItem(NOTES_KEY, JSON.stringify(all))
  }

  const toggleItem = (i) => {
    actions.updateItem(i.id, { done: !i.done })
    if (!i.done && task.status === 'todo') actions.updateTask(task.id, { status: 'doing' })
  }

  const complete = () => {
    actions.updateTask(task.id, { status: 'done' })
    setJustDone(true)
  }

  const remove = () => {
    if (window.confirm(t('¿Borrar este paso?'))) {
      actions.deleteTask(task.id)
      onClose()
    }
  }

  const addItem = (e) => {
    e.preventDefault()
    if (!newItem.trim()) return
    const position = Math.max(0, ...checklist.map((i) => i.position)) + 1
    actions.addItem({ task_id: task.id, project_id: project.id, text: newItem.trim(), position })
    setNewItem('')
  }

  const menuButton = (
    <div className="menu-wrap">
      <button className="icon-btn" onClick={() => setMenu((m) => !m)} aria-label={t('Más opciones')} aria-expanded={menu}>
        <DotsIcon width={18} height={18} />
      </button>
      {menu && (
        <div className="menu" role="menu">
          <button role="menuitem" onClick={() => setEditing(true)}>
            <EditIcon width={16} height={16} /> Editar paso
          </button>
          <button role="menuitem" className="danger" onClick={remove}>
            <TrashIcon width={16} height={16} /> Borrar paso
          </button>
        </div>
      )}
    </div>
  )

  return (
    <Sheet title={phase ? `Fase ${phase.position} · ${phase.title}` : t('Paso')} onClose={onClose} full actions={menuButton}>
      <div className="guide">
        <div className="guide-top">
          {code && <span className="chip">{t('Paso {code}', { code })}</span>}
          {guide.minutes > 0 && <span className="chip">⏱ {formatMinutes(guide.minutes)}</span>}
          {guide.ownerHint && <span className="chip subtle">{guide.ownerHint}</span>}
        </div>
        <h3 className="step-title">{task.title}</h3>
        {task.explanation && <p className="explain">{task.explanation}</p>}

        {blockedBy.length > 0 && (
          <div className="alert warning">
            <span>
              <LockIcon width={14} height={14} /> {lockReason(blockedBy)}. Pueden adelantarlo igual si quieren.
            </span>
          </div>
        )}

        {justDone ? (
          <div className="done-card pop">
            <span className="done-badge">
              <CheckIcon width={22} height={22} />
            </span>
            <b>{t('¡Paso terminado!')}</b>
            {next ? (
              <>
                <span className="muted small">{t('Lo siguiente recomendado:')}</span>
                <button className="mini" onClick={() => onNext(next.task.id)}>
                  <span className="mini-title">{next.task.title}</span>
                  <span className="mini-meta">{next.reasons.slice(0, 2).join(' · ')}</span>
                </button>
              </>
            ) : (
              <span className="muted small">{t('No hay otro paso disponible por ahora.')}</span>
            )}
          </div>
        ) : (
          <div className="quick">
            <Segmented
              name="Estado"
              value={task.status}
              onChange={(status) => (status === 'done' ? complete() : actions.updateTask(task.id, { status }))}
              options={COLUMNS.map((c) => ({ value: c.id, label: t(c.label) }))}
            />
            <div className="quick-row">
              <Segmented
                name="Responsable"
                value={task.owner ?? ''}
                onChange={(owner) => actions.updateTask(task.id, { owner: owner || null })}
                options={[...PEOPLE.map((p) => ({ value: p, label: p, className: personClass(p) })), { value: '', label: t('Nadie') }]}
              />
              <label className="date-pill">
                <span className="sr-only">{t('Fecha límite')}</span>
                <input type="date" value={task.due_date ?? ''} onChange={(e) => actions.updateTask(task.id, { due_date: e.target.value || null })} />
              </label>
            </div>
          </div>
        )}

        {guide.why && (
          <section className="guide-block">
            <h4>{t('Por qué importa')}</h4>
            <p>{guide.why}</p>
          </section>
        )}

        <section className="guide-block">
          <h4>
            {t('Lista para marcar')} <span className="muted">· {t('{done} de {total}', { done: checked, total: checklist.length })}</span>
          </h4>
          <ul className="checklist">
            {checklist.map((i) => (
              <li key={i.id} className={i.done ? 'done' : ''}>
                <button type="button" className={`box ${i.done ? 'on' : ''}`} role="checkbox" aria-checked={i.done} aria-label={i.text} onClick={() => toggleItem(i)}>
                  <CheckIcon width={14} height={14} />
                </button>
                <span className="item-text" onClick={() => toggleItem(i)}>
                  {i.text}
                </span>
                <button type="button" className="remove" onClick={() => actions.deleteItem(i.id)} aria-label={`Quitar "${i.text}"`}>
                  <CloseIcon width={16} height={16} />
                </button>
              </li>
            ))}
          </ul>
          <form className="add-item" onSubmit={addItem}>
            <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={t('Añadir a la lista…')} />
            <button className="icon-btn filled" aria-label={t('Añadir')} disabled={!newItem.trim()}>
              <PlusIcon width={18} height={18} />
            </button>
          </form>
        </section>

        {guide.tips.length > 0 && (
          <section className="guide-block">
            <h4>{t('Consejos')}</h4>
            <ul className="bullets good">
              {guide.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {guide.mistakes.length > 0 && (
          <section className="guide-block">
            <h4>{t('Errores comunes')}</h4>
            <ul className="bullets bad">
              {guide.mistakes.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {guide.resources.length > 0 && (
          <section className="guide-block">
            <h4>{t('Recursos')}</h4>
            <div className="links">
              {guide.resources.map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="link-pill">
                  <LinkIcon width={14} height={14} /> {r.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {opens.length > 0 && (
          <section className="guide-block">
            <h4>{t('Al terminarlo se desbloquea')}</h4>
            <ul className="bullets">
              {opens.map((t) => (
                <li key={t.id}>{t.title}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="guide-block">
          <h4>{t('Notas')}</h4>
          <textarea rows={3} value={note} onChange={(e) => saveNote(e.target.value)} placeholder={t('Ideas, enlaces o recordatorios para este paso (solo en este dispositivo)')} />
        </section>

        {task.status !== 'done' && !justDone && (
          <button className="btn primary full sticky-cta" onClick={complete}>
            <CheckIcon width={18} height={18} /> Marcar como hecho
          </button>
        )}
      </div>
    </Sheet>
  )
}

function StepForm({ task, onClose }) {
  const { actions } = useStore()
  const { project, phases, tasks } = useProject()
  const isNew = !task.id
  const [title, setTitle] = useState(task.title ?? '')
  const [explanation, setExplanation] = useState(task.explanation ?? '')
  const [phaseId, setPhaseId] = useState(task.phase_id ?? phases[0]?.id)
  const [owner, setOwner] = useState(task.owner ?? '')
  const [due, setDue] = useState(task.due_date ?? '')
  const [status, setStatus] = useState(task.status ?? 'todo')

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    const fields = { title: title.trim(), explanation: explanation.trim(), phase_id: phaseId, owner: owner || null, due_date: due || null, status }
    if (isNew) {
      const position = Math.max(0, ...tasks.filter((t) => t.phase_id === phaseId).map((t) => t.position)) + 1
      actions.addTask({ ...fields, project_id: project.id, position })
    } else {
      actions.updateTask(task.id, fields)
    }
    onClose()
  }

  return (
    <Sheet title={isNew ? t('Nuevo paso') : t('Editar paso')} onClose={onClose}>
      <form onSubmit={submit} className="sheet-section">
        <label className="field">
          <span>{t('Nombre del paso')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('Ej. Grabar la intro')} required />
        </label>
        <label className="field">
          <span>{t('Explicación (opcional)')}</span>
          <textarea rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
        </label>
        <label className="field">
          <span>{t('Fase')}</span>
          <select value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.position}. {p.title}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>{t('¿Quién se encarga?')}</span>
          <Segmented
            name="Responsable"
            value={owner}
            onChange={setOwner}
            options={[...PEOPLE.map((p) => ({ value: p, label: p, className: personClass(p) })), { value: '', label: t('Nadie aún') }]}
          />
        </div>
        <label className="field">
          <span>{t('Fecha límite')}</span>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </label>
        <div className="field">
          <span>{t('Estado')}</span>
          <Segmented name="Estado" value={status} onChange={setStatus} options={COLUMNS.map((c) => ({ value: c.id, label: t(c.label) }))} />
        </div>
        <button className="btn primary full">{isNew ? t('Crear paso') : t('Guardar')}</button>
      </form>
    </Sheet>
  )
}

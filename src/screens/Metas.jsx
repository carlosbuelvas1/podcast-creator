import { useState } from 'react'
import { useStore } from '../context'
import Sheet from '../Sheet'
import { CheckIcon, CloseIcon, EditIcon, PlusIcon, TrashIcon } from '../icons'

export default function Metas() {
  const { goals, items } = useStore()
  const [editing, setEditing] = useState(null)

  return (
    <>
      <div className="page-head">
        <h1>Metas</h1>
        <button className="btn primary" onClick={() => setEditing({})}>
          <PlusIcon width={18} height={18} /> Nueva
        </button>
      </div>

      {goals.length === 0 && (
        <div className="card empty-state">
          <p>Todavía no tienen metas.</p>
          <button className="btn" onClick={() => setEditing({})}>
            Crear la primera
          </button>
        </div>
      )}

      <div className="goals">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} items={items.filter((i) => i.goal_id === g.id)} onEdit={() => setEditing(g)} />
        ))}
      </div>

      {editing && <GoalEditor goal={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function GoalCard({ goal, items, onEdit }) {
  const { actions } = useStore()
  const [text, setText] = useState('')
  const done = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0
  const complete = items.length > 0 && done === items.length

  const add = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    actions.addItem(goal.id, text.trim())
    setText('')
  }

  return (
    <section className={`card goal ${complete ? 'complete' : ''}`}>
      <div className="goal-head">
        <h2>{goal.title}</h2>
        <button className="icon-btn" onClick={onEdit} aria-label="Editar meta">
          <EditIcon width={18} height={18} />
        </button>
      </div>

      <div className="goal-progress">
        <div className="bar">
          <div className="bar-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="pct">{complete ? '¡Lista!' : `${pct}%`}</span>
      </div>
      <p className="muted small">
        {done} de {items.length} pasos
      </p>

      <ul className="checklist">
        {items.map((i) => (
          <li key={i.id} className={i.done ? 'done' : ''}>
            <button
              className={`box ${i.done ? 'on' : ''}`}
              role="checkbox"
              aria-checked={i.done}
              aria-label={i.text}
              onClick={() => actions.updateItem(i.id, { done: !i.done })}
            >
              <CheckIcon width={14} height={14} />
            </button>
            <span className="item-text" onClick={() => actions.updateItem(i.id, { done: !i.done })}>
              {i.text}
            </span>
            <button className="remove" onClick={() => actions.deleteItem(i.id)} aria-label={`Quitar "${i.text}"`}>
              <CloseIcon width={16} height={16} />
            </button>
          </li>
        ))}
      </ul>

      <form className="add-item" onSubmit={add}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Añadir un paso…" />
        <button className="icon-btn filled" aria-label="Añadir paso" disabled={!text.trim()}>
          <PlusIcon width={18} height={18} />
        </button>
      </form>
    </section>
  )
}

function GoalEditor({ goal, onClose }) {
  const { actions } = useStore()
  const [title, setTitle] = useState(goal.title ?? '')
  const isNew = !goal.id

  const submit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    if (isNew) actions.addGoal(title.trim())
    else actions.updateGoal(goal.id, { title: title.trim() })
    onClose()
  }

  const remove = () => {
    if (window.confirm('¿Borrar esta meta y todos sus pasos?')) {
      actions.deleteGoal(goal.id)
      onClose()
    }
  }

  return (
    <Sheet title={isNew ? 'Nueva meta' : 'Editar meta'} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Nombre de la meta</span>
          <input autoFocus={isNew} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Conseguir 100 seguidores" required />
        </label>
        <button className="btn primary full">{isNew ? 'Crear meta' : 'Guardar'}</button>
        {!isNew && (
          <button type="button" className="btn danger-ghost full" onClick={remove}>
            <TrashIcon width={18} height={18} /> Borrar meta
          </button>
        )}
      </form>
    </Sheet>
  )
}

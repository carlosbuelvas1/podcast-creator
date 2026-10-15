import { useState } from 'react'
import { useStore, useProject } from '../context'
import Sheet, { Segmented } from '../Sheet'
import { CheckIcon, CloseIcon, PlusIcon, TrashIcon } from '../icons'
import { COLUMNS, PEOPLE, personClass } from '../constants'

export default function StepSheet({ task, onClose }) {
  const { actions } = useStore()
  const { project, phases, tasks, items } = useProject()
  const isNew = !task.id
  const [title, setTitle] = useState(task.title ?? '')
  const [explanation, setExplanation] = useState(task.explanation ?? '')
  const [phaseId, setPhaseId] = useState(task.phase_id ?? phases[0]?.id)
  const [owner, setOwner] = useState(task.owner ?? '')
  const [due, setDue] = useState(task.due_date ?? '')
  const [status, setStatus] = useState(task.status ?? 'todo')
  const [newItem, setNewItem] = useState('')

  const checklist = items.filter((i) => i.task_id === task.id)
  const phase = phases.find((p) => p.id === phaseId)

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

  const remove = () => {
    if (window.confirm('¿Borrar este paso?')) {
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

  return (
    <Sheet title={isNew ? 'Nuevo paso' : phase?.title ?? 'Paso'} onClose={onClose}>
      {!isNew && (
        <>
          <h3 className="step-title">{task.title}</h3>
          {task.explanation && <p className="explain">{task.explanation}</p>}
          <div className="sheet-section">
            <span className="section-label">
              Lista para marcar · {checklist.filter((i) => i.done).length} de {checklist.length}
            </span>
            <ul className="checklist">
              {checklist.map((i) => (
                <li key={i.id} className={i.done ? 'done' : ''}>
                  <button
                    type="button"
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
                  <button type="button" className="remove" onClick={() => actions.deleteItem(i.id)} aria-label={`Quitar "${i.text}"`}>
                    <CloseIcon width={16} height={16} />
                  </button>
                </li>
              ))}
            </ul>
            <form className="add-item" onSubmit={addItem}>
              <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Añadir a la lista…" />
              <button className="icon-btn filled" aria-label="Añadir" disabled={!newItem.trim()}>
                <PlusIcon width={18} height={18} />
              </button>
            </form>
          </div>
        </>
      )}

      <form onSubmit={submit} className="sheet-section">
        {!isNew && <span className="section-label">Detalles del paso</span>}
        <label className="field">
          <span>Nombre del paso</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Grabar la intro" required />
        </label>
        {isNew && (
          <label className="field">
            <span>Explicación (opcional)</span>
            <textarea rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span>Fase</span>
          <select value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
            {phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.position}. {p.title}
              </option>
            ))}
          </select>
        </label>
        <div className="field">
          <span>¿Quién se encarga?</span>
          <Segmented
            name="Responsable"
            value={owner}
            onChange={setOwner}
            options={[...PEOPLE.map((p) => ({ value: p, label: p, className: personClass(p) })), { value: '', label: 'Nadie aún' }]}
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
        <button className="btn primary full">{isNew ? 'Crear paso' : 'Guardar'}</button>
        {!isNew && (
          <button type="button" className="btn danger-ghost full" onClick={remove}>
            <TrashIcon width={18} height={18} /> Borrar paso
          </button>
        )}
      </form>
    </Sheet>
  )
}

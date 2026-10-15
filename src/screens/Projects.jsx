import { useState } from 'react'
import { useStore } from '../context'
import Sheet from '../Sheet'
import { CheckIcon, MicIcon, PlusIcon, TrashIcon } from '../icons'
import { progressOf } from '../constants'

export function NewProjectForm({ onDone, submitLabel = 'Crear proyecto' }) {
  const { actions } = useStore()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const id = await actions.createProject({ name: name.trim(), goal: goal.trim(), launch_date: date })
    setBusy(false)
    if (id) onDone?.(id)
  }

  return (
    <form onSubmit={submit}>
      <label className="field">
        <span>Nombre del podcast</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Mi primer podcast" required />
      </label>
      <label className="field">
        <span>Meta del lanzamiento (opcional)</span>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Ej. Lanzar con 3 episodios listos" />
      </label>
      <label className="field">
        <span>Fecha de lanzamiento (opcional)</span>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <button className="btn primary full" disabled={busy || !name.trim()}>
        {busy ? 'Creando…' : submitLabel}
      </button>
    </form>
  )
}

export function Welcome() {
  return (
    <div className="welcome card">
      <div className="welcome-icon">
        <MicIcon width={30} height={30} />
      </div>
      <h1>Creen su primer podcast</h1>
      <p className="muted">
        Les preparamos todas las fases, de la idea al lanzamiento, con pasos claros y listas para marcar. Solo pónganle nombre.
      </p>
      <NewProjectForm submitLabel="Empezar" />
    </div>
  )
}

export function ProjectSwitcher({ onClose, onPick }) {
  const { projects, tasks, project, selectProject } = useStore()
  const [creating, setCreating] = useState(false)

  const pick = (id) => {
    selectProject(id)
    onPick()
    onClose()
  }

  return (
    <Sheet title={creating ? 'Nuevo podcast' : 'Sus podcasts'} onClose={onClose}>
      {creating ? (
        <NewProjectForm onDone={pick} />
      ) : (
        <>
          <ul className="project-list">
            {projects.map((p) => {
              const { pct } = progressOf(tasks.filter((t) => t.project_id === p.id))
              return (
                <li key={p.id}>
                  <button className={p.id === project?.id ? 'on' : ''} onClick={() => pick(p.id)}>
                    <span className="project-name">{p.name}</span>
                    <span className="project-pct">{pct}%</span>
                    {p.id === project?.id && <CheckIcon width={18} height={18} />}
                  </button>
                </li>
              )
            })}
          </ul>
          <button className="btn full" onClick={() => setCreating(true)}>
            <PlusIcon width={18} height={18} /> Nuevo podcast
          </button>
        </>
      )}
    </Sheet>
  )
}

export function ProjectEditor({ project, onClose }) {
  const { actions } = useStore()
  const [name, setName] = useState(project.name)
  const [goal, setGoal] = useState(project.goal ?? '')
  const [date, setDate] = useState(project.launch_date ?? '')

  const submit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    actions.updateProject(project.id, { name: name.trim(), goal: goal.trim() || null, launch_date: date || null })
    onClose()
  }

  const remove = () => {
    if (window.confirm(`¿Borrar "${project.name}" con todas sus tareas? Esto no se puede deshacer.`)) {
      actions.deleteProject(project.id)
      onClose()
    }
  }

  return (
    <Sheet title="Editar proyecto" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="field">
          <span>Nombre del podcast</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          <span>Meta del lanzamiento</span>
          <textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <label className="field">
          <span>Fecha de lanzamiento</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <button className="btn primary full">Guardar</button>
        <button type="button" className="btn danger-ghost full" onClick={remove}>
          <TrashIcon width={18} height={18} /> Borrar proyecto
        </button>
      </form>
    </Sheet>
  )
}

import { useState } from 'react'
import { CAL_STATUS, KINDS, kindLabel } from '../trackers'
import { useStore, useProject, useNav } from '../context'
import { Segmented } from '../Sheet'
import { PlusIcon, TrashIcon } from '../icons'
import { shortDate } from '../dates'


const monthName = (iso) => {
  if (!iso) return 'Sin fecha'
  const [y, m] = iso.split('-').map(Number)
  const label = new Date(y, m - 1, 1).toLocaleDateString('es', { month: 'long', year: 'numeric' })
  return label[0].toUpperCase() + label.slice(1)
}

export default function Proximamente() {
  const { actions } = useStore()
  const { project, calendar, guests } = useProject()
  const { go } = useNav()
  const [form, setForm] = useState({ title: '', kind: 'episode', publish_on: '' })
  const [view, setView] = useState('month')

  const add = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    actions.add('calendar', { project_id: project.id, title: form.title.trim(), kind: form.kind, publish_on: form.publish_on || null, status: 'planned' })
    setForm({ title: '', kind: form.kind, publish_on: '' })
  }

  const sorted = [...calendar].sort((a, b) => (a.publish_on ?? '9999').localeCompare(b.publish_on ?? '9999'))
  const groups = view === 'month' ? Object.entries(Object.groupBy ? Object.groupBy(sorted, (c) => monthName(c.publish_on)) : sorted.reduce((acc, c) => ((acc[monthName(c.publish_on)] ??= []).push(c), acc), {})) : [['', sorted]]

  return (
    <>
      <div className="page-head">
        <h1>Próximamente</h1>
      </div>
      <form className="card quick-add" onSubmit={add}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título del episodio, short o vlog" aria-label="Título" />
        <Segmented name="Tipo" value={form.kind} onChange={(kind) => setForm({ ...form, kind })} options={KINDS.map((k) => ({ value: k.id, label: k.label }))} />
        <label className="field">
          <span>Fecha de publicación</span>
          <input type="date" value={form.publish_on} onChange={(e) => setForm({ ...form, publish_on: e.target.value })} />
        </label>
        <button className="btn primary" disabled={!form.title.trim()}>
          <PlusIcon width={18} height={18} /> Añadir
        </button>
      </form>
      <Segmented name="Vista" value={view} onChange={setView} options={[{ value: 'month', label: 'Por mes' }, { value: 'list', label: 'Lista' }]} />
      {calendar.length === 0 ? (
        <p className="muted empty">Elijan un día fijo para publicar y tengan 3 episodios de reserva antes de lanzar.</p>
      ) : (
        groups.map(([label, list]) => (
          <section key={label || 'all'} className="month">
            {label && <h3 className="month-title">{label}</h3>}
            <ul className="tracker-list">
              {list.map((c) => (
                <li key={c.id} className="card tracker-item">
                  <div className="tracker-main">
                    <b>{c.title}</b>
                    <span className="muted small">
                      {kindLabel(c.kind)} · {c.publish_on ? shortDate(c.publish_on) : 'Sin fecha'}
                      {c.guest_id && ` · con ${guests.find((g) => g.id === c.guest_id)?.name ?? 'invitado'}`}
                    </span>
                  </div>
                  <select className={`status-chip c-${c.status}`} value={c.status} onChange={(e) => actions.update('calendar', c.id, { status: e.target.value })} aria-label="Estado">
                    {CAL_STATUS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                  <div className="tracker-extra row">
                    <input type="date" value={c.publish_on ?? ''} onChange={(e) => actions.update('calendar', c.id, { publish_on: e.target.value || null })} aria-label="Fecha" />
                    <select value={c.guest_id ?? ''} onChange={(e) => actions.update('calendar', c.id, { guest_id: e.target.value || null })} aria-label="Invitado">
                      <option value="">Sin invitado</option>
                      {guests.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    <button className="btn small ghost" onClick={() => go('modulos', `lab:${c.id}`)}>Laboratorio</button>
                    <button className="icon-btn" onClick={() => window.confirm('¿Borrar del calendario?') && actions.remove('calendar', c.id)} aria-label="Borrar">
                      <TrashIcon width={16} height={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  )
}

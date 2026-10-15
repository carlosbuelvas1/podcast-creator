import { useState } from 'react'
import { useStore, useProject } from '../context'
import { askAI, aiEnabled } from '../ai'
import { LinkIcon, PlusIcon, SparkIcon, TrashIcon } from '../icons'

const ROWS = [
  ['format', 'Formato', (b) => b.promise],
  ['length', 'Duración', () => ''],
  ['hook', 'Gancho del inicio', () => ''],
  ['titles', 'Títulos', () => ''],
  ['thumbnails', 'Miniaturas', (b) => b.palette],
  ['cadence', 'Cada cuánto publican', () => ''],
  ['guests', 'Invitados', () => ''],
  ['shorts', 'Shorts', () => ''],
  ['monetization', 'Cómo ganan dinero', () => ''],
  ['branding', 'Marca', (b) => [b.tagline, b.palette].filter(Boolean).join(' · ')],
  ['audience', 'A quién le hablan', (b) => [b.persona?.age, b.persona?.location, b.persona?.interests].filter(Boolean).join(', ')],
]

export default function Referentes() {
  const { actions, me, notify } = useStore()
  const { project, references, phases, tasks, brief } = useProject()
  const [form, setForm] = useState({ name: '', url: '', notes: '', pasted: '' })
  const [busy, setBusy] = useState(null)
  const [open, setOpen] = useState(null)

  const add = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const notes = [form.notes.trim(), form.pasted.trim() && `Pegado:\n${form.pasted.trim()}`].filter(Boolean).join('\n\n')
    const row = actions.add('references', { project_id: project.id, name: form.name.trim(), url: form.url.trim() || null, notes })
    setForm({ name: '', url: '', notes: '', pasted: '' })
    setOpen(row.id)
  }

  const analyze = async (r) => {
    setBusy(r.id)
    try {
      const data = await askAI({ projectId: project.id, mode: 'reference', message: r.name, author: me, context: { reference_id: r.id } })
      actions.update('references', r.id, { analysis: data.result, ...(data.stats ? { stats: data.stats } : {}) })
      setOpen(r.id)
    } catch (e) {
      notify(e.message)
    } finally {
      setBusy(null)
    }
  }

  const steal = (idea, kind) => {
    if (kind === 'idea') actions.add('ideas', { project_id: project.id, title: idea, kind: 'episode', tags: ['referente'], notes: '', scheduled: false })
    else {
      const phase = phases.find((p) => tasks.some((t) => t.phase_id === p.id && t.status !== 'done')) ?? phases[0]
      const position = Math.max(0, ...tasks.filter((t) => t.phase_id === phase?.id).map((t) => t.position)) + 1
      actions.addTask({ project_id: project.id, phase_id: phase?.id, title: idea, position, owner: me })
    }
    notify(kind === 'idea' ? 'Idea agregada.' : 'Tarea creada.')
  }

  return (
    <>
      <div className="page-head">
        <h1>Referentes</h1>
      </div>
      <p className="hint notice">La IA solo analiza lo que pegas y datos públicos. Inspírate, no copies.</p>
      <form className="card quick-add" onSubmit={add}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nombre del podcast" aria-label="Nombre" />
        <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Enlace de YouTube o Spotify" aria-label="Enlace" />
        <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="¿Qué te gusta de este show?" aria-label="Notas" />
        <textarea rows={2} value={form.pasted} onChange={(e) => setForm({ ...form, pasted: e.target.value })} placeholder="Opcional: pega títulos recientes o la descripción" aria-label="Texto pegado" />
        <button className="btn primary" disabled={!form.name.trim()}>
          <PlusIcon width={18} height={18} /> Añadir referente
        </button>
      </form>
      {references.length === 0 && <p className="muted empty">Agreguen 3 a 5 podcasts que admiran.</p>}
      <ul className="tracker-list">
        {references.map((r) => (
          <li key={r.id} className="card tracker-item block">
            <button className="tracker-main" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
              <b>{r.name}</b>
              <span className="muted small">{r.analysis ? 'Analizado' : 'Sin analizar'}{r.stats?.subscribers ? ` · ${Number(r.stats.subscribers).toLocaleString('es')} suscriptores` : ''}</span>
            </button>
            {open === r.id && (
              <div className="tracker-extra">
                {r.url && (
                  <a className="link-pill" href={r.url} target="_blank" rel="noreferrer">
                    <LinkIcon width={14} height={14} /> Abrir
                  </a>
                )}
                {r.notes && <p className="muted small pre">{r.notes}</p>}
                {aiEnabled() && (
                  <button className="btn primary" disabled={busy === r.id} onClick={() => analyze(r)}>
                    <SparkIcon width={16} height={16} /> {busy === r.id ? 'Analizando…' : r.analysis ? 'Analizar de nuevo' : 'Analizar con IA'}
                  </button>
                )}
                {r.analysis && (
                  <>
                    <div className="compare" role="table" aria-label="Comparación">
                      <div className="compare-row head" role="row">
                        <span role="columnheader" />
                        <span role="columnheader">{r.name}</span>
                        <span role="columnheader">Nosotros</span>
                      </div>
                      {ROWS.map(([k, label, ours]) => (
                        <div key={k} className="compare-row" role="row">
                          <b role="rowheader">{label}</b>
                          <span role="cell">{r.analysis[k] ?? '—'}</span>
                          <span role="cell" className="muted">{ours(brief) || '—'}</span>
                        </div>
                      ))}
                    </div>
                    {(r.analysis.steal ?? []).length > 0 && (
                      <div className="guide-block">
                        <h4>Ideas para robar</h4>
                        <ul className="steal">
                          {r.analysis.steal.map((s) => (
                            <li key={s}>
                              <span>{s}</span>
                              <span className="tool-row">
                                <button className="btn small ghost" onClick={() => steal(s, 'idea')}>A Ideas</button>
                                <button className="btn small ghost" onClick={() => steal(s, 'task')}>Crear tarea</button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
                <button className="btn danger-ghost" onClick={() => window.confirm(`¿Borrar ${r.name}?`) && actions.remove('references', r.id)}>
                  <TrashIcon width={16} height={16} /> Borrar
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

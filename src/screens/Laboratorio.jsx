import { useState } from 'react'
import { useStore, useProject } from '../context'
import { askAI, aiEnabled } from '../ai'
import { SparkIcon } from '../icons'

const MODES = [
  { id: 'thumbnails', label: 'Miniaturas' },
  { id: 'titles', label: 'Títulos' },
  { id: 'seo', label: 'SEO' },
]

function Copy({ text }) {
  const [ok, setOk] = useState(false)
  return (
    <button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}>
      {ok ? 'Copiado ✓' : 'Copiar'}
    </button>
  )
}

const asText = (kind, c) => {
  if (kind === 'title') return c.title
  if (kind === 'thumbnail') return `${c.text}\nExpresión: ${c.expression}\nComposición: ${c.composition}\nColores: ${(c.colors ?? []).join(', ')}`
  return [c.description, `Palabras clave: ${(c.keywords ?? []).join(', ')}`, `Etiquetas: ${(c.tags ?? []).join(', ')}`, (c.chapters ?? []).join('\n'), Object.entries(c.hashtags ?? {}).map(([k, v]) => `${k}: ${(v ?? []).join(' ')}`).join('\n')].filter(Boolean).join('\n\n')
}

export default function Laboratorio({ itemId = null }) {
  const { actions, me, notify } = useStore()
  const { project, calendar, favorites } = useProject()
  const [selected, setSelected] = useState(itemId ?? calendar[0]?.id ?? '')
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(null)
  const [results, setResults] = useState({})
  const item = calendar.find((c) => c.id === selected)
  const subject = item ? item.title : topic

  const run = async (mode) => {
    if (!subject.trim()) return notify('Elige un episodio o escribe el tema.')
    setBusy(mode)
    try {
      const data = await askAI({ projectId: project.id, mode, message: subject, author: me, context: { calendar_item_id: item?.id ?? null } })
      setResults((r) => ({ ...r, [mode]: data.result }))
    } catch (e) {
      notify(e.message)
    } finally {
      setBusy(null)
    }
  }

  const star = (kind, content) => actions.add('favorites', { project_id: project.id, calendar_item_id: item?.id ?? null, kind, content })
  const mine = favorites.filter((f) => !item || f.calendar_item_id === item.id)

  if (!aiEnabled()) return <p className="muted empty">El laboratorio usa la IA. Actívala en Mi cuenta para usarlo.</p>

  return (
    <>
      <div className="page-head">
        <h1>Laboratorio</h1>
      </div>
      <section className="card">
        <label className="field">
          <span>Episodio</span>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Otro tema…</option>
            {calendar.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        {!item && (
          <label className="field">
            <span>Tema o resumen</span>
            <textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="De qué trata, invitado, minutos clave…" />
          </label>
        )}
        <div className="tool-row">
          {MODES.map((m) => (
            <button key={m.id} className="btn primary" disabled={busy !== null} onClick={() => run(m.id)}>
              <SparkIcon width={16} height={16} /> {busy === m.id ? 'Pensando…' : m.label}
            </button>
          ))}
        </div>
      </section>

      {results.thumbnails && (
        <section className="card">
          <h3 className="card-title">Conceptos de miniatura</h3>
          <ul className="lab-list">
            {(results.thumbnails.concepts ?? []).map((c) => (
              <li key={c.text}>
                <b className="thumb-text">{c.text}</b>
                <span className="muted small">Expresión: {c.expression}</span>
                <span className="muted small">Composición: {c.composition}</span>
                <span className="swatches">{(c.colors ?? []).map((col) => <span key={col} className="swatch" style={{ background: col }} title={col} />)}</span>
                <span className="tool-row">
                  <button className="btn small ghost" onClick={() => star('thumbnail', c)} aria-label="Guardar en favoritos">⭐</button>
                  <Copy text={asText('thumbnail', c)} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.titles && (
        <section className="card">
          <h3 className="card-title">Títulos</h3>
          <ul className="lab-list">
            {(results.titles.titles ?? []).map((t) => (
              <li key={t.title}>
                <b>{t.title}</b>
                <span className="chips">
                  <span className="chip subtle">{t.hook}</span>
                  <span className="chip subtle">Curiosidad {t.curiosity}/10</span>
                  <span className="chip subtle">Claridad {t.clarity}/10</span>
                  <span className={`chip ${t.title.length > 60 ? 'warn' : 'subtle'}`}>{t.title.length} caracteres{t.title.length > 60 ? ' · muy largo' : ''}</span>
                </span>
                <span className="tool-row">
                  <button className="btn small ghost" onClick={() => star('title', t)} aria-label="Guardar en favoritos">⭐</button>
                  <Copy text={t.title} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.seo && (
        <section className="card">
          <h3 className="card-title">SEO</h3>
          <div className="lab-list">
            <p>{results.seo.description}</p>
            <p className="muted small">Palabras clave: {(results.seo.keywords ?? []).join(', ')}</p>
            <p className="muted small">Etiquetas: {(results.seo.tags ?? []).join(', ')}</p>
            {(results.seo.chapters ?? []).length > 0 && <pre className="chapters">{results.seo.chapters.join('\n')}</pre>}
            {Object.entries(results.seo.hashtags ?? {}).map(([k, v]) => (
              <p key={k} className="small"><b>{k}:</b> {(v ?? []).join(' ')}</p>
            ))}
            <span className="tool-row">
              <button className="btn small ghost" onClick={() => star('seo', results.seo)} aria-label="Guardar en favoritos">⭐</button>
              <Copy text={asText('seo', results.seo)} />
            </span>
          </div>
        </section>
      )}

      <section className="card">
        <h3 className="card-title">Favoritos {item ? 'de este episodio' : ''}</h3>
        {mine.length === 0 ? (
          <p className="muted empty">Toca ⭐ en cualquier resultado para guardarlo aquí.</p>
        ) : (
          <ul className="lab-list">
            {mine.map((f) => (
              <li key={f.id}>
                <span className="chip subtle">{f.kind === 'title' ? 'Título' : f.kind === 'thumbnail' ? 'Miniatura' : 'SEO'}</span>
                <span className="pre">{asText(f.kind, f.content)}</span>
                <span className="tool-row">
                  <Copy text={asText(f.kind, f.content)} />
                  <button className="btn small danger-ghost" onClick={() => actions.remove('favorites', f.id)}>Quitar</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

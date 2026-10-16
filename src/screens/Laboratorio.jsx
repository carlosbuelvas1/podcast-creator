import { useState } from 'react'
import { useStore, useProject } from '../context'
import { askAI, aiEnabled } from '../ai'
import { SparkIcon, StarIcon } from '../icons'
import { t, tk } from '../i18n'

const MODES = [
  { id: 'thumbnails', label: tk('Miniaturas') },
  { id: 'titles', label: tk('Títulos') },
  { id: 'seo', label: 'SEO' },
  { id: 'script', label: tk('Guion') },
]

function Copy({ text }) {
  const [ok, setOk] = useState(false)
  return (
    <button className="btn small ghost" onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) })}>
      {ok ? t('Copiado ✓') : t('Copiar')}
    </button>
  )
}

const asText = (kind, c) => {
  if (kind === 'title') return c.title
  if (kind === 'script') return [c.hook, ...(c.segments ?? []).map((s) => `${s.title} (${s.minutes} min)\n${(s.points ?? []).map((x) => `- ${x}`).join('\n')}`), c.closing, c.script].filter(Boolean).join('\n\n')
  if (kind === 'thumbnail') return `${c.text}\n${t('Expresión')}: ${c.expression}\n${t('Composición')}: ${c.composition}\n${t('Colores')}: ${(c.colors ?? []).join(', ')}`
  return [c.description, `${t('Palabras clave')}: ${(c.keywords ?? []).join(', ')}`, `${t('Etiquetas')}: ${(c.tags ?? []).join(', ')}`, (c.chapters ?? []).join('\n'), Object.entries(c.hashtags ?? {}).map(([k, v]) => `${k}: ${(v ?? []).join(' ')}`).join('\n')].filter(Boolean).join('\n\n')
}

export default function Laboratorio({ itemId = null }) {
  const { actions, me, notify, demo } = useStore()
  const { project, calendar, favorites } = useProject()
  const [selected, setSelected] = useState(itemId ?? calendar[0]?.id ?? '')
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(null)
  const [results, setResults] = useState({})
  const item = calendar.find((c) => c.id === selected)
  const subject = item ? item.title : topic

  const run = async (mode) => {
    if (!subject.trim()) return notify(t('Elige un episodio o escribe el tema.'))
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

  if (!aiEnabled()) return <p className="muted empty">{t('El laboratorio usa la IA. Actívala en Mi cuenta para usarlo.')}</p>

  return (
    <>
      <div className="page-head">
        <h1>{t('Laboratorio')}</h1>
      </div>
      {demo && <p className="hint">{t('IA activada en la demo: los resultados son ejemplos y no se guardan.')}</p>}
      <section className="card">
        <label className="field">
          <span>{t('Episodio')}</span>
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">{t('Otro tema…')}</option>
            {calendar.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        {!item && (
          <label className="field">
            <span>{t('Tema o resumen')}</span>
            <textarea rows={2} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={t('De qué trata, invitado, minutos clave…')} />
          </label>
        )}
        <div className="tool-row">
          {MODES.map((m) => (
            <button key={m.id} className="btn primary" disabled={busy !== null} onClick={() => run(m.id)}>
              <SparkIcon width={16} height={16} /> {busy === m.id ? t('Pensando…') : t(m.label)}
            </button>
          ))}
        </div>
      </section>

      {results.thumbnails && (
        <section className="card">
          <h3 className="card-title">{t('Conceptos de miniatura')}</h3>
          <ul className="lab-list">
            {(results.thumbnails.concepts ?? []).map((c) => (
              <li key={c.text}>
                <b className="thumb-text">{c.text}</b>
                <span className="muted small">{t('Expresión')}: {c.expression}</span>
                <span className="muted small">{t('Composición')}: {c.composition}</span>
                <span className="swatches">{(c.colors ?? []).map((col) => <span key={col} className="swatch" style={{ background: col }} title={col} />)}</span>
                <span className="tool-row">
                  <button className="btn small ghost" onClick={() => star('thumbnail', c)} aria-label={t('Guardar en favoritos')}><StarIcon width={16} height={16} /></button>
                  <Copy text={asText('thumbnail', c)} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.titles && (
        <section className="card">
          <h3 className="card-title">{t('Títulos')}</h3>
          <ul className="lab-list">
            {(results.titles.titles ?? []).map((item) => (
              <li key={item.title}>
                <b>{item.title}</b>
                <span className="chips">
                  <span className="chip subtle">{item.hook}</span>
                  <span className="chip subtle">{t('Curiosidad')} {item.curiosity}/10</span>
                  <span className="chip subtle">{t('Claridad')} {item.clarity}/10</span>
                  <span className={`chip ${item.title.length > 60 ? 'warn' : 'subtle'}`}>{item.title.length} caracteres{item.title.length > 60 ? ' · muy largo' : ''}</span>
                </span>
                <span className="tool-row">
                  <button className="btn small ghost" onClick={() => star('title', item)} aria-label={t('Guardar en favoritos')}><StarIcon width={16} height={16} /></button>
                  <Copy text={item.title} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {results.script && (
        <section className="card">
          <h3 className="card-title">{t('Estructura y guion')}</h3>
          <div className="lab-list">
            {results.script.hook && <p><b>{t('Gancho')}:</b> {results.script.hook}</p>}
            <ol className="segments">
              {(results.script.segments ?? []).map((s) => (
                <li key={s.title}>
                  <b>{s.title}</b> <span className="muted small">· {s.minutes} min</span>
                  <ul className="bullets">
                    {(s.points ?? []).map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </li>
              ))}
            </ol>
            {results.script.closing && <p><b>{t('Cierre')}:</b> {results.script.closing}</p>}
            {results.script.script && <pre className="chapters">{results.script.script}</pre>}
            <span className="tool-row">
              <button className="btn small ghost" onClick={() => star('script', results.script)} aria-label={t('Guardar en favoritos')}><StarIcon width={16} height={16} /></button>
              <Copy text={asText('script', results.script)} />
            </span>
          </div>
        </section>
      )}

      {results.seo && (
        <section className="card">
          <h3 className="card-title">SEO</h3>
          <div className="lab-list">
            <p>{results.seo.description}</p>
            <p className="muted small">{t('Palabras clave')}: {(results.seo.keywords ?? []).join(', ')}</p>
            <p className="muted small">{t('Etiquetas')}: {(results.seo.tags ?? []).join(', ')}</p>
            {(results.seo.chapters ?? []).length > 0 && <pre className="chapters">{results.seo.chapters.join('\n')}</pre>}
            {Object.entries(results.seo.hashtags ?? {}).map(([k, v]) => (
              <p key={k} className="small"><b>{k}:</b> {(v ?? []).join(' ')}</p>
            ))}
            <span className="tool-row">
              <button className="btn small ghost" onClick={() => star('seo', results.seo)} aria-label={t('Guardar en favoritos')}><StarIcon width={16} height={16} /></button>
              <Copy text={asText('seo', results.seo)} />
            </span>
          </div>
        </section>
      )}

      <section className="card">
        <h3 className="card-title">{item ? t('Favoritos de este episodio') : t('Favoritos')}</h3>
        {mine.length === 0 ? (
          <p className="muted empty">{t('Toca la estrella en cualquier resultado para guardarlo aquí.')}</p>
        ) : (
          <ul className="lab-list">
            {mine.map((f) => (
              <li key={f.id}>
                <span className="chip subtle">{f.kind === 'title' ? t('Título') : f.kind === 'thumbnail' ? t('Miniatura') : f.kind === 'script' ? t('Guion') : 'SEO'}</span>
                <span className="pre">{asText(f.kind, f.content)}</span>
                <span className="tool-row">
                  <Copy text={asText(f.kind, f.content)} />
                  <button className="btn small danger-ghost" onClick={() => actions.remove('favorites', f.id)}>{t('Quitar')}</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

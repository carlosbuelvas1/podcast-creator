import { useState } from 'react'
import { useStore, useProject } from '../context'
import { researchReference } from '../ai'
import { LinkIcon, PlusIcon, SparkIcon, TrashIcon } from '../icons'
import { getLang, t, tk } from '../i18n'

const ROWS = [
  ['format', tk('Formato'), (b) => b.promise],
  ['length', tk('Duración'), () => ''],
  ['hook', tk('Gancho del inicio'), () => ''],
  ['titles', tk('Títulos'), () => ''],
  ['thumbnails', tk('Miniaturas'), (b) => b.palette],
  ['cadence', tk('Cada cuánto publican'), () => ''],
  ['guests', tk('Invitados'), () => ''],
  ['shorts', tk('Shorts'), () => ''],
  ['monetization', tk('Cómo ganan dinero'), () => ''],
  ['branding', tk('Marca'), (b) => [b.tagline, b.palette].filter(Boolean).join(' · ')],
  ['audience', tk('A quién le hablan'), (b) => [b.persona?.age, b.persona?.location, b.persona?.interests].filter(Boolean).join(', ')],
]

const SOURCES = [
  ['youtube', 'YouTube'],
  ['apple', 'Apple Podcasts'],
  ['spotify', 'Spotify'],
]

const compact = (n) => (n || n === 0 ? new Intl.NumberFormat(getLang(), { notation: 'compact', maximumFractionDigits: 1 }).format(n) : '—')
const days = (d) => (d ? (d < 1.5 ? t('A diario') : `Cada ${String(d).replace('.', ',')} días`) : '—')
const mins = (m) => (m ? `${Math.round(m)} min` : '—')
const when = (iso) => new Date(iso).toLocaleDateString(getLang(), { day: 'numeric', month: 'short' })

function Stat({ label, value }) {
  return (
    <div className="stat">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{t(label)}</span>
    </div>
  )
}

function Picker({ found, onPick, busy }) {
  const [choice, setChoice] = useState(() => Object.fromEntries(SOURCES.map(([k]) => [k, found[k]?.[0]?.id ?? null])))
  return (
    <div className="guide-block picker">
      <h4>{t('¿Cuál es el que buscan?')}</h4>
      <p className="muted small">{t('Encontramos varios con ese nombre. Elijan el correcto en cada plataforma.')}</p>
      {SOURCES.filter(([k]) => found[k]?.length).map(([k, label]) => (
        <fieldset key={k} className="cand-group">
          <legend>{t(label)}</legend>
          {found[k].map((c) => (
            <label key={c.id} className={`cand ${choice[k] === c.id ? 'on' : ''}`}>
              <input type="radio" name={k} checked={choice[k] === c.id} onChange={() => setChoice({ ...choice, [k]: c.id })} />
              {c.image ? <img src={c.image} alt="" loading="lazy" /> : <span className="cand-img" />}
              <span>
                <b>{c.title}</b>
                {c.detail && <span className="muted small"> {c.detail}</span>}
              </span>
            </label>
          ))}
          <label className={`cand ${choice[k] === null ? 'on' : ''}`}>
            <input type="radio" name={k} checked={choice[k] === null} onChange={() => setChoice({ ...choice, [k]: null })} />
            <span className="muted">{t('Ninguno de estos')}</span>
          </label>
        </fieldset>
      ))}
      <button className="btn primary" disabled={busy} onClick={() => onPick(choice)}>
        {busy ? t('Investigando…') : t('Investigar este')}
      </button>
    </div>
  )
}

function Research({ stats }) {
  const { youtube: yt, apple: ap, spotify: sp, social } = stats
  const nothing = !yt && !ap && !sp && !social
  return (
    <>
      {nothing && <p className="muted small">{t('No encontramos datos públicos con ese nombre. Prueben con el nombre exacto o agreguen el enlace de YouTube.')}</p>}
      {yt && (
        <div className="guide-block">
          <h4>
            YouTube ·{' '}
            <a href={yt.url} target="_blank" rel="noreferrer">
              {yt.title}
            </a>
          </h4>
          <div className="stat-grid">
            <Stat label={t('Suscriptores')} value={compact(yt.subscribers)} />
            <Stat label={t('Vistas totales')} value={compact(yt.views)} />
            <Stat label={t('Videos')} value={compact(yt.videos)} />
            <Stat label={t('Publican')} value={days(yt.every_days)} />
            <Stat label={t('Duración promedio')} value={mins(yt.avg_minutes)} />
            <Stat label={t('Shorts / largos')} value={`${yt.shorts} / ${yt.long}`} />
          </div>
          {yt.recent?.length > 0 && (
            <>
              <div className="thumbs">
                {yt.recent.slice(0, 8).map((v) => (
                  <a key={v.url} href={v.url} target="_blank" rel="noreferrer" title={v.title}>
                    <img src={v.thumb} alt={v.title} loading="lazy" />
                  </a>
                ))}
              </div>
              <details className="recent">
                <summary>{t('Últimos {n} videos', { n: yt.recent.length })}</summary>
                <ol>
                  {yt.recent.map((v) => (
                    <li key={v.url}>
                      <a href={v.url} target="_blank" rel="noreferrer">{v.title}</a>
                      <span className="muted small"> · {t('{n} vistas', { n: compact(v.views) })} · {Math.round(v.seconds / 60) || '<1'} min</span>
                    </li>
                  ))}
                </ol>
              </details>
            </>
          )}
        </div>
      )}
      {(ap || sp) && (
        <div className="guide-block">
          <h4>{t('Plataformas de podcast')}</h4>
          <div className="stat-grid">
            {ap && <Stat label={t('Categoría (Apple)')} value={ap.category ?? '—'} />}
            {ap && <Stat label={t('Episodios (Apple)')} value={compact(ap.episodes)} />}
            {ap && <Stat label={t('Publican')} value={days(ap.every_days)} />}
            {ap && <Stat label={t('Duración promedio')} value={mins(ap.avg_minutes)} />}
            {sp && <Stat label={t('Episodios (Spotify)')} value={compact(sp.episodes)} />}
            {sp && !ap && <Stat label={t('Publican')} value={days(sp.every_days)} />}
          </div>
          {(ap?.recent ?? sp?.recent ?? []).length > 0 && (
            <details className="recent">
              <summary>{t('Últimos episodios')}</summary>
              <ol>
                {(ap?.recent ?? sp.recent).map((e) => (
                  <li key={`${e.date}${e.title}`}>
                    {e.title} <span className="muted small">· {e.date}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}
      {social && (social.instagram || social.tiktok || social.x || social.buzz?.length > 0) && (
        <div className="guide-block">
          <h4>{t('Redes y lo que se comenta')}</h4>
          <div className="tool-row">
            {[['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X']].filter(([k]) => social[k]).map(([k, label]) => (
              <a key={k} className="link-pill" href={social[k]} target="_blank" rel="noreferrer">
                <LinkIcon width={14} height={14} /> {label}
              </a>
            ))}
          </div>
          {social.buzz?.length > 0 && (
            <ul className="buzz">
              {social.buzz.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          <p className="muted small">{t('Encontrado con búsqueda web de la IA. Confirmen las cuentas antes de usarlas.')}</p>
        </div>
      )}
    </>
  )
}

export default function Referentes() {
  const { actions, me, notify } = useStore()
  const { project, references, phases, tasks, brief } = useProject()
  const [form, setForm] = useState({ name: '', url: '', notes: '', pasted: '' })
  const [more, setMore] = useState(false)
  const [busy, setBusy] = useState(null)
  const [open, setOpen] = useState(null)
  const [found, setFound] = useState({})

  const add = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const notes = [form.notes.trim(), form.pasted.trim() && `Pegado:\n${form.pasted.trim()}`].filter(Boolean).join('\n\n')
    const row = actions.add('references', { project_id: project.id, name: form.name.trim(), url: form.url.trim() || null, notes })
    setForm({ name: '', url: '', notes: '', pasted: '' })
    setMore(false)
    setOpen(row.id)
  }

  const research = async (r, { pick = null, refresh = false } = {}) => {
    setBusy(r.id)
    try {
      const data = await researchReference({ referenceId: r.id, pick, refresh })
      if (data.candidates) setFound((f) => ({ ...f, [r.id]: data.candidates }))
      else {
        setFound((f) => ({ ...f, [r.id]: null }))
        const { stats, analysis } = data.reference
        actions.update('references', r.id, analysis ? { stats, analysis } : { stats })
      }
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
    notify(kind === 'idea' ? t('Idea agregada.') : t('Tarea creada.'))
  }

  return (
    <>
      <div className="page-head">
        <h1>{t('Referentes')}</h1>
      </div>
      <p className="hint notice">{t('Escriban el nombre de un podcast o creador y toquen “Investigar”. Juntamos sus datos públicos y la IA los analiza. Inspírense, no copien.')}</p>
      <form className="card quick-add" onSubmit={add}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('Nombre del podcast o creador')} aria-label={t('Nombre')} />
        {more ? (
          <>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder={t('Opcional: enlace de YouTube o Spotify')} aria-label={t('Enlace')} />
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('Opcional: ¿qué les gusta de este show?')} aria-label={t('Notas')} />
            <textarea rows={2} value={form.pasted} onChange={(e) => setForm({ ...form, pasted: e.target.value })} placeholder={t('Opcional: pega títulos recientes o la descripción')} aria-label={t('Texto pegado')} />
          </>
        ) : (
          <button type="button" className="btn ghost small" onClick={() => setMore(true)}>
            Agregar enlace o notas (opcional)
          </button>
        )}
        <button className="btn primary" disabled={!form.name.trim()}>
          <PlusIcon width={18} height={18} /> Añadir referente
        </button>
      </form>
      {references.length === 0 && <p className="muted empty">{t('Agreguen 3 a 5 podcasts que admiran.')}</p>}
      <ul className="tracker-list">
        {references.map((r) => {
          const researched = r.stats?.researched_at
          return (
            <li key={r.id} className="card tracker-item block">
              <button className="tracker-main" onClick={() => setOpen(open === r.id ? null : r.id)} aria-expanded={open === r.id}>
                <b>{r.name}</b>
                <span className="muted small">
                  {researched ? t('Investigado el {date}', { date: when(researched) }) : r.analysis ? t('Analizado') : t('Sin investigar')}
                  {r.stats?.subscribers ? ` · ${t('{n} suscriptores', { n: compact(r.stats.subscribers) })}` : ''}
                </span>
              </button>
              {open === r.id && (
                <div className="tracker-extra">
                  {r.url && (
                    <a className="link-pill" href={r.url} target="_blank" rel="noreferrer">
                      <LinkIcon width={14} height={14} /> {t('Abrir')}
                    </a>
                  )}
                  {r.notes && <p className="muted small pre">{r.notes}</p>}
                  {found[r.id] ? (
                    <Picker found={found[r.id]} busy={busy === r.id} onPick={(pick) => research(r, { pick })} />
                  ) : (
                    <button className="btn primary" disabled={busy === r.id} onClick={() => research(r, { refresh: Boolean(researched) })}>
                      <SparkIcon width={16} height={16} /> {busy === r.id ? t('Investigando… (hasta 1 minuto)') : researched ? t('Actualizar') : t('Investigar')}
                    </button>
                  )}
                  {researched && <Research stats={r.stats} />}
                  {r.analysis && (
                    <>
                      <div className="compare" role="table" aria-label={t('Comparación')}>
                        <div className="compare-row head" role="row">
                          <span role="columnheader" />
                          <span role="columnheader">{r.name}</span>
                          <span role="columnheader">{t('Nosotros')}</span>
                        </div>
                        {ROWS.map(([k, label, ours]) => (
                          <div key={k} className="compare-row" role="row">
                            <b role="rowheader">{t(label)}</b>
                            <span role="cell">{r.analysis[k] ?? '—'}</span>
                            <span role="cell" className="muted">{ours(brief) || '—'}</span>
                          </div>
                        ))}
                      </div>
                      {r.analysis.compare && (
                        <div className="guide-block">
                          <h4>{t('Comparado con nuestra marca')}</h4>
                          <p>{r.analysis.compare}</p>
                        </div>
                      )}
                      {(r.analysis.steal ?? []).length > 0 && (
                        <div className="guide-block">
                          <h4>{t('Ideas para robar')}</h4>
                          <ul className="steal">
                            {r.analysis.steal.map((s) => (
                              <li key={s}>
                                <span>{s}</span>
                                <span className="tool-row">
                                  <button className="btn small ghost" onClick={() => steal(s, 'idea')}>{t('A Ideas')}</button>
                                  <button className="btn small ghost" onClick={() => steal(s, 'task')}>{t('Crear tarea')}</button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  {r.stats?.sources?.length > 0 && (
                    <div className="guide-block">
                      <h4>{t('Fuentes')}</h4>
                      <div className="tool-row">
                        {r.stats.sources.map((s) => (
                          <a key={s.url} className="link-pill" href={s.url} target="_blank" rel="noreferrer">
                            <LinkIcon width={14} height={14} /> {s.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="btn danger-ghost" onClick={() => window.confirm(`¿Borrar ${r.name}?`) && actions.remove('references', r.id)}>
                    <TrashIcon width={16} height={16} /> Borrar
                  </button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}

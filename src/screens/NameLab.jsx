import { useState } from 'react'
import { useStore, useProject } from '../context'
import { aiEnabled, askAI } from '../ai'
import { LABEL, TONE, briefFields, checkNames, scoreOf, scoreTone, sortByAvailability } from '../namecheck'
import { useChooseName } from '../naming'
import { CheckIcon, LinkIcon, PlusIcon, SparkIcon, TrashIcon } from '../icons'
import { t } from '../i18n'

export default function NameLab() {
  const { me, actions, notify } = useStore()
  const { project, brief } = useProject()
  const choose = useChooseName()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState('')
  const [open, setOpen] = useState(null)
  const ideas = brief.name_ideas ?? []
  const results = brief.name_results ?? {}

  const saveBrief = (data) => actions.upsert('briefs', { project_id: project.id, data: { ...brief, ...data }, updated_at: new Date().toISOString() })

  const run = async (list, base = {}) => {
    const names = list.map((i) => i.name)
    if (!names.length) return
    setBusy('check')
    try {
      const found = await checkNames(names)
      saveBrief({ ...base, name_results: { ...results, ...found } })
    } catch (e) {
      if (Object.keys(base).length) saveBrief(base)
      notify(e.message)
    }
    setBusy('')
  }

  const merge = (incoming) => {
    const known = new Set(ideas.map((i) => i.name.toLowerCase()))
    return [...ideas, ...incoming.filter((i) => i.name?.trim() && !known.has(i.name.trim().toLowerCase())).map((i) => ({ name: i.name.trim(), why: i.why ?? '' }))]
  }

  const askNames = async () => {
    setBusy('ai')
    try {
      const data = await askAI({ projectId: project.id, mode: 'names', message: t('Ideas de nombre para nuestro podcast'), author: me })
      const next = merge(data.result?.names ?? [])
      setBusy('')
      await run(next.filter((i) => !results[i.name]), { name_ideas: next })
    } catch (e) {
      setBusy('')
      notify(e.message)
    }
  }

  const add = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    const next = merge([{ name: draft }])
    setDraft('')
    run(next.filter((i) => !results[i.name]), { name_ideas: next })
  }

  const remove = (name) => {
    const rest = Object.fromEntries(Object.entries(results).filter(([k]) => k !== name))
    saveBrief({ name_ideas: ideas.filter((i) => i.name !== name), name_results: rest })
  }

  const pick = (name) => {
    if (choose(name, briefFields(results[name]))) notify(t('¡Listo! Ahora su podcast se llama {name}.', { name }))
  }

  const pending = ideas.filter((i) => !results[i.name])
  const sorted = sortByAvailability(ideas, results)

  return (
    <section className="guide-block name-lab">
      <h4>{t('Ideas de nombre')}</h4>
      <p className="muted small">{t('Revisamos dominios, redes y plataformas de podcast por ustedes. Lo que no se puede confirmar sale como “Verificar manualmente” con su enlace.')}</p>
      <div className="tool-row">
        {aiEnabled() && (
          <button type="button" className="btn primary" disabled={Boolean(busy)} onClick={askNames}>
            <SparkIcon width={18} height={18} /> {busy === 'ai' ? t('Pensando nombres…') : t('Pedir 10 nombres a la IA')}
          </button>
        )}
        {pending.length > 0 && (
          <button type="button" className="btn ghost" disabled={Boolean(busy)} onClick={() => run(pending)}>
            {t('Revisar disponibilidad')} ({pending.length})
          </button>
        )}
      </div>
      <form className="quick-add" onSubmit={add}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('Escribe una idea de nombre')} aria-label={t('Nueva idea de nombre')} />
        <button className="btn" disabled={!draft.trim() || Boolean(busy)} aria-label={t('Añadir y revisar')}>
          <PlusIcon width={18} height={18} />
        </button>
      </form>
      {busy === 'check' && <p className="muted small" role="status">{t('Revisando disponibilidad… puede tardar unos segundos.')}</p>}
      <ul className="name-cards">
        {sorted.map((idea) => {
          const result = results[idea.name]
          const score = scoreOf(result)
          const chosen = project.name === idea.name
          const expanded = open === idea.name
          return (
            <li key={idea.name} className={`card name-card ${chosen ? 'chosen' : ''}`}>
              <div className="name-card-head">
                <div>
                  <b>{idea.name}</b>
                  {result?.handle && <span className="muted small"> · @{result.handle}</span>}
                  {idea.why && <p className="muted small">{idea.why}</p>}
                </div>
                <span className={`score ${scoreTone(score)}`} aria-label={t('Disponibilidad')}>{score === null ? '—' : `${score}%`}</span>
              </div>
              {result && (
                <div className="dots" aria-hidden="true">
                  {result.checks.filter((c) => c.status !== 'manual').map((c) => (
                    <span key={c.key} className={`dot ${TONE[c.status]}`} title={`${c.label}: ${t(LABEL[c.status])}`} />
                  ))}
                </div>
              )}
              {result && expanded && (
                <ul className="scorecard">
                  {result.checks.map((c) => (
                    <li key={c.key}>
                      <span className={`dot ${TONE[c.status]}`} />
                      <span className="sc-label">
                        {c.label}
                        {c.similar?.length > 0 && <span className="muted small"> · {c.similar.slice(0, 2).join(', ')}</span>}
                      </span>
                      <span className={`sc-status ${TONE[c.status]}`}>{t(LABEL[c.status])}</span>
                      <a className="link-pill" href={c.buy ?? c.url} target="_blank" rel="noreferrer">
                        <LinkIcon width={14} height={14} /> {c.buy ? t('Comprar') : t('Abrir')}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div className="name-card-actions">
                {result && (
                  <button type="button" className="btn ghost small" onClick={() => setOpen(expanded ? null : idea.name)}>
                    {expanded ? t('Ocultar detalle') : t('Ver detalle')}
                  </button>
                )}
                {chosen ? (
                  <span className="chip done-chip">
                    <CheckIcon width={14} height={14} /> Elegido
                  </span>
                ) : (
                  <button type="button" className="btn primary small" onClick={() => pick(idea.name)}>
                    {t('Elegir este nombre')}
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={() => remove(idea.name)} aria-label={`Quitar ${idea.name}`}>
                  <TrashIcon width={16} height={16} />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      {!ideas.length && <p className="muted small">{t('Todavía no hay ideas. Pidan nombres a la IA o escriban los suyos.')}</p>}
    </section>
  )
}

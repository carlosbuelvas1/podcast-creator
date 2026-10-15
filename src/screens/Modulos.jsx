import { useState } from 'react'
import { useStore, useProject, useNav } from '../context'
import Sheet from '../Sheet'
import { MODULES, moduleProgress, moduleStep } from '../modules'
import { NAME_FOCUS, NAME_STEP } from '../naming'
import { aiEnabled } from '../ai'
import { CheckIcon, ChevronIcon, LinkIcon, SparkIcon } from '../icons'
import { formatMinutes } from '../guide'
import { burst } from '../celebrate'
import Brief, { NameCheck, NamePicker } from './Brief'
import Invitados from './Invitados'
import Ideas from './Ideas'
import Proximamente from './Proximamente'
import Laboratorio from './Laboratorio'
import Referentes from './Referentes'

const TOOLS = {
  concepto: { label: 'Abrir Brief de marca', view: 'brief' },
  branding: { label: 'Completar marca en el Brief', view: 'brief' },
  invitados: { label: 'Abrir lista de invitados', view: 'invitados' },
  ideas: { label: 'Abrir banco de ideas', view: 'ideas' },
  proximamente: { label: 'Abrir calendario', view: 'proximamente' },
  laboratorio: { label: 'Abrir laboratorio', view: 'laboratorio' },
  referentes: { label: 'Abrir referentes', view: 'referentes' },
}

const VIEWS = { brief: Brief, invitados: Invitados, ideas: Ideas, proximamente: Proximamente, laboratorio: Laboratorio, referentes: Referentes }

export default function Modulos({ focus }) {
  const { modules } = useProject()
  const { go } = useNav()
  const toName = focus === NAME_FOCUS
  const [moduleKey, setModuleKey] = useState(() => (toName ? 'concepto' : typeof focus === 'string' && MODULES.some((m) => m.key === focus) ? focus : null))
  const labItem = focus?.startsWith?.('lab:') ? focus.slice(4) : null
  const [view, setView] = useState(() => (labItem ? 'laboratorio' : focus && VIEWS[focus] ? focus : null))
  const [step, setStep] = useState(() => (toName ? moduleStep(NAME_STEP).step : null))
  const progress = moduleProgress(modules)

  if (view) {
    const View = VIEWS[view]
    return (
      <>
        <button className="back" onClick={() => setView(null)}>
          <ChevronIcon className="chev left" width={16} height={16} /> Módulos
        </button>
        <View itemId={view === 'laboratorio' ? labItem : null} />
      </>
    )
  }

  const current = MODULES.find((m) => m.key === moduleKey)
  if (current) {
    const p = progress.find((x) => x.module.key === current.key)
    const tool = TOOLS[current.key]
    const byCode = Object.fromEntries(modules.map((r) => [r.step_code, r]))
    return (
      <>
        <button className="back" onClick={() => setModuleKey(null)}>
          <ChevronIcon className="chev left" width={16} height={16} /> Módulos
        </button>
        <div className="page-head">
          <div>
            <p className="eyebrow-muted">Módulo {current.number}</p>
            <h1>{current.title}</h1>
          </div>
        </div>
        {current.intro && <p className="hint notice">{current.intro.replace(/^Aviso en la app:\s*/, '').replace(/^"|"$/g, '')}</p>}
        <div className="bar thin">
          <div className="bar-fill" style={{ width: `${p.pct}%` }} />
        </div>
        <p className="muted small">{p.done} de {p.total} pasos</p>
        <div className="tool-row">
          {tool && (
            <button className="btn primary" onClick={() => setView(tool.view)}>
              {tool.label}
            </button>
          )}
          {current.key === 'asistente' && aiEnabled() && (
            <button className="btn primary" onClick={() => go('ia')}>
              <SparkIcon width={18} height={18} /> Abrir asistente
            </button>
          )}
        </div>
        <ul className="steps card">
          {current.steps.map((s) => {
            const row = byCode[s.code]
            return (
              <li key={s.code} className={`step ${row?.done ? 'done' : ''}`}>
                <span className={`check static ${row?.done ? 'on' : ''}`}>
                  <CheckIcon width={14} height={14} />
                </span>
                <button className="step-main" onClick={() => setStep(s)}>
                  <span className="step-name">
                    {s.code} · {s.title}
                  </span>
                  <span className="step-meta">
                    <span className="muted small">
                      {(row?.done_items ?? []).length}/{s.checklist.length} · {formatMinutes(s.minutes)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        {step && <ModuleStepSheet module={current} step={step} onClose={() => setStep(null)} onTool={(v) => { setStep(null); setView(v) }} />}
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <h1>Módulos</h1>
      </div>
      <p className="hint">Guías paso a paso y herramientas para cada parte del podcast. Van a su ritmo, sin orden fijo.</p>
      <div className="module-grid">
        {progress.map(({ module: m, done, total, pct }) => (
          <button key={m.key} className={`card module-card ${pct === 100 ? 'complete' : ''}`} onClick={() => setModuleKey(m.key)}>
            <span className="module-num">{pct === 100 ? <CheckIcon width={16} height={16} /> : m.number}</span>
            <b>{m.title}</b>
            <span className="muted small">
              {done} de {total} pasos
            </span>
            <span className="bar thin">
              <span className="bar-fill" style={{ width: `${pct}%` }} />
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

export function ModuleStepSheet({ module, step, onClose, onTool }) {
  const { actions } = useStore()
  const { project, modules, brief } = useProject()
  const { ask } = useNav()
  const row = modules.find((r) => r.step_code === step.code)
  const doneItems = row?.done_items ?? []
  const done = Boolean(row?.done)
  const tool = TOOLS[module.key]

  const save = (fields) => actions.upsert('modules', { project_id: project.id, step_code: step.code, done_items: doneItems, done, ...fields })

  const toggle = (i) => {
    const next = doneItems.includes(i) ? doneItems.filter((x) => x !== i) : [...doneItems, i].sort((a, b) => a - b)
    save({ done_items: next, done: next.length === step.checklist.length ? true : done && next.length === step.checklist.length })
    if (next.length === step.checklist.length && !done) burst()
  }

  const complete = () => {
    save({ done: !done, done_items: done ? doneItems : step.checklist.map((_, i) => i) })
    if (!done) burst()
  }

  return (
    <Sheet title={`${module.title} · Paso ${step.code}`} onClose={onClose} full>
      <div className="guide">
        <div className="guide-top">
          <span className="chip">⏱ {formatMinutes(step.minutes)}</span>
          {done && <span className="chip done-chip">Hecho</span>}
        </div>
        <h3 className="step-title">{step.title}</h3>
        {module.key === 'legal' && <p className="alert warning">Esto es una guía, no asesoría legal. Para dudas, consulta a un abogado o contador.</p>}
        {step.why && (
          <section className="guide-block">
            <h4>Por qué importa</h4>
            <p>{step.why}</p>
          </section>
        )}
        {step.code === NAME_STEP && module.key === 'concepto' && <NamePicker />}
        {step.code === '0.2' && module.key === 'concepto' && <NameCheck />}
        <section className="guide-block">
          <h4>
            Lista para marcar <span className="muted">· {doneItems.length} de {step.checklist.length}</span>
          </h4>
          <ul className="checklist">
            {step.checklist.map((text, i) => (
              <li key={text} className={doneItems.includes(i) ? 'done' : ''}>
                <button type="button" className={`box ${doneItems.includes(i) ? 'on' : ''}`} role="checkbox" aria-checked={doneItems.includes(i)} aria-label={text} onClick={() => toggle(i)}>
                  <CheckIcon width={14} height={14} />
                </button>
                <span className="item-text" onClick={() => toggle(i)}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </section>
        {step.tips.length > 0 && (
          <section className="guide-block">
            <h4>Consejos</h4>
            <ul className="bullets good">
              {step.tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>
        )}
        {step.links.length > 0 && (
          <section className="guide-block">
            <h4>Enlaces</h4>
            <div className="links">
              {step.links.map((l) => (
                <a key={l.url} className="link-pill" href={l.url} target="_blank" rel="noreferrer">
                  <LinkIcon width={14} height={14} /> {l.label}
                </a>
              ))}
            </div>
          </section>
        )}
        <div className="tool-row">
          {tool && (
            <button className="btn ghost" onClick={() => onTool?.(tool.view)}>
              {tool.label}
            </button>
          )}
          {aiEnabled() && (
            <button className="btn ghost" onClick={() => ask(`Ayúdame con el paso "${step.title}" del módulo ${module.title}.${brief.name ? ` Nuestro podcast se llama ${brief.name}.` : ''}`)}>
              <SparkIcon width={18} height={18} /> Pedir ayuda a la IA
            </button>
          )}
        </div>
        <button className={`btn ${done ? 'ghost' : 'primary'} full sticky-cta`} onClick={complete}>
          <CheckIcon width={18} height={18} /> {done ? 'Marcar como pendiente' : 'Marcar como hecho'}
        </button>
      </div>
    </Sheet>
  )
}

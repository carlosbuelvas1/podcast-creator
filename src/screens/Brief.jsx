import { useState } from 'react'
import { useStore, useProject, useNav } from '../context'
import { aiEnabled } from '../ai'
import { CheckIcon, LinkIcon, SparkIcon } from '../icons'
import { isProvisional, useChooseName } from '../naming'
import NameLab from './NameLab'
import { nameLinks, slug } from '../trackers'

const NAME_PROMPT = 'Dame 10 opciones de nombre para nuestro podcast, cortas y fáciles de decir, con una frase de por qué funciona cada una.'

function useBrief() {
  const { actions } = useStore()
  const { project, brief } = useProject()
  const save = (data) => actions.upsert('briefs', { project_id: project.id, data: { ...brief, ...data }, updated_at: new Date().toISOString() })
  return { brief, save }
}

export function NamePicker() {
  const { project } = useProject()
  const choose = useChooseName()
  const provisional = isProvisional(project)
  const [name, setName] = useState(provisional ? '' : project.name)
  const [chosen, setChosen] = useState(false)
  const submit = (e) => {
    e.preventDefault()
    if (choose(name)) setChosen(true)
  }
  return (
    <section className="guide-block name-picker">
      <h4>Nombre del podcast</h4>
      <p className="muted small">
        Ahora: <b>{project.name}</b>
        {provisional && <span className="badge-prov">Nombre provisional</span>}
      </p>
      <NameLab />
      <form onSubmit={submit} className="name-form">
        <label className="field">
          <span>¿Ya tienen uno? Escríbanlo aquí</span>
          <input value={name} onChange={(e) => { setName(e.target.value); setChosen(false) }} placeholder="Ej. Entre Nos" />
        </label>
        <button className="btn primary full" disabled={!name.trim() || name.trim() === project.name}>
          Usar este nombre
        </button>
      </form>
      {chosen && (
        <p className="alert success" role="status">
          <CheckIcon width={16} height={16} /> ¡Listo! Ahora su podcast se llama {name.trim()} en toda la app.
        </p>
      )}
    </section>
  )
}

export function NameCheck() {
  const { brief, save } = useBrief()
  const { project } = useProject()
  const choose = useChooseName()
  const [name, setName] = useState(brief.name ?? '')
  const availability = brief.availability ?? {}
  const mark = (key, value) => save({ name: name || brief.name, availability: { ...availability, [key]: availability[key] === value ? null : value } })
  return (
    <section className="guide-block">
      <h4>¿Está libre?</h4>
      <label className="field">
        <span>Nombre a revisar</span>
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== brief.name && save({ name })} placeholder="Ej. Entre Nos Pod" />
      </label>
      {name.trim() ? (
        <ul className="name-check">
          {nameLinks(name, brief.handle).map((l) => (
            <li key={l.key}>
              <a href={l.url} target="_blank" rel="noreferrer" className="link-pill">
                <LinkIcon width={14} height={14} /> {l.label}
              </a>
              <span className="pair">
                <button className={`pill-toggle ${availability[l.key] === 'libre' ? 'ok' : ''}`} onClick={() => mark(l.key, 'libre')}>Libre</button>
                <button className={`pill-toggle ${availability[l.key] === 'ocupado' ? 'bad' : ''}`} onClick={() => mark(l.key, 'ocupado')}>Ocupado</button>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">Escribe un nombre y te damos los enlaces de búsqueda ya listos.</p>
      )}
      {name.trim() && name.trim() !== project.name && (
        <button type="button" className="btn ghost full" onClick={() => choose(name)}>
          <CheckIcon width={18} height={18} /> Elegir “{name.trim()}” como nombre
        </button>
      )}
    </section>
  )
}

const PERSONA = [
  ['age', 'Edad', 'Ej. 25 a 35 años'],
  ['location', 'Dónde vive', 'Ej. Miami, Latinoamérica'],
  ['language', 'Idioma', 'Español / spanglish'],
  ['interests', 'Intereses', 'Ej. comedia, cultura, relaciones'],
  ['pains', 'Problemas o deseos', '¿Qué le preocupa o qué quiere?'],
  ['channels', 'Dónde consume contenido', 'YouTube, Spotify, TikTok, en el carro…'],
]

const VALUE = [
  ['benefits', 'Lo que gana quien escucha', '3 cosas: reír, aprender, sentirse acompañado…'],
  ['promise', 'Promesa', 'Cada semana, una conversación honesta sobre…'],
  ['tagline', 'Eslogan', '3 a 6 palabras'],
  ['logline', 'Logline', 'Una frase con quién, qué y por qué'],
  ['differentiation', 'Qué nos hace diferentes', 'Nosotros somos los únicos que…'],
]

const BRAND = [
  ['palette', 'Paleta de colores', 'Ej. #7C3AED, #F472B6, #0F0B1A'],
  ['fonts', 'Fuentes', 'Ej. Plus Jakarta Sans y Inter'],
  ['kit', 'Enlace al kit de marca', 'https://drive.google.com/…'],
]

export default function Brief() {
  const { brief, save } = useBrief()
  const { actions } = useStore()
  const { project } = useProject()
  const { ask } = useNav()
  const [draft, setDraft] = useState(() => ({ ...brief, persona: { ...(brief.persona ?? {}) } }))
  const [saved, setSaved] = useState(false)
  const set = (k, v) => {
    setSaved(false)
    setDraft((d) => ({ ...d, [k]: v }))
  }
  const setPersona = (k, v) => {
    setSaved(false)
    setDraft((d) => ({ ...d, persona: { ...d.persona, [k]: v } }))
  }
  const submit = (e) => {
    e.preventDefault()
    save(draft)
    if (draft.name?.trim() && draft.name.trim() !== project.name) actions.updateProject(project.id, { name: draft.name.trim() })
    setSaved(true)
  }

  const field = ([k, label, ph], value, onChange, long) => (
    <label className="field" key={k}>
      <span>{label}</span>
      {long ? <textarea rows={2} value={value ?? ''} onChange={(e) => onChange(k, e.target.value)} placeholder={ph} /> : <input value={value ?? ''} onChange={(e) => onChange(k, e.target.value)} placeholder={ph} />}
    </label>
  )

  return (
    <form onSubmit={submit} className="brief-form">
      <div className="page-head">
        <h1>Brief de marca</h1>
      </div>
      <p className="hint">Todo lo que define su show en un solo lugar. La IA lo usa para darles ideas a su medida.</p>
      <section className="card">
        <h3 className="card-title">Nombre</h3>
        {field(['name', 'Nombre del podcast', 'Ej. Entre Nos'], draft.name, set)}
        {field(['handle', '@ en redes', 'Ej. entrenospod'], draft.handle, set)}
        {field(['domain', 'Dominio', 'Ej. entrenos.com'], draft.domain, set)}
        {aiEnabled() && (
          <button type="button" className="btn ghost" onClick={() => ask(NAME_PROMPT)}>
            <SparkIcon width={18} height={18} /> Pedir 10 nombres a la IA
          </button>
        )}
      </section>
      <section className="card">
        <h3 className="card-title">Nuestro oyente</h3>
        {PERSONA.map((f) => field(f, draft.persona?.[f[0]], setPersona, f[0] === 'pains' || f[0] === 'interests'))}
      </section>
      <section className="card">
        <h3 className="card-title">Propuesta de valor</h3>
        {VALUE.map((f) => field(f, draft[f[0]], set, f[0] !== 'tagline'))}
      </section>
      <section className="card">
        <h3 className="card-title">Identidad visual</h3>
        {BRAND.map((f) => field(f, draft[f[0]], set))}
      </section>
      <button className="btn primary full sticky-cta">{saved ? 'Guardado ✓' : 'Guardar brief'}</button>
    </form>
  )
}

export function BriefCard({ onOpen }) {
  const { brief } = useProject()
  const filled = ['name', 'handle', 'promise', 'tagline', 'logline', 'differentiation', 'palette'].filter((k) => brief[k]).length
  return (
    <section className="card brief-card">
      <div className="brief-top">
        <h3 className="card-title">Brief de marca</h3>
        <button className="link" onClick={onOpen}>{filled ? 'Editar' : 'Completar'}</button>
      </div>
      {filled ? (
        <>
          {brief.name && <p className="brief-name">{brief.name}{brief.handle && <span className="muted"> · @{slug(brief.handle)}</span>}</p>}
          {brief.tagline && <p className="brief-tag">“{brief.tagline}”</p>}
          {brief.promise && <p className="muted small">{brief.promise}</p>}
          {brief.palette && (
            <div className="swatches">
              {brief.palette.match(/#[0-9a-fA-F]{6}/g)?.map((c) => (
                <span key={c} className="swatch" style={{ background: c }} title={c} />
              ))}
            </div>
          )}
        </>
      ) : (
        <p className="muted empty">Definan nombre, oyente y promesa. Les toma 15 minutos y ordena todo lo demás.</p>
      )}
    </section>
  )
}

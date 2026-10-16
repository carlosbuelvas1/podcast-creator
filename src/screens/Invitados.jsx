import { useState } from 'react'
import { GUEST_STATUS, today as todayIso } from '../trackers'
import { useStore, useProject, useNav } from '../context'
import { Segmented } from '../Sheet'
import { aiEnabled } from '../ai'
import { MicIcon, PlusIcon, SparkIcon, TrashIcon } from '../icons'
import { shortDate } from '../dates'
import { EmptyState } from '../EmptyState'
import { t } from '../i18n'


export default function Invitados() {
  const { actions } = useStore()
  const { project, guests } = useProject()
  const { ask } = useNav()
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ name: '', handle: '', topic: '' })
  const [open, setOpen] = useState(null)

  const add = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    actions.add('guests', { project_id: project.id, name: form.name.trim(), handle: form.handle.trim() || null, topic: form.topic.trim() || null, status: 'idea', notes: '' })
    setForm({ name: '', handle: '', topic: '' })
  }

  const visible = guests.filter((g) => filter === 'all' || g.status === filter)
  const setStatus = (g, status) => actions.update('guests', g.id, { status, ...(status === 'contacted' && !g.contacted_on ? { contacted_on: todayIso() } : {}) })

  return (
    <>
      <div className="page-head">
        <h1>{t('Invitados')}</h1>
      </div>
      <form className="card quick-add" onSubmit={add}>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('Nombre del invitado')} aria-label={t('Nombre')} />
        <div className="two">
          <input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} placeholder={t('@ en redes')} aria-label={t('Usuario')} />
          <input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder={t('Tema')} aria-label={t('Tema')} />
        </div>
        <button className="btn primary" disabled={!form.name.trim()}>
          <PlusIcon width={18} height={18} /> Añadir
        </button>
      </form>
      <div className="scroll-x">
        <Segmented
          name="Filtrar por estado"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: `Todos · ${guests.length}` }, ...GUEST_STATUS.map((s) => ({ value: s.id, label: `${t(s.label)} · ${guests.filter((g) => g.status === s.id).length}` }))]}
        />
      </div>
      {visible.length === 0 ? (
        guests.length ? (
          <p className="muted empty">{t('Nadie en este estado.')}</p>
        ) : (
          <EmptyState icon={MicIcon} text={t('Hagan una lista de 10 personas con quienes les encantaría hablar.')} action={t('Añadir el primer invitado')} />
        )
      ) : (
        <ul className="tracker-list">
          {visible.map((g) => (
            <li key={g.id} className="card tracker-item">
              <button className="tracker-main" onClick={() => setOpen(open === g.id ? null : g.id)} aria-expanded={open === g.id}>
                <b>{g.name}</b>
                <span className="muted small">
                  {[g.handle && `@${g.handle.replace(/^@/, '')}`, g.topic, g.contacted_on && `Contactado ${shortDate(g.contacted_on)}`].filter(Boolean).join(' · ')}
                </span>
              </button>
              <select className={`status-chip s-${g.status}`} value={g.status} onChange={(e) => setStatus(g, e.target.value)} aria-label={t('Estado')}>
                {GUEST_STATUS.map((s) => (
                  <option key={s.id} value={s.id}>{t(s.label)}</option>
                ))}
              </select>
              {open === g.id && (
                <div className="tracker-extra">
                  <label className="field">
                    <span>{t('Fecha de contacto')}</span>
                    <input type="date" value={g.contacted_on ?? ''} onChange={(e) => actions.update('guests', g.id, { contacted_on: e.target.value || null })} />
                  </label>
                  <label className="field">
                    <span>{t('Notas')}</span>
                    <textarea rows={2} defaultValue={g.notes ?? ''} onBlur={(e) => e.target.value !== (g.notes ?? '') && actions.update('guests', g.id, { notes: e.target.value })} />
                  </label>
                  <div className="tool-row">
                    {aiEnabled() && (
                      <button className="btn ghost" onClick={() => ask(t('Escribe 3 borradores para invitar a {name}{handle} a nuestro podcast{topic}: uno corto, uno formal por correo y uno para mensaje directo en redes.', { name: g.name, handle: g.handle ? ` (@${g.handle.replace(/^@/, '')})` : '', topic: g.topic ? t(' para hablar de {topic}', { topic: g.topic }) : '' }))}>
                        <SparkIcon width={18} height={18} /> {t('Mensajes para invitar')}
                      </button>
                    )}
                    {aiEnabled() && (
                      <button className="btn ghost" onClick={() => ask(t('Escribe una ficha de una página para {name}: quiénes somos, de qué trata el podcast, el tema que hablaríamos, fecha, duración, lugar o enlace y cómo prepararse.', { name: g.name }))}>
                        <SparkIcon width={18} height={18} /> {t('Ficha de una página')}
                      </button>
                    )}
                    <button className="btn danger-ghost" onClick={() => window.confirm(t('¿Borrar a {name}?', { name: g.name })) && actions.remove('guests', g.id)}>
                      <TrashIcon width={16} height={16} /> {t('Borrar')}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

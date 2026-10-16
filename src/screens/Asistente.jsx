import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, useProject } from '../context'
import { askAI, aiEnabled } from '../ai'
import { recommend } from '../recommend'
import { PEOPLE } from '../constants'
import { SparkIcon } from '../icons'
import { t, tk } from '../i18n'

const QUICK = [tk('¿Qué hago ahora?'), tk('Dame 10 ideas de episodios'), tk('3 títulos para nuestro próximo episodio'), tk('Texto para la miniatura'), tk('Notas del episodio'), tk('Explícame cómo subo a Apple')]

const ACTION_LABEL = { add_idea: tk('Agregar idea'), create_task: tk('Crear tarea'), add_guest: tk('Agregar invitado'), schedule_item: tk('Agendar') }

export default function Asistente({ prompt = '' }) {
  const { actions, me, notify, demo } = useStore()
  const { project, messages, phases, tasks, items } = useProject()
  const [text, setText] = useState(prompt)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState([])
  const [chips, setChips] = useState({})
  const [failed, setFailed] = useState(false)
  const end = useRef(null)
  const enabled = aiEnabled()

  const history = useMemo(() => [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at)), [messages])
  const shown = [...history, ...pending.filter((p) => !history.some((h) => h.content === p.content && h.role === p.role))]

  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' })
  }, [shown.length])

  const fallback = recommend({ phases, tasks, items, me, partner: PEOPLE.find((p) => p !== me) }).find((r) => !r.blockedBy.length)

  const send = async (message) => {
    const content = message.trim()
    if (!content || busy) return
    setText('')
    setBusy(true)
    setPending((p) => [...p, { id: `tmp-${Date.now()}`, role: 'user', author: me, content, created_at: new Date().toISOString() }])
    try {
      const data = await askAI({ projectId: project.id, message: content, author: me })
      setFailed(false)
      setPending((p) => [...p, { id: `tmp-a-${Date.now()}`, role: 'assistant', author: 'IA', content: data.reply, created_at: new Date().toISOString() }])
      if (data.actions?.length) setChips((c) => ({ ...c, [data.reply]: data.actions }))
    } catch (e) {
      setFailed(true)
      notify(e.message)
    } finally {
      setBusy(false)
    }
  }

  const runAction = (a, key) => {
    const p = a.payload ?? {}
    if (a.type === 'add_idea') actions.add('ideas', { project_id: project.id, title: p.title, kind: p.kind ?? 'episode', tags: p.tags ?? [], notes: p.notes ?? '', scheduled: false })
    if (a.type === 'add_guest') actions.add('guests', { project_id: project.id, name: p.name, handle: p.handle ?? null, topic: p.topic ?? null, status: 'idea', notes: p.notes ?? '' })
    if (a.type === 'schedule_item') actions.add('calendar', { project_id: project.id, title: p.title, kind: p.kind ?? 'episode', publish_on: p.publish_on ?? null, status: 'planned' })
    if (a.type === 'create_task') {
      const phase = phases.find((ph) => tasks.some((t) => t.phase_id === ph.id && t.status !== 'done')) ?? phases[0]
      const position = Math.max(0, ...tasks.filter((t) => t.phase_id === phase?.id).map((t) => t.position)) + 1
      actions.addTask({ project_id: project.id, phase_id: phase?.id, title: p.title, owner: p.owner ?? me, due_date: p.due_date ?? null, position })
    }
    setChips((c) => ({ ...c, [key]: c[key].map((x) => (x === a ? { ...x, used: true } : x)) }))
    notify(t('Hecho.'))
  }

  if (!enabled || failed) {
    return (
      <>
        <div className="page-head">
          <h1>{t('Asistente')}</h1>
        </div>
        <section className="card">
          <p className="muted">{enabled ? t('La IA no respondió ahora. Mientras tanto, esto es lo que recomendamos:') : t('La IA está apagada. Puedes activarla en Mi cuenta. Mientras tanto, esto es lo que recomendamos:')}</p>
          {fallback && (
            <p>
              <b>{fallback.task.title}</b>
              <br />
              <span className="muted small">{fallback.reasons.join(' · ')}</span>
            </p>
          )}
          {enabled && <button className="btn ghost" onClick={() => setFailed(false)}>{t('Intentar de nuevo')}</button>}
        </section>
      </>
    )
  }

  return (
    <div className="chat">
      <div className="page-head">
        <h1>{t('Asistente')}</h1>
      </div>
      <p className="hint">{demo ? t('IA activada en la demo: responde con ejemplos y no guarda nada.') : t('Tu co-productor. Conoce su brief, sus pasos, ideas, invitados y calendario.')}</p>
      <div className="chat-log" aria-live="polite">
        {shown.length === 0 && <p className="muted empty">{t('Pregunta lo que quieras o toca una sugerencia.')}</p>}
        {shown.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            {m.role === 'user' && <span className="bubble-author">{m.author}</span>}
            <p>{m.content}</p>
            {m.role === 'assistant' && chips[m.content]?.length > 0 && (
              <div className="chips">
                {chips[m.content].map((a) => (
                  <button key={`${a.type}-${a.payload?.title ?? a.payload?.name}`} className="chip action" disabled={a.used} onClick={() => runAction(a, m.content)}>
                    {a.used ? '✓ ' : '+ '}
                    {t(ACTION_LABEL[a.type] ?? a.type)}: {a.payload?.title ?? a.payload?.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="bubble assistant typing">{t('Pensando…')}</div>}
        <div ref={end} />
      </div>
      <div className="chips quick-prompts">
        {QUICK.map((q) => (
          <button key={q} className="chip subtle" onClick={() => send(t(q))} disabled={busy}>{t(q)}</button>
        ))}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(text) }}>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Escribe aquí…')} aria-label={t('Mensaje')} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(text))} />
        <button className="btn primary" disabled={busy || !text.trim()}>
          <SparkIcon width={18} height={18} /> Enviar
        </button>
      </form>
    </div>
  )
}

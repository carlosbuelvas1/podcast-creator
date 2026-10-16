import { useState } from 'react'
import { KINDS, kindLabel } from '../trackers'
import { useStore, useProject, useNav } from '../context'
import { Segmented } from '../Sheet'
import { aiEnabled } from '../ai'
import { CalendarIcon, PlusIcon, SparkIcon, ThumbDownIcon, ThumbUpIcon, TrashIcon } from '../icons'
import { EmptyState } from '../EmptyState'
import { t } from '../i18n'


const vote = (v) => (v === 1 ? 'sí' : v === -1 ? 'no' : '—')

const score = (i) => (i.vote_carlos ?? 0) + (i.vote_michelle ?? 0)

export default function Ideas() {
  const { actions, me } = useStore()
  const { project, ideas } = useProject()
  const { ask } = useNav()
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState('episode')
  const [tags, setTags] = useState('')
  const [tag, setTag] = useState('')
  const voteKey = me === 'Michelle' ? 'vote_michelle' : 'vote_carlos'

  const add = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    actions.add('ideas', { project_id: project.id, title: title.trim(), kind, tags: tags.split(',').map((t) => t.trim()).filter(Boolean), notes: '', scheduled: false })
    setTitle('')
    setTags('')
  }

  const castVote = (idea, v) => actions.update('ideas', idea.id, { [voteKey]: idea[voteKey] === v ? 0 : v })

  const schedule = (idea) => {
    actions.add('calendar', { project_id: project.id, title: idea.title, kind: idea.kind, status: 'planned', idea_id: idea.id, publish_on: null })
    actions.update('ideas', idea.id, { scheduled: true })
  }

  const allTags = [...new Set(ideas.flatMap((i) => i.tags ?? []))]
  const visible = ideas.filter((i) => !tag || (i.tags ?? []).includes(tag)).sort((a, b) => a.scheduled - b.scheduled || score(b) - score(a))

  return (
    <>
      <div className="page-head">
        <h1>{t('Ideas')}</h1>
      </div>
      <form className="card quick-add" onSubmit={add}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('Nueva idea…')} aria-label={t('Idea')} />
        <Segmented name="Tipo" value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k.id, label: k.label }))} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t('Etiquetas separadas por coma')} aria-label={t('Etiquetas')} />
        <button className="btn primary" disabled={!title.trim()}>
          <PlusIcon width={18} height={18} /> Añadir
        </button>
      </form>
      {aiEnabled() && (
        <button className="btn ghost full" onClick={() => ask(t('Dame 10 ideas de episodios para nuestro podcast, con un título corto cada una.'))}>
          <SparkIcon width={18} height={18} /> Pedir 10 ideas a la IA
        </button>
      )}
      {allTags.length > 0 && (
        <div className="chips filter-chips">
          <button className={`chip ${!tag ? 'on' : 'subtle'}`} onClick={() => setTag('')}>{t('Todas')}</button>
          {allTags.map((t) => (
            <button key={t} className={`chip ${tag === t ? 'on' : 'subtle'}`} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>
          ))}
        </div>
      )}
      {visible.length === 0 ? (
        <EmptyState icon={SparkIcon} text={t('Anoten todo, sin juzgar. Después votan entre los dos.')} action={t('Anotar la primera idea')} />
      ) : (
        <ul className="tracker-list">
          {visible.map((i) => (
            <li key={i.id} className={`card tracker-item ${i.scheduled ? 'dim' : ''}`}>
              <div className="tracker-main">
                <b>{i.title}</b>
                <span className="muted small">
                  {kindLabel(i.kind)}
                  {(i.tags ?? []).map((t) => ` · #${t}`).join('')}
                  {i.scheduled && ' · En el calendario'}
                </span>
              </div>
              <div className="votes">
                <span className="vote-score" aria-label={t('Puntos')}>{score(i) > 0 ? `+${score(i)}` : score(i)}</span>
                <button className={`vote ${i[voteKey] === 1 ? 'on' : ''}`} onClick={() => castVote(i, 1)} aria-label={t('Me gusta')} aria-pressed={i[voteKey] === 1}><ThumbUpIcon width={20} height={20} /></button>
                <button className={`vote ${i[voteKey] === -1 ? 'on' : ''}`} onClick={() => castVote(i, -1)} aria-label={t('No me gusta')} aria-pressed={i[voteKey] === -1}><ThumbDownIcon width={20} height={20} /></button>
              </div>
              <div className="tracker-extra row">
                <span className="muted small">Carlos: {vote(i.vote_carlos)} · Michelle: {vote(i.vote_michelle)}</span>
                <span className="tool-row">
                  {!i.scheduled && (
                    <button className="btn small ghost" onClick={() => schedule(i)}>
                      <CalendarIcon width={16} height={16} /> Mover al calendario
                    </button>
                  )}
                  <button className="icon-btn" onClick={() => window.confirm(t('¿Borrar esta idea?')) && actions.remove('ideas', i.id)} aria-label={t('Borrar idea')}>
                    <TrashIcon width={16} height={16} />
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

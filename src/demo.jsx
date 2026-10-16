import { useCallback, useMemo, useRef, useState } from 'react'
import { DataContext } from './context'
import { onboardingKey } from './skips'
import { DEMO_MESSAGE } from './ai'
import template from './demo-template.json'
import { t, useLang } from './i18n'

const P = 'demo'
const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)
const now = new Date().toISOString()

function demoData() {
  localStorage.setItem(onboardingKey(P), '1')
  const phases = []
  const tasks = []
  const items = []
  let n = 0
  template.forEach((ph, pi) => {
    const phaseId = `ph${pi}`
    phases.push({ id: phaseId, project_id: P, position: ph.position, title: ph.title, summary: ph.summary })
    ph.steps.forEach((s, si) => {
      const i = n++
      const status = pi === 0 || (pi === 1 && si < 2) ? 'done' : pi === 1 && si === 2 ? 'doing' : 'todo'
      const id = `t${i}`
      tasks.push({ id, project_id: P, phase_id: phaseId, position: s.position, title: s.title, explanation: s.explanation, owner: i % 2 ? 'Michelle' : 'Carlos', status, due_date: day(status === 'done' ? i - 20 : 3 + i * 2), created_at: now })
      s.checklist.forEach((text, ci) => items.push({ id: `i${i}-${ci}`, project_id: P, task_id: id, position: ci, text, done: status === 'done' || (status === 'doing' && ci === 0) }))
    })
  })
  return {
    projects: [{ id: P, name: 'No Hay Break', goal: t('Lanzar 3 episodios y llegar a 1.000 suscriptores'), launch_date: day(60), created_at: now }],
    people: [
      { email: 'carlos@demo', name: 'Carlos' },
      { email: 'michelle@demo', name: 'Michelle' },
    ],
    phases,
    tasks,
    items,
    briefs: [{ project_id: P, updated_at: now, data: { name: 'No Hay Break', handle: 'nohaybreak', tagline: t('Dos amigos, cero pausas'), promise: t('Conversaciones honestas sobre emprender, cultura y vida en Miami'), palette: '#7C3AED, #C084FC, #0F0B1A', persona: { age: '22-35', location: t('Miami y Latinoamérica'), interests: t('emprender, cultura, humor') } } }],
    modules: [
      { project_id: P, step_code: '0.1', done: true, done_items: [0, 1, 2, 3] },
      { project_id: P, step_code: '0.2', done: false, done_items: [0, 1] },
    ],
    guests: [
      { id: 'g1', project_id: P, name: 'Laura Gómez', handle: '@lauraemprende', topic: t('Cómo lanzar un negocio sin dinero'), status: 'confirmed', notes: '', created_at: now },
      { id: 'g2', project_id: P, name: 'DJ Andrés', handle: '@djandres', topic: t('La escena musical de Miami'), status: 'contacted', notes: '', created_at: now },
      { id: 'g3', project_id: P, name: 'Sofía Ríos', handle: '@sofiarios', topic: t('Salud mental para creadores'), status: 'idea', notes: '', created_at: now },
    ],
    ideas: [
      { id: 'd1', project_id: P, title: t('Lo que nadie te dice de emprender a los 25'), kind: 'episode', tags: [t('emprender')], vote_carlos: 1, vote_michelle: 1, notes: '', scheduled: true, created_at: now },
      { id: 'd2', project_id: P, title: t('Reaccionamos a nuestros primeros videos'), kind: 'short', tags: [t('humor')], vote_carlos: 1, vote_michelle: 0, notes: '', scheduled: false, created_at: now },
      { id: 'd3', project_id: P, title: t('Un día grabando el podcast'), kind: 'vlog', tags: [t('detrás de cámaras')], vote_carlos: 0, vote_michelle: 1, notes: '', scheduled: false, created_at: now },
    ],
    calendar: [
      { id: 'c1', project_id: P, title: t('Lo que nadie te dice de emprender a los 25'), kind: 'episode', publish_on: day(14), status: 'planned', idea_id: 'd1', created_at: now },
      { id: 'c2', project_id: P, title: t('Tráiler del podcast'), kind: 'short', publish_on: day(7), status: 'edited', created_at: now },
    ],
    messages: [
      { id: 'm1', project_id: P, author: 'Carlos', role: 'user', content: t('¿Qué hacemos esta semana?'), created_at: now },
      { id: 'm2', project_id: P, author: 'IA', role: 'assistant', content: t('Terminen la identidad visual: elijan logo y colores. Michelle puede preparar la lista de invitados y Carlos cotizar micrófonos.'), created_at: now },
    ],
    favorites: [],
    references: [
      {
        id: 'r1',
        project_id: P,
        name: 'Nadie Sabe Nada',
        url: 'https://podcasts.apple.com/us/podcast/nadie-sabe-nada/id665143133',
        notes: '',
        created_at: now,
        stats: {
          researched_at: now,
          apple: { title: 'Nadie Sabe Nada', category: 'Comedy', episodes: 544, every_days: 7, avg_minutes: 54, url: 'https://podcasts.apple.com/us/podcast/nadie-sabe-nada/id665143133', recent: [{ title: 'Nadie Sabe Nada | 14x06 | La mudanza', date: day(-5) }, { title: 'Nadie Sabe Nada | 14x05 | La adolescencia', date: day(-12) }] },
          social: { buzz: [t('Temporada 14 con episodios semanales'), t('Destacan la improvisación y la química del dúo')] },
          sources: [{ label: 'Apple Podcasts', url: 'https://podcasts.apple.com/us/podcast/nadie-sabe-nada/id665143133' }],
        },
        analysis: {
          format: t('Dúo de humor improvisado, sin guion, con preguntas del público'),
          length: t('Unos 55 minutos'),
          hook: t('Arrancan con una anécdota absurda en los primeros segundos'),
          titles: t('Número de temporada + frase absurda'),
          thumbnails: t('Los dos hosts riendo, texto corto'),
          cadence: t('Semanal, mismo día'),
          guests: t('Casi nunca, el valor es el dúo'),
          shorts: t('Clips de los mejores momentos'),
          monetization: t('Publicidad de la radio y eventos en vivo'),
          branding: t('Cercano, ingenioso, sin pretensiones'),
          audience: t('Adultos 25-45 que buscan reírse'),
          compare: t('Nos parecemos en la química de dúo. Ellos son puro humor; nosotros sumamos emprendimiento y cultura de Miami, un hueco que ellos no cubren.'),
          steal: [t('Publicar siempre el mismo día'), t('Abrir con una anécdota en los primeros 10 segundos'), t('Cortar clips de los mejores momentos para Shorts')],
        },
      },
    ],
  }
}

export function DemoProvider({ onExit, children }) {
  const lang = useLang()
  const data = useMemo(() => demoData(lang), [lang])
  const [toast, setToast] = useState('')
  const timer = useRef()

  const guardAt = useRef(0)

  const show = useCallback((text) => {
    setToast(text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(''), 3200)
  }, [])

  const notify = useCallback((text) => {
    if (Date.now() - guardAt.current > 1000) show(text)
  }, [show])

  const actions = useMemo(
    () =>
      new Proxy(
        {},
        {
          get: (_, name) => (a, fields) => {
            guardAt.current = Date.now()
            show(t(DEMO_MESSAGE))
            return name === 'add' ? { id: 'demo-new', ...fields } : null
          },
        },
      ),
    [show],
  )

  const value = { ...data, project: data.projects[0], selectProject: () => {}, ready: true, actions, notify, me: 'Carlos', session: { user: { id: P, email: 'carlos@demo' } }, demo: true }

  return (
    <DataContext.Provider value={value}>
      <div className="demo-banner" role="note">
        <span>{t('Demo de solo lectura')}</span>
        <button type="button" onClick={onExit}>{t('Salir de la demo')}</button>
      </div>
      {children}
      <div className={`toast ${toast ? 'show' : ''}`} role="status">
        {toast}
      </div>
    </DataContext.Provider>
  )
}

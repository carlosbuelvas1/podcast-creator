import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DataProvider } from './store'
import { useStore, useProject, NavContext } from './context'
import Modulos from './screens/Modulos'
import Asistente from './screens/Asistente'
import { aiEnabled, setAiUser, setDemoMode } from './ai'
import { useCelebrations } from './celebrate'
import Login from './screens/Login'
import { DemoProvider } from './demo'
import Inicio from './screens/Inicio'
import Fases from './screens/Fases'
import Tareas from './screens/Tareas'
import Account from './screens/Account'
import { ProjectSwitcher, Welcome } from './screens/Projects'
import Onboarding from './screens/Onboarding'
import { onboardingKey } from './skips'
import { isProvisional, shortName } from './naming'
import { BoardIcon, ChevronIcon, GridIcon, HomeIcon, SparkIcon, StepsIcon } from './icons'
import { personClass } from './constants'
import { t, tk, useLang } from './i18n'

const TABS = [
  { id: 'inicio', label: tk('Inicio'), Icon: HomeIcon, Screen: Inicio },
  { id: 'fases', label: tk('Fases'), Icon: StepsIcon, Screen: Fases },
  { id: 'tareas', label: tk('Tareas'), Icon: BoardIcon, Screen: Tareas },
  { id: 'modulos', label: tk('Módulos'), Icon: GridIcon, Screen: Modulos },
  { id: 'ia', label: tk('IA'), Icon: SparkIcon, Screen: Asistente, ai: true },
]

const tabFromHash = () => {
  const id = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === id) ? id : 'inicio'
}

export default function App() {
  useLang()
  const [session, setSession] = useState(undefined)
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    const apply = (next) => {
      setAiUser(next?.user.id)
      setSession(next)
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => apply(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />
  const demoMode = (on) => {
    setDemoMode(on)
    setDemo(on)
  }
  if (!session && demo)
    return (
      <DemoProvider onExit={() => demoMode(false)}>
        <Shell />
      </DemoProvider>
    )
  if (!session) return <Login onDemo={() => demoMode(true)} />

  return (
    <DataProvider key={session.user.id} session={session}>
      <Shell />
    </DataProvider>
  )
}

function Splash() {
  return (
    <div className="splash">
      <div className="logo big" />
    </div>
  )
}

function Skeleton() {
  return (
    <div className="shell" aria-busy="true" aria-label={t('Cargando')}>
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span className="brand-name">Podcast Creator</span>
        </div>
      </header>
      <main className="page skeleton-page">
        <div className="skeleton" style={{ height: 28, width: '50%' }} />
        <div className="skeleton" style={{ height: 210, borderRadius: 24 }} />
        <div className="skeleton" style={{ height: 120 }} />
        <div className="skeleton" style={{ height: 160 }} />
      </main>
    </div>
  )
}

function Shell() {
  const { ready, me, session, project, notify } = useStore()
  const scoped = useProject()
  const [tab, setTab] = useState(tabFromHash)
  const [visit, setVisit] = useState(0)
  const [focus, setFocus] = useState(null)
  const [account, setAccount] = useState(false)
  const [switcher, setSwitcher] = useState(false)
  const [onboarded, setOnboarded] = useState(0)
  useCelebrations(project, scoped.phases, scoped.tasks, notify)
  const [ai, setAi] = useState(aiEnabled)

  useEffect(() => {
    const onToggle = () => setAi(aiEnabled())
    window.addEventListener('ai-toggle', onToggle)
    return () => window.removeEventListener('ai-toggle', onToggle)
  }, [])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (id, phaseId = null) => {
    window.history.replaceState(null, '', `#${id}`)
    setFocus(phaseId)
    setTab(id)
    setVisit((n) => n + 1)
    window.scrollTo({ top: 0 })
  }

  const ask = (prompt) => go('ia', prompt)
  const tabs = TABS.filter((t) => !t.ai || ai)

  if (!ready) return <Skeleton />

  if (!me) {
    return (
      <div className="center-page">
        <div className="card narrow">
          <div className="logo" />
          <h1>{t('Sin acceso')}</h1>
          <p className="muted">{t('La cuenta {email} no tiene acceso a Podcast Creator.', { email: session.user.email })}</p>
          <button className="btn primary full" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
      </div>
    )
  }

  const { Screen } = tabs.find((t) => t.id === tab) ?? tabs[0]

  return (
    <NavContext.Provider value={{ go, ask }}>
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span className="brand-name">Podcast Creator</span>
          {project && (
            <button className="switcher" onClick={() => setSwitcher(true)} aria-label={t('Cambiar de proyecto')}>
              <span>{shortName(project)}</span>
              {isProvisional(project) && <span className="badge-prov">{t('Nombre provisional')}</span>}
              <ChevronIcon width={16} height={16} />
            </button>
          )}
        </div>
        {project && (
          <nav className="tabs-top">
            {tabs.map(({ id, label }) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
                {t(label)}
              </button>
            ))}
          </nav>
        )}
        <button className={`avatar ${personClass(me)}`} onClick={() => setAccount(true)} aria-label={t('Mi cuenta')}>
          {me[0]}
        </button>
      </header>

      {project ? (
        <>
          <main className="page" key={`${tab}-${project.id}-${visit}`}>
            <Screen go={go} focus={focus} prompt={tab === 'ia' ? focus ?? '' : ''} />
          </main>
          <nav className="tabbar" style={{ '--tab-count': tabs.length }}>
            {tabs.map(({ id, label, Icon }) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
                <Icon />
                <span>{t(label)}</span>
              </button>
            ))}
          </nav>
        </>
      ) : (
        <main className="page">
          <Welcome />
        </main>
      )}

      {project && !localStorage.getItem(onboardingKey(project.id)) && <Onboarding key={`${project.id}-${onboarded}`} onClose={() => setOnboarded((n) => n + 1)} />}
      {account && <Account onClose={() => setAccount(false)} />}
      {switcher && <ProjectSwitcher onClose={() => setSwitcher(false)} onPick={() => go('inicio')} />}
    </div>
    </NavContext.Provider>
  )
}

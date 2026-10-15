import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DataProvider } from './store'
import { useStore, useProject } from './context'
import { useCelebrations } from './celebrate'
import Login from './screens/Login'
import Inicio from './screens/Inicio'
import Fases from './screens/Fases'
import Tareas from './screens/Tareas'
import Account from './screens/Account'
import { ProjectSwitcher, Welcome } from './screens/Projects'
import Onboarding from './screens/Onboarding'
import { onboardingKey } from './skips'
import { BoardIcon, ChevronIcon, HomeIcon, StepsIcon } from './icons'
import { personClass } from './constants'

const TABS = [
  { id: 'inicio', label: 'Inicio', Icon: HomeIcon, Screen: Inicio },
  { id: 'fases', label: 'Fases', Icon: StepsIcon, Screen: Fases },
  { id: 'tareas', label: 'Tareas', Icon: BoardIcon, Screen: Tareas },
]

const tabFromHash = () => {
  const id = window.location.hash.replace('#', '')
  return TABS.some((t) => t.id === id) ? id : 'inicio'
}

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return <Splash />
  if (!session) return <Login />

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
    <div className="shell" aria-busy="true" aria-label="Cargando">
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
  const [focus, setFocus] = useState(null)
  const [account, setAccount] = useState(false)
  const [switcher, setSwitcher] = useState(false)
  const [onboarded, setOnboarded] = useState(0)
  useCelebrations(project, scoped.phases, scoped.tasks, notify)

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (id, phaseId = null) => {
    window.history.replaceState(null, '', `#${id}`)
    setFocus(phaseId)
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  if (!ready) return <Skeleton />

  if (!me) {
    return (
      <div className="center-page">
        <div className="card narrow">
          <div className="logo" />
          <h1>Sin acceso</h1>
          <p className="muted">La cuenta {session.user.email} no tiene acceso a Podcast Creator.</p>
          <button className="btn primary full" onClick={() => supabase.auth.signOut()}>
            Salir
          </button>
        </div>
      </div>
    )
  }

  const { Screen } = TABS.find((t) => t.id === tab)

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="logo" />
          <span className="brand-name">Podcast Creator</span>
          {project && (
            <button className="switcher" onClick={() => setSwitcher(true)} aria-label="Cambiar de proyecto">
              <span>{project.name}</span>
              <ChevronIcon width={16} height={16} />
            </button>
          )}
        </div>
        {project && (
          <nav className="tabs-top">
            {TABS.map(({ id, label }) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
                {label}
              </button>
            ))}
          </nav>
        )}
        <button className={`avatar ${personClass(me)}`} onClick={() => setAccount(true)} aria-label="Mi cuenta">
          {me[0]}
        </button>
      </header>

      {project ? (
        <>
          <main className="page" key={`${tab}-${project.id}`}>
            <Screen go={go} focus={focus} />
          </main>
          <nav className="tabbar">
            {TABS.map(({ id, label, Icon }) => (
              <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
                <Icon />
                <span>{label}</span>
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
  )
}

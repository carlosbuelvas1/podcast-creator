import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { DataProvider } from './store'
import { useStore } from './context'
import Login from './screens/Login'
import Inicio from './screens/Inicio'
import Tareas from './screens/Tareas'
import Metas from './screens/Metas'
import Account from './screens/Account'
import { BoardIcon, HomeIcon, TargetIcon } from './icons'
import { personClass } from './constants'

const TABS = [
  { id: 'inicio', label: 'Inicio', Icon: HomeIcon, Screen: Inicio },
  { id: 'tareas', label: 'Tareas', Icon: BoardIcon, Screen: Tareas },
  { id: 'metas', label: 'Metas', Icon: TargetIcon, Screen: Metas },
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

function Shell() {
  const { ready, me, session } = useStore()
  const [tab, setTab] = useState(tabFromHash)
  const [account, setAccount] = useState(false)

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (id) => {
    window.history.replaceState(null, '', `#${id}`)
    setTab(id)
    window.scrollTo({ top: 0 })
  }

  if (!ready) return <Splash />

  if (!me) {
    return (
      <div className="center-page">
        <div className="card narrow">
          <div className="logo" />
          <h1>Sin acceso</h1>
          <p className="muted">La cuenta {session.user.email} no tiene acceso a Cuadrando.</p>
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
          <span>Cuadrando</span>
        </div>
        <nav className="tabs-top">
          {TABS.map(({ id, label }) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
              {label}
            </button>
          ))}
        </nav>
        <button className={`avatar ${personClass(me)}`} onClick={() => setAccount(true)} aria-label="Mi cuenta">
          {me[0]}
        </button>
      </header>

      <main className="page" key={tab}>
        <Screen go={go} />
      </main>

      <nav className="tabbar">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {account && <Account onClose={() => setAccount(false)} />}
    </div>
  )
}

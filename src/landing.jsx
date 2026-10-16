import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Landing from './screens/Landing'

const APP_TABS = ['inicio', 'fases', 'tareas', 'modulos', 'ia']

if (APP_TABS.includes(window.location.hash.slice(1))) window.location.replace(`app/${window.location.hash}`)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)

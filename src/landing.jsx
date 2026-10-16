import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { t, tk, useLang } from './i18n'
import LangToggle from './LangToggle'

const APP_TABS = ['inicio', 'fases', 'tareas', 'modulos', 'ia']

if (APP_TABS.includes(window.location.hash.slice(1))) window.location.replace(`app/${window.location.hash}`)

const FEATURES = [
  [tk('Pasos claros'), tk('Cada paso explica por qué importa, trae consejos y una lista para marcar.')],
  [tk('Siempre saben qué sigue'), tk('La app recomienda el siguiente paso y reparte el trabajo entre los dos.')],
  [tk('Un co-productor con IA'), tk('Ideas de episodios, nombres, títulos, miniaturas y análisis de podcasts que admiran.')],
]

function Landing() {
  useLang()
  return (
    <main className="landing">
      <header className="landing-top">
        <div className="brand">
          <div className="logo" />
          <span>Podcast Creator</span>
        </div>
        <LangToggle />
      </header>
      <section className="landing-hero">
        <p className="eyebrow-muted">{t('De la idea al lanzamiento')}</p>
        <h1>Podcast Creator</h1>
        <p className="landing-sub">{t('El sistema paso a paso para crear un podcast profesional. Seis fases, 31 pasos con listas para marcar, módulos prácticos y un co-productor con IA.')}</p>
        <div className="landing-cta">
          <a className="btn primary" href="app/?demo">{t('Probar la demo')}</a>
          <a className="btn ghost" href="app/">{t('Entrar')}</a>
        </div>
      </section>
      <section className="landing-features">
        {FEATURES.map(([title, text]) => (
          <article key={title} className="card">
            <h2>{t(title)}</h2>
            <p className="muted">{t(text)}</p>
          </article>
        ))}
      </section>
      <footer className="muted small center">{t('Basado en el curso "Produce tu podcast" (Chiste Interno, FIU).')}</footer>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Landing />
  </StrictMode>,
)

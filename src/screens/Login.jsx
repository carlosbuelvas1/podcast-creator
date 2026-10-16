import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login({ onDemo }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      setError(
        error.status === 400 || /invalid/i.test(error.message)
          ? 'El correo o la contraseña no son correctos.'
          : 'No pudimos entrar. Revisa tu conexión e intenta de nuevo.',
      )
    }
  }

  return (
    <div className="center-page login">
      <form className="card narrow" onSubmit={submit}>
        <div className="logo big" />
        <h1>Podcast Creator</h1>
        <p className="muted">Su sistema paso a paso para crear un podcast, de la idea al lanzamiento.</p>

        <label className="field">
          <span>Correo</span>
          <input
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </label>

        <label className="field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button className="btn primary full" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
        {onDemo && (
          <button type="button" className="btn ghost full" onClick={onDemo}>
            Ver demo
          </button>
        )}
        <p className="muted small center">¿Olvidaste tu contraseña? Avísale a Carlos y él te ayuda.</p>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from '../supabase'
import { useStore } from '../context'
import Sheet from '../Sheet'
import { aiEnabled, setAiEnabled } from '../ai'

export default function Account({ onClose }) {
  const { me, session, notify } = useStore()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [ai, setAi] = useState(aiEnabled)

  const toggleAi = (on) => {
    setAi(on)
    setAiEnabled(on)
    window.dispatchEvent(new Event('ai-toggle'))
  }

  const changePassword = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      notify('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      notify('No se pudo cambiar la contraseña. Prueba con otra.')
      return
    }
    setPassword('')
    notify('Listo, contraseña cambiada.')
  }

  return (
    <Sheet title="Mi cuenta" onClose={onClose}>
      <div className="account">
        <p className="account-name">{me}</p>
        <p className="muted">{session.user.email}</p>
      </div>
      <form onSubmit={changePassword}>
        <label className="field">
          <span>Nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
        </label>
        <button className="btn full" disabled={busy || !password}>
          Cambiar contraseña
        </button>
      </form>
      <div className="sheet-section">
        <label className="toggle">
          <input type="checkbox" checked={ai} onChange={(e) => toggleAi(e.target.checked)} />
          <span>IA activada</span>
        </label>
        <p className="muted small">Si la apagas, se ocultan los botones de IA y la app sigue recomendando pasos sola.</p>
      </div>
      <button className="btn danger-ghost full" onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </Sheet>
  )
}

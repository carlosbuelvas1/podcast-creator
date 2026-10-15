import { useState } from 'react'
import { supabase } from '../supabase'
import { useStore } from '../context'
import Sheet from '../Sheet'

export default function Account({ onClose }) {
  const { me, session, notify } = useStore()
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

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
      <button className="btn danger-ghost full" onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </Sheet>
  )
}

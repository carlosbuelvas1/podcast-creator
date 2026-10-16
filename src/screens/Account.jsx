import { useState } from 'react'
import { supabase } from '../supabase'
import { useStore } from '../context'
import Sheet from '../Sheet'
import { DEMO_MESSAGE, aiEnabled, setAiEnabled } from '../ai'
import { t } from '../i18n'
import LangToggle from '../LangToggle'

export default function Account({ onClose }) {
  const { me, session, notify, demo } = useStore()
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
    if (demo) {
      notify(t(DEMO_MESSAGE))
      return
    }
    if (password.length < 6) {
      notify(t('La contraseña debe tener al menos 6 caracteres.'))
      return
    }
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) {
      notify(t('No se pudo cambiar la contraseña. Prueba con otra.'))
      return
    }
    setPassword('')
    notify(t('Listo, contraseña cambiada.'))
  }

  return (
    <Sheet title={t('Mi cuenta')} onClose={onClose}>
      <div className="account">
        <p className="account-name">{me}</p>
        <p className="muted">{session.user.email}</p>
      </div>
      <form onSubmit={changePassword}>
        <label className="field">
          <span>{t('Nueva contraseña')}</span>
          <input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('Mínimo 6 caracteres')}
          />
        </label>
        <button className="btn full" disabled={busy || !password}>
          {t('Cambiar contraseña')}
        </button>
      </form>
      <div className="sheet-section">
        <label className="toggle">
          <input type="checkbox" checked={ai} onChange={(e) => toggleAi(e.target.checked)} />
          <span>{t('IA activada')}</span>
        </label>
        <p className="muted small">{t('Si la apagas, se ocultan los botones de IA y la app sigue recomendando pasos sola.')}</p>
      </div>
      <div className="sheet-section">
        <p className="muted small">{t('Idioma')}</p>
        <LangToggle />
      </div>
      <button className="btn danger-ghost full" onClick={() => supabase.auth.signOut()}>
        {t('Cerrar sesión')}
      </button>
    </Sheet>
  )
}

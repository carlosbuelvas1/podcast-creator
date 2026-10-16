import { useState } from 'react'
import { useStore, useProject } from '../context'
import Sheet from '../Sheet'
import { autoAssign, spreadDueDates, suggestedLaunch } from '../recommend'
import { PEOPLE } from '../constants'
import { onboardingKey } from '../skips'
import { t } from '../i18n'

export default function Onboarding({ onClose }) {
  const { actions } = useStore()
  const { project, phases, tasks } = useProject()
  const [step, setStep] = useState(0)
  const [launch, setLaunch] = useState(project.launch_date ?? suggestedLaunch())
  const [spread, setSpread] = useState(true)
  const [split, setSplit] = useState(true)

  const finish = () => {
    localStorage.setItem(onboardingKey(project.id), '1')
    onClose()
  }

  const saveDates = () => {
    if (launch !== project.launch_date) actions.updateProject(project.id, { launch_date: launch || null })
    if (spread && launch) for (const c of spreadDueDates(tasks, phases, launch)) actions.updateTask(c.id, { due_date: c.due_date })
    setStep(2)
  }

  const saveOwners = () => {
    if (split) for (const c of autoAssign(tasks, PEOPLE, phases)) actions.updateTask(c.id, { owner: c.owner })
    finish()
  }

  return (
    <Sheet title={t('Empecemos · {n} de 3', { n: step + 1 })} onClose={finish}>
      <div className="dots" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      {step === 0 && (
        <div className="onb">
          <h3>{t('Así funciona')}</h3>
          <ul className="onb-list">
            <li><b>{t('{n} fases', { n: phases.length })}</b>{t(', de la idea al lanzamiento, con {n} pasos en orden.', { n: tasks.length })}</li>
            <li>{t('Cada paso trae por qué importa, consejos y una lista para marcar.')}</li>
            <li>En <b>{t('Inicio')}</b> {t('les decimos cuál es el siguiente paso y por qué.')}</li>
            <li>{t('Algunos pasos se desbloquean cuando terminan los anteriores.')}</li>
          </ul>
          <button className="btn primary full" onClick={() => setStep(1)}>{t('Siguiente')}</button>
        </div>
      )}
      {step === 1 && (
        <div className="onb">
          <h3>{t('¿Cuándo lanzan?')}</h3>
          <p className="muted">{t('Les sugerimos 12 semanas desde hoy. Pueden cambiarla cuando quieran.')}</p>
          <label className="field">
            <span>{t('Fecha de lanzamiento')}</span>
            <input type="date" value={launch} onChange={(e) => setLaunch(e.target.value)} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={spread} onChange={(e) => setSpread(e.target.checked)} />
            <span>{t('Repartir fechas límite entre hoy y el lanzamiento')}</span>
          </label>
          <button className="btn primary full" onClick={saveDates}>{t('Siguiente')}</button>
        </div>
      )}
      {step === 2 && (
        <div className="onb">
          <h3>{t('¿Quién hace qué?')}</h3>
          <p className="muted">{t('Podemos repartir los pasos entre Carlos y Michelle de forma pareja. Luego pueden cambiar cualquiera.')}</p>
          <label className="toggle">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
            <span>{t('Repartir los pasos automáticamente')}</span>
          </label>
          <button className="btn primary full" onClick={saveOwners}>{t('Listo')}</button>
          <button className="btn ghost-plain full" onClick={finish}>{t('Omitir por ahora')}</button>
        </div>
      )}
    </Sheet>
  )
}

import { useState } from 'react'
import { useStore, useProject } from '../context'
import Sheet from '../Sheet'
import { autoAssign, spreadDueDates, suggestedLaunch } from '../recommend'
import { PEOPLE } from '../constants'

export const onboardingKey = (id) => `podcast-creator-onboarded-${id}`

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
    <Sheet title={`Empecemos · ${step + 1} de 3`} onClose={finish}>
      <div className="dots" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i <= step ? 'on' : ''} />
        ))}
      </div>
      {step === 0 && (
        <div className="onb">
          <h3>Así funciona</h3>
          <ul className="onb-list">
            <li><b>{phases.length} fases</b>, de la idea al lanzamiento, con {tasks.length} pasos en orden.</li>
            <li>Cada paso trae por qué importa, consejos y una lista para marcar.</li>
            <li>En <b>Inicio</b> les decimos cuál es el siguiente paso y por qué.</li>
            <li>Algunos pasos se desbloquean cuando terminan los anteriores.</li>
          </ul>
          <button className="btn primary full" onClick={() => setStep(1)}>Siguiente</button>
        </div>
      )}
      {step === 1 && (
        <div className="onb">
          <h3>¿Cuándo lanzan?</h3>
          <p className="muted">Les sugerimos 12 semanas desde hoy. Pueden cambiarla cuando quieran.</p>
          <label className="field">
            <span>Fecha de lanzamiento</span>
            <input type="date" value={launch} onChange={(e) => setLaunch(e.target.value)} />
          </label>
          <label className="toggle">
            <input type="checkbox" checked={spread} onChange={(e) => setSpread(e.target.checked)} />
            <span>Repartir fechas límite entre hoy y el lanzamiento</span>
          </label>
          <button className="btn primary full" onClick={saveDates}>Siguiente</button>
        </div>
      )}
      {step === 2 && (
        <div className="onb">
          <h3>¿Quién hace qué?</h3>
          <p className="muted">Podemos repartir los pasos entre Carlos y Michelle de forma pareja. Luego pueden cambiar cualquiera.</p>
          <label className="toggle">
            <input type="checkbox" checked={split} onChange={(e) => setSplit(e.target.checked)} />
            <span>Repartir los pasos automáticamente</span>
          </label>
          <button className="btn primary full" onClick={saveOwners}>Listo</button>
          <button className="btn ghost-plain full" onClick={finish}>Omitir por ahora</button>
        </div>
      )}
    </Sheet>
  )
}

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { phaseProgress } from './recommend'
import { progressOf } from './constants'

const COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#34D399', '#F472B6', '#60A5FA']
const MILESTONES = [25, 50, 75, 100]

export function burst(big = false) {
  confetti({ particleCount: big ? 160 : 80, spread: big ? 100 : 70, origin: { y: 0.7 }, colors: COLORS, disableForReducedMotion: true })
}

export function useCelebrations(project, phases, tasks, notify) {
  const prev = useRef(null)

  useEffect(() => {
    if (!project || !tasks.length) return
    const overall = progressOf(tasks).pct
    const complete = new Set(phaseProgress(phases, tasks).filter((p) => p.total && p.pct === 100).map((p) => p.phase.id))
    const last = prev.current
    prev.current = { id: project.id, overall, complete }
    if (!last || last.id !== project.id) return

    const hit = MILESTONES.filter((m) => last.overall < m && overall >= m).at(-1)
    const newPhase = phases.find((p) => complete.has(p.id) && !last.complete.has(p.id))
    if (hit) {
      burst(hit === 100)
      notify(hit === 100 ? '¡Terminaron todos los pasos! A lanzar 🎙️' : `¡Llegaron al ${hit}% del camino!`)
    } else if (newPhase) {
      burst()
      notify(`¡Fase completa: ${newPhase.title}!`)
    }
  }, [project, phases, tasks, notify])
}

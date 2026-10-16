import { useCallback, useEffect, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { phaseProgress } from './recommend'
import { progressOf } from './constants'
import { markCelebrated, phaseToCelebrate, readCelebrated } from './milestones'
import { t } from './i18n'

const COLORS = ['#7C3AED', '#A855F7', '#C084FC', '#34D399', '#F472B6', '#60A5FA']
const MILESTONES = [25, 50, 75, 100]

export function burst(big = false) {
  confetti({ particleCount: big ? 160 : 80, spread: big ? 100 : 70, origin: { y: 0.7 }, colors: COLORS, disableForReducedMotion: true })
}

export function useCelebrations(project, phases, tasks, notify) {
  const prev = useRef(null)
  const [celebration, setCelebration] = useState(null)

  useEffect(() => {
    if (!project || !tasks.length) return
    const overall = progressOf(tasks).pct
    const complete = new Set(phaseProgress(phases, tasks).filter((p) => p.total && p.pct === 100).map((p) => p.phase.id))
    const last = prev.current
    prev.current = { id: project.id, overall, complete }
    if (!last || last.id !== project.id) return

    const hit = MILESTONES.filter((m) => last.overall < m && overall >= m).at(-1)
    const found = phaseToCelebrate(last.complete, complete, phases, readCelebrated(project.id))
    if (found) {
      markCelebrated(project.id, found.phase.id)
      burst(hit === 100)
      const timer = setTimeout(() => setCelebration(found), 0)
      return () => clearTimeout(timer)
    }
    if (hit) {
      burst(hit === 100)
      notify(hit === 100 ? t('¡Terminaron todos los pasos! A lanzar 🎙️') : t('¡Llegaron al {n}% del camino!', { n: hit }))
    }
  }, [project, phases, tasks, notify])

  const dismiss = useCallback(() => setCelebration(null), [])
  return { celebration, dismiss }
}

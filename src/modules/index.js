import concepto from './concepto.js'
import legal from './legal.js'
import branding from './branding.js'
import invitados from './invitados.js'
import ideas from './ideas.js'
import proximamente from './proximamente.js'
import distribucion from './distribucion.js'
import asistente from './asistente.js'
import laboratorio from './laboratorio.js'
import referentes from './referentes.js'

const MINUTES = 20

export const MODULES = [concepto, legal, branding, invitados, ideas, proximamente, distribucion, laboratorio, referentes, asistente].map((m) => ({
  ...m,
  steps: m.steps.map((s) => ({ minutes: Math.max(MINUTES, s.checklist.length * 10), ...s, module: m.key })),
}))

export const moduleStep = (code) => {
  for (const m of MODULES) {
    const s = m.steps.find((x) => x.code === code)
    if (s) return { module: m, step: s }
  }
  return null
}

export function moduleProgress(progressRows) {
  const byCode = Object.fromEntries(progressRows.map((r) => [r.step_code, r]))
  return MODULES.map((m) => {
    const rows = m.steps.map((s) => byCode[s.code])
    const done = rows.filter((r) => r?.done).length
    return { module: m, done, total: m.steps.length, pct: Math.round((done / m.steps.length) * 100) }
  })
}

export function moduleRecommendations(progressRows, limit = 3) {
  const byCode = Object.fromEntries(progressRows.map((r) => [r.step_code, r]))
  const out = []
  for (const m of MODULES) {
    const next = m.steps.find((s) => !byCode[s.code]?.done)
    if (!next) continue
    const started = (byCode[next.code]?.done_items ?? []).length > 0
    out.push({ module: m, step: next, score: (started ? 20 : 10) - m.number, reasons: [started ? 'Ya empezado' : `Módulo ${m.title}`] })
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit)
}

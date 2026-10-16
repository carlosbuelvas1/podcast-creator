const KEY = 'pc-phases-celebrated'

export function readCelebrated(projectId, storage = globalThis.localStorage) {
  try {
    return new Set(JSON.parse(storage?.getItem(KEY) ?? '{}')[projectId] ?? [])
  } catch {
    return new Set()
  }
}

export function markCelebrated(projectId, phaseId, storage = globalThis.localStorage) {
  let all = {}
  try {
    all = JSON.parse(storage?.getItem(KEY) ?? '{}')
  } catch {
    all = {}
  }
  all[projectId] = [...new Set([...(all[projectId] ?? []), phaseId])]
  storage?.setItem(KEY, JSON.stringify(all))
}

export function phaseToCelebrate(before, after, phases, celebrated) {
  const phase = [...phases].sort((a, b) => a.position - b.position).find((p) => after.has(p.id) && !before.has(p.id) && !celebrated.has(p.id))
  if (!phase) return null
  const next = [...phases].sort((a, b) => a.position - b.position).find((p) => p.position > phase.position && !after.has(p.id)) ?? null
  return { phase, next }
}

import { guideFor, stepCode } from './guide.js'

const DAY = 86400000

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function daysBetween(value, now) {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d) - startOfDay(now)) / DAY)
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export function phaseProgress(phases, tasks) {
  return phases.map((ph) => {
    const list = tasks.filter((t) => t.phase_id === ph.id)
    const done = list.filter((t) => t.status === 'done').length
    return { phase: ph, done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 }
  })
}

export function buildIndex(phases, tasks) {
  const phaseById = Object.fromEntries(phases.map((p) => [p.id, p]))
  const byCode = {}
  const codeOf = {}
  for (const t of tasks) {
    const code = stepCode(phaseById[t.phase_id], t)
    if (code && !byCode[code]) byCode[code] = t
    codeOf[t.id] = code
  }
  return { phaseById, byCode, codeOf }
}

export function unlocks(task, phases, tasks, index = buildIndex(phases, tasks)) {
  const code = index.codeOf[task.id]
  if (!code) return []
  return tasks.filter((t) => t.status !== 'done' && guideFor(index.codeOf[t.id]).dependsOn.includes(code))
}

export function lockState(task, phases, tasks, index = buildIndex(phases, tasks), progress = phaseProgress(phases, tasks)) {
  const phase = index.phaseById[task.phase_id]
  const blockedBy = []
  for (const dep of guideFor(index.codeOf[task.id]).dependsOn) {
    const t = index.byCode[dep]
    if (t && t.status !== 'done') blockedBy.push({ type: 'step', task: t, code: dep })
  }
  if (phase) {
    for (const p of progress) {
      if (p.phase.position < phase.position && p.total && p.pct < 60) blockedBy.push({ type: 'phase', phase: p.phase, pct: p.pct })
    }
  }
  return blockedBy
}

export function lockReason(blockedBy) {
  if (!blockedBy.length) return ''
  const b = blockedBy[0]
  if (b.type === 'step') return `Se desbloquea cuando terminen “${b.task.title}”`
  return `Se desbloquea cuando “${b.phase.title}” llegue al 60%`
}

export function recommend({ phases, tasks, items = [], me = null, partner = null, now = new Date(), skipped = [] }) {
  const index = buildIndex(phases, tasks)
  const progress = phaseProgress(phases, tasks)
  const current = progress.find((p) => p.total && p.pct < 100)?.phase ?? null

  return tasks
    .filter((t) => t.status !== 'done')
    .map((task) => {
      const reasons = []
      let score = 0
      const add = (points, reason) => {
        score += points
        if (reason) reasons.push(reason)
      }
      const phase = index.phaseById[task.phase_id]
      const days = daysBetween(task.due_date, now)

      if (task.status === 'doing') add(40, 'Ya empezado')
      if (days !== null) {
        if (days < 0) add(50, `Vencido hace ${plural(-days, 'día', 'días')}`)
        else if (days === 0) add(30, 'Vence hoy')
        else if (days <= 3) add(30, `Vence en ${plural(days, 'día', 'días')}`)
        else if (days <= 7) add(15, `Vence en ${plural(days, 'día', 'días')}`)
      }
      if (phase && current) {
        if (phase.id === current.id) add(25, 'Fase actual')
        else if (phase.position > current.position) add(-15 * (phase.position - current.position))
      }
      add(-2 * (task.position ?? 0))
      if (me && task.owner === me) add(20, 'Es tuyo')
      else if (!task.owner) add(10, 'Sin responsable')
      else if (partner && task.owner === partner) add(-30)

      const list = items.filter((i) => i.task_id === task.id)
      const checked = list.filter((i) => i.done).length
      if (checked > 0 && checked < list.length) add(10, `Lista a medias (${checked}/${list.length})`)

      const opens = unlocks(task, phases, tasks, index).length
      if (opens > 0) reasons.push(`Desbloquea ${plural(opens, 'paso', 'pasos')}`)

      const blockedBy = lockState(task, phases, tasks, index, progress)
      const isSkipped = skipped.includes(task.id)
      return { task, score, reasons, blockedBy, skipped: isSkipped, code: index.codeOf[task.id] }
    })
    .sort((a, b) => {
      const rank = (x) => (x.blockedBy.length ? 2 : x.skipped ? 1 : 0)
      return rank(a) - rank(b) || b.score - a.score
    })
}

export function ownerBalance(tasks, people) {
  const open = tasks.filter((t) => t.status !== 'done')
  const counts = Object.fromEntries(people.map((p) => [p, open.filter((t) => t.owner === p).length]))
  const values = Object.values(counts)
  const gap = values.length ? Math.max(...values) - Math.min(...values) : 0
  return { counts, gap, unbalanced: gap >= 4 }
}

export function autoAssign(tasks, people, phases = []) {
  const order = Object.fromEntries(phases.map((p) => [p.id, p.position]))
  const open = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (order[a.phase_id] ?? 0) - (order[b.phase_id] ?? 0) || a.position - b.position)
  const counts = Object.fromEntries(people.map((p) => [p, open.filter((t) => t.owner === p).length]))
  const changes = []
  const target = Math.ceil(open.length / people.length)
  for (const t of open) {
    const lightest = people.reduce((a, b) => (counts[b] < counts[a] ? b : a))
    if (!t.owner || (counts[t.owner] > target && counts[lightest] < target - 0)) {
      if (t.owner) counts[t.owner] -= 1
      counts[lightest] += 1
      if (t.owner !== lightest) changes.push({ id: t.id, owner: lightest })
    }
  }
  return changes
}

export function spreadDueDates(tasks, phases, launchDate, now = new Date()) {
  const order = Object.fromEntries(phases.map((p) => [p.id, p.position]))
  const open = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => (order[a.phase_id] ?? 0) - (order[b.phase_id] ?? 0) || a.position - b.position)
  const total = daysBetween(launchDate, now)
  if (!open.length || total === null || total < 1) return []
  const start = startOfDay(now)
  return open.map((t, i) => {
    const d = new Date(start.getTime() + Math.max(1, Math.round(((i + 1) * total) / open.length)) * DAY)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { id: t.id, due_date: iso }
  })
}

export function suggestedLaunch(now = new Date()) {
  const d = new Date(startOfDay(now).getTime() + 84 * DAY)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

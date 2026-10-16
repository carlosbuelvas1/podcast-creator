import { describe, expect, it } from 'vitest'
import { autoAssign, lockReason, lockState, unlockTarget, ownerBalance, recommend, spreadDueDates, suggestedLaunch } from './recommend.js'

const now = new Date(2026, 9, 15)
const phases = [
  { id: 'p1', position: 1, title: 'Concepto e identidad' },
  { id: 'p2', position: 2, title: 'Marca e identidad visual' },
]
const task = (id, phase_id, position, extra = {}) => ({ id, phase_id, position, title: id, status: 'todo', owner: null, due_date: null, ...extra })
const base = () => [task('a', 'p1', 1), task('b', 'p1', 2), task('c', 'p1', 3), task('d', 'p1', 4), task('e', 'p2', 1), task('f', 'p2', 2)]

describe('recommend', () => {
  it('excludes done steps', () => {
    const tasks = base().map((t) => (t.id === 'a' ? { ...t, status: 'done' } : t))
    expect(recommend({ phases, tasks, now }).map((r) => r.task.id)).not.toContain('a')
  })

  it('ranks the first open step of the current phase first', () => {
    const [top] = recommend({ phases, tasks: base(), now })
    expect(top.task.id).toBe('a')
    expect(top.reasons).toContain('Fase actual')
    expect(top.reasons).toContain('Desbloquea 2 pasos')
  })

  it('blocks steps with unfinished dependencies', () => {
    const r = recommend({ phases, tasks: base(), now }).find((x) => x.task.id === 'b')
    expect(r.blockedBy[0]).toMatchObject({ type: 'step', code: '1.1' })
    expect(lockReason(r.blockedBy)).toBe('Se desbloquea cuando terminen “a”')
  })

  it('points blocked steps to the step that unlocks them', () => {
    const tasks = base()
    const r = recommend({ phases, tasks, now }).find((x) => x.task.id === 'b')
    expect(unlockTarget(r.blockedBy, tasks).id).toBe('a')
    expect(unlockTarget([], tasks)).toBeNull()
    const phaseBlock = lockState(tasks[4], phases, tasks).filter((b) => b.type === 'phase')
    expect(unlockTarget(phaseBlock, tasks).phase_id).toBe(phaseBlock[0].phase.id)
  })

  it('blocks later phases until earlier ones reach 60%', () => {
    const tasks = base()
    expect(lockState(tasks[4], phases, tasks).some((b) => b.type === 'phase')).toBe(true)
    const done = tasks.map((t) => (['a', 'b', 'c'].includes(t.id) ? { ...t, status: 'done' } : t))
    expect(lockState(done[4], phases, done).some((b) => b.type === 'phase')).toBe(false)
  })

  it('scores overdue, in progress, ownership and partial checklist', () => {
    const tasks = base().map((t) => (t.id === 'a' ? { ...t, status: 'doing', due_date: '2026-10-13', owner: 'Carlos' } : t))
    const items = [
      { task_id: 'a', done: true },
      { task_id: 'a', done: false },
    ]
    const r = recommend({ phases, tasks, items, me: 'Carlos', partner: 'Michelle', now }).find((x) => x.task.id === 'a')
    expect(r.score).toBe(40 + 50 + 25 - 2 + 20 + 10)
    expect(r.reasons).toEqual(expect.arrayContaining(['Ya empezado', 'Vencido hace 2 días', 'Es tuyo', 'Lista a medias (1/2)']))
  })

  it('applies due soon windows and partner penalty', () => {
    const tasks = base().map((t) =>
      t.id === 'a' ? { ...t, due_date: '2026-10-17', owner: 'Michelle' } : t.id === 'b' ? { ...t, due_date: '2026-10-21' } : t,
    )
    const rs = recommend({ phases, tasks, me: 'Carlos', partner: 'Michelle', now })
    const a = rs.find((x) => x.task.id === 'a')
    const b = rs.find((x) => x.task.id === 'b')
    expect(a.score).toBe(30 + 25 - 2 - 30)
    expect(a.reasons).toContain('Vence en 2 días')
    expect(b.score).toBe(15 + 25 - 4 + 10)
  })

  it('penalizes later phases and puts skipped steps after available ones', () => {
    const rs = recommend({ phases, tasks: base(), now, skipped: ['a'] })
    const e = rs.find((x) => x.task.id === 'e')
    expect(e.score).toBe(-15 - 2 + 10)
    expect(rs.findIndex((x) => x.task.id === 'a')).toBeLessThan(rs.findIndex((x) => x.task.id === 'b'))
  })
})

describe('owner balance', () => {
  it('detects a gap of 4 or more', () => {
    const tasks = base().map((t, i) => ({ ...t, owner: i < 5 ? 'Carlos' : 'Michelle' }))
    expect(ownerBalance(tasks, ['Carlos', 'Michelle'])).toMatchObject({ gap: 4, unbalanced: true })
  })

  it('auto-assigns to even out open steps', () => {
    const tasks = base().map((t, i) => ({ ...t, owner: i < 5 ? 'Carlos' : null }))
    const changes = autoAssign(tasks, ['Carlos', 'Michelle'], phases)
    const result = tasks.map((t) => ({ ...t, ...(changes.find((c) => c.id === t.id) ?? {}) }))
    expect(ownerBalance(result, ['Carlos', 'Michelle']).gap).toBeLessThanOrEqual(1)
  })
})

describe('planning', () => {
  it('suggests a launch 12 weeks out', () => {
    expect(suggestedLaunch(now)).toBe('2027-01-07')
  })

  it('spreads due dates in order up to the launch date', () => {
    const dates = spreadDueDates(base(), phases, '2026-11-14', now).map((d) => d.due_date)
    expect(dates).toHaveLength(6)
    expect([...dates].sort()).toEqual(dates)
    expect(dates.at(-1)).toBe('2026-11-14')
    expect(dates[0] > '2026-10-15').toBe(true)
  })
})

describe('modules', async () => {
  const { MODULES, moduleProgress, moduleRecommendations } = await import('./modules/index.js')

  it('loads all 10 modules with 55 steps', () => {
    expect(MODULES).toHaveLength(10)
    expect(MODULES.reduce((n, m) => n + m.steps.length, 0)).toBe(55)
    expect(MODULES.every((m) => m.steps.every((s) => s.title && s.checklist.length && s.minutes > 0))).toBe(true)
  })

  it('tracks module progress and suggests unfinished steps with low weight', () => {
    const rows = [{ step_code: '0.1', done: true, done_items: [0, 1, 2, 3] }, { step_code: '0.2', done: false, done_items: [0] }]
    expect(moduleProgress(rows)[0]).toMatchObject({ done: 1, total: 6 })
    const recs = moduleRecommendations(rows)
    expect(recs[0].step.code).toBe('0.2')
    expect(recs.every((r) => r.score < 50)).toBe(true)
    const named = moduleRecommendations([{ step_code: '0.1', done: false, done_items: [0] }], 3, { provisionalName: true })
    expect(named[0]).toMatchObject({ score: 100, step: { code: '0.1' } })
    expect(named.filter((r) => r.module.key === 'concepto')).toHaveLength(1)
    const doneName = moduleRecommendations([{ step_code: '0.1', done: true, done_items: [0, 1, 2, 3] }], 3, { provisionalName: true })
    expect(doneName.every((r) => r.score < 50)).toBe(true)
  })
})

describe('name check', async () => {
  const { handleOf, scoreOf, sortByAvailability, briefFields } = await import('./namecheck.js')
  const result = (statuses) => ({ handle: 'x', checks: statuses.map(([key, status, label = key]) => ({ key, status, label })) })

  it('scores names by availability and ignores manual checks', () => {
    expect(handleOf('Entre Nós Pod!')).toBe('entrenospod')
    expect(scoreOf(result([['a', 'libre'], ['b', 'ocupado'], ['c', 'manual']]))).toBe(50)
    expect(scoreOf(result([['a', 'probable'], ['b', 'similar']]))).toBe(75)
    expect(scoreOf(undefined)).toBe(null)
    const ideas = [{ name: 'Malo' }, { name: 'Sin revisar' }, { name: 'Bueno' }]
    const results = { Malo: result([['a', 'ocupado']]), Bueno: result([['a', 'libre']]) }
    expect(sortByAvailability(ideas, results).map((i) => i.name)).toEqual(['Bueno', 'Malo', 'Sin revisar'])
  })

  it('turns a result into brief fields with handles and a free domain', () => {
    const r = result([['domain_com', 'ocupado', 'x.com'], ['domain_fm', 'libre', 'x.fm'], ['instagram', 'probable'], ['spotify', 'ocupado'], ['uspto', 'manual']])
    expect(briefFields(r)).toEqual({ handle: 'x', domain: 'x.fm', availability: { domain: 'ocupado', instagram: 'libre', spotify: 'ocupado' } })
  })
})

import { describe, expect, it } from 'vitest'
import { markCelebrated, phaseToCelebrate, readCelebrated } from './milestones.js'

const phases = [
  { id: 'p1', position: 1, title: 'Uno' },
  { id: 'p2', position: 2, title: 'Dos' },
  { id: 'p3', position: 3, title: 'Tres' },
]

const memory = () => {
  const data = {}
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => (data[k] = v) }
}

describe('celebración de fase', () => {
  it('celebra la fase recién completada y dice cuál sigue', () => {
    const r = phaseToCelebrate(new Set(), new Set(['p1']), phases, new Set())
    expect(r.phase.id).toBe('p1')
    expect(r.next.id).toBe('p2')
  })

  it('no repite una fase ya celebrada', () => {
    expect(phaseToCelebrate(new Set(), new Set(['p1']), phases, new Set(['p1']))).toBeNull()
    expect(phaseToCelebrate(new Set(['p1']), new Set(['p1']), phases, new Set())).toBeNull()
  })

  it('la última fase no tiene siguiente', () => {
    expect(phaseToCelebrate(new Set(['p1', 'p2']), new Set(['p1', 'p2', 'p3']), phases, new Set()).next).toBeNull()
  })

  it('recuerda por proyecto lo ya celebrado', () => {
    const s = memory()
    markCelebrated('a', 'p1', s)
    expect(readCelebrated('a', s).has('p1')).toBe(true)
    expect(readCelebrated('b', s).size).toBe(0)
  })
})

import { describe, expect, it } from 'vitest'
import template from './demo-template.json'
import content from './locales/content-en.json'
import { guideFor } from './guide'

const PHASES = [1, 2, 3]

describe('contenido del curso en inglés', () => {
  const phases = template.filter((ph) => PHASES.includes(ph.position))

  it('fases 1 a 3: título, explicación y lista de cada paso', () => {
    const missing = phases.flatMap((ph) => [ph.title, ...ph.steps.flatMap((s) => [s.title, s.explanation, ...s.checklist])]).filter((x) => x && !content[x])
    expect(missing).toEqual([])
  })

  it('fases 1 a 3: guía de cada paso', () => {
    const missing = phases.flatMap((ph) => ph.steps.flatMap((s) => {
      const g = guideFor(`${ph.position}.${s.position}`)
      return [g.why, g.ownerHint, ...g.tips, ...g.mistakes]
    })).filter((x) => x && !content[x])
    expect(missing).toEqual([])
  })
})

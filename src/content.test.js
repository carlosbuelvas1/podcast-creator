import { describe, expect, it } from 'vitest'
import template from './demo-template.json'
import content from './locales/content-en.json'
import ui from './locales/en.json'
import { guideFor } from './guide'
import { MODULES } from './modules/index.js'

const PHASES = [1, 2, 3, 4, 5, 6]

describe('contenido del curso en inglés', () => {
  const phases = template.filter((ph) => PHASES.includes(ph.position))

  it('las 6 fases: título, explicación y lista de cada paso', () => {
    const missing = phases.flatMap((ph) => [ph.title, ...ph.steps.flatMap((s) => [s.title, s.explanation, ...s.checklist])]).filter((x) => x && !content[x])
    expect(missing).toEqual([])
  })

  it('las 6 fases: guía de cada paso', () => {
    const missing = phases.flatMap((ph) => ph.steps.flatMap((s) => {
      const g = guideFor(`${ph.position}.${s.position}`)
      return [g.why, g.ownerHint, ...g.tips, ...g.mistakes]
    })).filter((x) => x && !content[x])
    expect(missing).toEqual([])
  })

  it('módulos 0 a 4: título, pasos, listas, consejos y enlaces', () => {
    const texts = MODULES.filter((m) => m.number <= 4).flatMap((m) => [m.title, m.subtitle, m.intro, ...m.steps.flatMap((s) => [s.title, s.why, ...(s.checklist ?? []), ...(s.tips ?? []), ...(s.links ?? []).map((l) => l.label)])])
    expect(texts.filter((x) => x && !content[x] && !ui[x])).toEqual([])
  })
})

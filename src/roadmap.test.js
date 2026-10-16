import { describe, expect, it } from 'vitest'
import { ROADMAP, ROADMAP_STATUS } from './roadmap.js'
import en from './locales/en.json'

describe('hoja de ruta', () => {
  it('cada punto tiene un estado válido y traducción', () => {
    const ids = ROADMAP_STATUS.map((s) => s.id)
    for (const r of ROADMAP) {
      expect(ids).toContain(r.status)
      expect(en[r.title]).toBeTruthy()
    }
    for (const s of ROADMAP_STATUS) expect(en[s.label]).toBeTruthy()
  })
})

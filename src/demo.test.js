import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: { functions: { invoke: vi.fn(() => Promise.reject(new Error('red'))) } } }))

const store = new Map()
beforeEach(() => {
  store.clear()
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) }
})

describe('IA en la demo', () => {
  it('está activada y responde con ejemplos sin llamar a la red', async () => {
    const { askAI, aiEnabled, setDemoMode } = await import('./ai.js')
    const { supabase } = await import('./supabase')
    setDemoMode(true)
    expect(aiEnabled()).toBe(true)
    const chat = await askAI({ projectId: 'demo', message: 'Dame 10 ideas de episodios' })
    expect(chat.reply).toBeTruthy()
    expect(chat.actions.length).toBeGreaterThan(0)
    for (const mode of ['titles', 'thumbnails', 'seo', 'names']) expect((await askAI({ projectId: 'demo', mode, message: 'x' })).result).toBeTruthy()
    expect(supabase.functions.invoke).not.toHaveBeenCalled()
    setDemoMode(false)
  })

  it('el interruptor de IA se guarda por usuario', async () => {
    const { aiEnabled, setAiEnabled, setAiUser } = await import('./ai.js')
    setAiUser('carlos')
    setAiEnabled(false)
    expect(aiEnabled()).toBe(false)
    setAiUser('michelle')
    expect(aiEnabled()).toBe(true)
    setAiUser('carlos')
    expect(aiEnabled()).toBe(false)
  })
})

describe('módulos', () => {
  it('se numeran en orden y cada paso empieza con el número de su módulo', async () => {
    const { MODULES } = await import('./modules/index.js')
    expect(MODULES.map((m) => m.number)).toEqual(MODULES.map((_, i) => i))
    for (const m of MODULES) for (const s of m.steps) expect(s.code.split('.')[0]).toBe(String(m.number))
  })

  it('no muestran notas internas como "Tracker:"', async () => {
    const { MODULES } = await import('./modules/index.js')
    expect(MODULES.filter((m) => /tracker:/i.test(m.intro ?? ''))).toEqual([])
  })
})

describe('contraste de avisos', () => {
  const css = readFileSync('src/index.css', 'utf8')
  const token = (name) => css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))[1]
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m)
    return (x + 0.05) / (y + 0.05)
  }

  it('el texto del aviso cumple WCAG AA', () => {
    const rule = css.match(/\.toast \{[^}]*\}/)[0]
    expect(rule).toMatch(/background: var\(--ink\)/)
    expect(rule).toMatch(/color: var\(--bg\)/)
    expect(ratio(token('text'), token('bg'))).toBeGreaterThanOrEqual(4.5)
  })
})

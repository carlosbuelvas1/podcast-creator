import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.fn(() => Promise.resolve({ data: { reply: 'ok' }, error: null }))
vi.mock('./supabase', () => ({ supabase: { functions: { invoke } } }))

const store = new Map()
beforeEach(() => {
  store.clear()
  invoke.mockClear()
  globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) }
  globalThis.document = { documentElement: {} }
})

describe('idioma de la IA', () => {
  it('manda el idioma elegido a ai-chat', async () => {
    const { askAI } = await import('./ai.js')
    const { setLang } = await import('./i18n.js')
    await askAI({ projectId: 'p', message: 'hola' })
    expect(invoke.mock.calls[0][1].body.lang).toBe('es')
    setLang('en')
    await askAI({ projectId: 'p', message: 'hi' })
    expect(invoke.mock.calls[1][1].body.lang).toBe('en')
    setLang('es')
  })
})

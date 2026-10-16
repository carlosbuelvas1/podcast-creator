import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import en from './locales/en.json'

const files = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]))

const used = () => {
  const keys = new Set()
  for (const f of files('src').filter((f) => /\.jsx?$/.test(f) && !f.endsWith('.test.js'))) {
    for (const m of readFileSync(f, 'utf8').matchAll(/(?<![\w.])tk?\('((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'"))
  }
  return keys
}

describe('traducciones', () => {
  it('cada texto de la app tiene su versión en inglés', () => {
    const missing = [...used()].filter((k) => !en[k])
    expect(missing).toEqual([])
  })

  it('las variables coinciden entre español e inglés', () => {
    const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    const wrong = Object.entries(en).filter(([es, text]) => vars(es).join() !== vars(text).join())
    expect(wrong).toEqual([])
  })

  it('español es el idioma por defecto y cambia a inglés', async () => {
    const store = new Map()
    globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)) }
    globalThis.document = { documentElement: {} }
    const { t, getLang, setLang } = await import('./i18n.js')
    expect(getLang()).toBe('es')
    expect(t('Ver demo')).toBe('Ver demo')
    setLang('en')
    expect(t('Ver demo')).toBe('View demo')
    expect(t('{done} de {total} pasos', { done: 2, total: 5 })).toBe('2 of 5 steps')
    expect(store.get('podcast-creator-lang')).toBe('en')
    setLang('es')
  })
})

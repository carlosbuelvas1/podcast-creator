import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('tokens de diseño', () => {
  const css = readFileSync('src/index.css', 'utf8')
  it('no usa los alias viejos', () => {
    expect(css.match(/--(card|ink|muted|line|soft|y|y-soft|green|red|carlos|michelle)\b(?!-)/g) ?? []).toEqual([])
  })
  it('cada var() usada está definida', () => {
    const jsx = readdirSync('src', { recursive: true }).filter((f) => f.endsWith('.jsx')).map((f) => readFileSync(`src/${f}`, 'utf8')).join('\n')
    const defined = new Set([...`${css}\n${jsx}`.matchAll(/(--[\w-]+)'?:/g)].map((m) => m[1]))
    const used = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
    expect(used.filter((v) => !defined.has(v))).toEqual([])
  })
})

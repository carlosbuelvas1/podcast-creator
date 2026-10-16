import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('SEO de la portada', () => {
  const html = readFileSync('index.html', 'utf8')
  const meta = (attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]+)"`))?.[1]

  it('tiene título, descripción y tarjetas para compartir', () => {
    expect(html).toMatch(/<title>[^<]+<\/title>/)
    expect(meta('name', 'description')).toBeTruthy()
    for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) expect(meta('property', p)).toBeTruthy()
    expect(meta('name', 'twitter:card')).toBe('summary_large_image')
  })

  it('la imagen para compartir existe y mide 1200×630', () => {
    expect(meta('property', 'og:image')).toMatch(/^https:\/\/.+\/og\.png$/)
    expect(existsSync('public/og.png')).toBe(true)
    const png = readFileSync('public/og.png')
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630])
  })
})

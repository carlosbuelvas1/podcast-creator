import { supabase } from './supabase'
import { DEMO_MESSAGE, isDemo } from './ai'

export const LABEL = {
  libre: 'Libre',
  probable: 'Probablemente libre',
  similar: 'Hay nombres parecidos',
  verificar: 'Verificar manualmente',
  ocupado: 'Ocupado',
  manual: 'Revisar a mano',
}

export const TONE = { libre: 'ok', probable: 'ok', similar: 'warn', verificar: 'warn', ocupado: 'bad', manual: 'muted' }

const POINTS = { libre: 2, probable: 2, similar: 1, verificar: 1, ocupado: 0 }

export const handleOf = (name) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

export function scoreOf(result) {
  const rows = (result?.checks ?? []).filter((c) => c.status in POINTS)
  if (!rows.length) return null
  return Math.round((rows.reduce((n, c) => n + POINTS[c.status], 0) / (rows.length * 2)) * 100)
}

export const scoreTone = (score) => (score === null ? 'muted' : score >= 70 ? 'ok' : score >= 40 ? 'warn' : 'bad')

export const sortByAvailability = (ideas, results) =>
  [...ideas].sort((a, b) => (scoreOf(results[b.name]) ?? -1) - (scoreOf(results[a.name]) ?? -1))

export function briefFields(result) {
  const checks = result?.checks ?? []
  const freeDomain = checks.find((c) => c.key.startsWith('domain_') && c.status === 'libre')
  const map = { domain_com: 'domain', youtube: 'youtube', instagram: 'instagram', tiktok: 'tiktok', x: 'x', apple: 'apple', spotify: 'spotify' }
  const availability = {}
  for (const c of checks) {
    if (!map[c.key]) continue
    if (c.status === 'libre' || c.status === 'probable') availability[map[c.key]] = 'libre'
    else if (c.status === 'ocupado') availability[map[c.key]] = 'ocupado'
  }
  return { handle: result?.handle, ...(freeDomain ? { domain: freeDomain.label } : {}), availability }
}

export async function checkNames(names) {
  if (isDemo()) throw new Error(DEMO_MESSAGE)
  const { data, error } = await supabase.functions.invoke('check-name', { body: { names } })
  if (error) {
    let reason = ''
    try {
      reason = (await error.context?.json())?.error ?? ''
    } catch {
      reason = ''
    }
    throw new Error(reason || 'No pudimos revisar los nombres ahora.')
  }
  return data.results ?? {}
}

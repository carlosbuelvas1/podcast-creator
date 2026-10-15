import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36'
const TLDS = ['com', 'co', 'fm', 'show']
const HOUR_LIMIT = 40
const DAY_LIMIT = 200
const DAY = 24 * 60 * 60 * 1000

type Check = { key: string; label: string; group: string; status: string; url: string; buy?: string | null; similar?: string[] }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')

async function get(url: string, headers: Record<string, string> = {}) {
  try {
    return await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9', ...headers } })
  } catch {
    return null
  }
}

const done = async (r: Response | null) => {
  try {
    await r?.body?.cancel()
  } catch {
    return
  }
}

function compare(name: string, titles: string[]) {
  const n = norm(name)
  const t = titles.map(norm).filter(Boolean)
  if (t.includes(n)) return 'ocupado'
  if (t.some((x) => x.includes(n) || (x.length > 3 && n.includes(x)))) return 'similar'
  return 'libre'
}

async function domain(handle: string, tld: string): Promise<Check> {
  const d = `${handle}.${tld}`
  const buy = `https://www.namecheap.com/domains/registration/results/?domain=${d}`
  const r = await get(`https://rdap.org/domain/${d}`, { Accept: 'application/rdap+json' })
  await done(r)
  let status = 'verificar'
  if (r?.status === 200) status = 'ocupado'
  else if (r?.status === 404 && !new URL(r.url).hostname.endsWith('rdap.org')) status = 'libre'
  return { key: `domain_${tld}`, label: d, group: 'Dominios', status, url: buy, buy: status === 'libre' ? buy : null }
}

async function youtube(name: string, handle: string): Promise<Check> {
  const url = `https://www.youtube.com/@${handle}`
  const r = await get(url)
  await done(r)
  let status = r?.status === 404 ? 'probable' : r?.status === 200 ? 'ocupado' : 'verificar'
  let similar: string[] = []
  const key = Deno.env.get('YOUTUBE_API_KEY')
  if (key) {
    const s = await get(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=5&q=${encodeURIComponent(name)}&key=${key}`)
    const data = s?.ok ? await s.json() : null
    similar = (data?.items ?? []).map((i: { snippet: { channelTitle: string } }) => i.snippet.channelTitle)
    if (status === 'probable' && compare(name, similar) !== 'libre') status = 'similar'
  }
  return { key: 'youtube', label: `YouTube @${handle}`, group: 'Redes', status, url, similar }
}

async function tiktok(handle: string): Promise<Check> {
  const url = `https://www.tiktok.com/@${handle}`
  const r = await get(url)
  const text = r?.ok ? await r.text() : ''
  if (!r?.ok) await done(r)
  let status = 'verificar'
  if (text.includes(`"uniqueId":"${handle}"`)) status = 'ocupado'
  else if (r?.status === 404 || text.includes('"statusCode":10221')) status = 'probable'
  return { key: 'tiktok', label: `TikTok @${handle}`, group: 'Redes', status, url }
}

async function profile(key: string, label: string, url: string): Promise<Check> {
  const r = await get(url)
  await done(r)
  return { key, label, group: 'Redes', status: r?.status === 404 ? 'probable' : 'verificar', url }
}

async function apple(name: string): Promise<Check> {
  const link = `https://podcasts.apple.com/us/search?term=${encodeURIComponent(name)}`
  const r = await get(`https://itunes.apple.com/search?media=podcast&limit=15&term=${encodeURIComponent(name)}`)
  const data = r?.ok ? await r.json() : null
  if (!data) return { key: 'apple', label: 'Apple Podcasts', group: 'Podcasts', status: 'verificar', url: link }
  const titles: string[] = (data.results ?? []).map((x: { collectionName: string }) => x.collectionName)
  const status = compare(name, titles)
  return { key: 'apple', label: 'Apple Podcasts', group: 'Podcasts', status, url: link, similar: titles.filter((t) => compare(name, [t]) !== 'libre').slice(0, 3) }
}

let spotifyToken: { value: string; until: number } | null = null

async function spotifyAuth() {
  const id = Deno.env.get('SPOTIFY_CLIENT_ID')
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  if (!id || !secret) return null
  if (spotifyToken && spotifyToken.until > Date.now()) return spotifyToken.value
  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return null
    const data = await r.json()
    spotifyToken = { value: data.access_token, until: Date.now() + (data.expires_in - 60) * 1000 }
    return spotifyToken.value
  } catch {
    return null
  }
}

async function spotify(name: string): Promise<Check> {
  const link = `https://open.spotify.com/search/${encodeURIComponent(name)}/podcasts`
  const token = await spotifyAuth()
  if (!token) return { key: 'spotify', label: 'Spotify', group: 'Podcasts', status: 'verificar', url: link }
  const r = await get(`https://api.spotify.com/v1/search?type=show&market=US&limit=15&q=${encodeURIComponent(name)}`, { Authorization: `Bearer ${token}` })
  const data = r?.ok ? await r.json() : null
  if (!data) return { key: 'spotify', label: 'Spotify', group: 'Podcasts', status: 'verificar', url: link }
  const titles: string[] = (data.shows?.items ?? []).filter(Boolean).map((s: { name: string }) => s.name)
  return { key: 'spotify', label: 'Spotify', group: 'Podcasts', status: compare(name, titles), url: link, similar: titles.filter((t) => compare(name, [t]) !== 'libre').slice(0, 3) }
}

async function checkOne(name: string) {
  const handle = norm(name)
  const checks = await Promise.all([
    ...TLDS.map((t) => domain(handle, t)),
    youtube(name, handle),
    profile('instagram', `Instagram @${handle}`, `https://www.instagram.com/${handle}/`),
    tiktok(handle),
    profile('x', `X @${handle}`, `https://x.com/${handle}`),
    apple(name),
    spotify(name),
  ])
  checks.push(
    { key: 'uspto', label: 'Marca registrada (USPTO)', group: 'Legal', status: 'manual', url: 'https://tmsearch.uspto.gov/' },
    { key: 'sunbiz', label: 'Empresas en Florida (Sunbiz)', group: 'Legal', status: 'manual', url: 'https://search.sunbiz.org/Inquiry/CorporationSearch/ByName' },
  )
  return { name, handle, checks, checked_at: new Date().toISOString() }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const user = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: auth } = await user.auth.getUser()
  const email = auth?.user?.email
  if (!email) return json({ error: 'Inicia sesión de nuevo.' }, 401)
  const { data: allowed } = await user.rpc('is_allowed')
  if (!allowed) return json({ error: 'Esta cuenta no tiene acceso.' }, 403)

  let body: { names?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Faltan los nombres.' }, 400)
  }
  const names = [...new Map(
    (Array.isArray(body.names) ? body.names : [])
      .filter((n): n is string => typeof n === 'string')
      .map((n) => n.trim().slice(0, 60))
      .filter((n) => norm(n).length > 0)
      .map((n) => [norm(n), n] as const),
  ).values()].slice(0, 10)
  if (!names.length) return json({ error: 'Escribe al menos un nombre.' }, 400)

  const since = new Date(Date.now() - DAY).toISOString()
  const { data: cached } = await admin.from('name_checks').select('key, result').in('key', names.map(norm)).gte('checked_at', since)
  const hit = new Map((cached ?? []).map((c) => [c.key, c.result]))
  const fresh = names.filter((n) => !hit.has(norm(n)))

  if (fresh.length) {
    const hour = new Date(Date.now() - DAY / 24).toISOString()
    const [{ count: perHour }, { count: perDay }] = await Promise.all([
      admin.from('name_check_usage').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', hour),
      admin.from('name_check_usage').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', since),
    ])
    if ((perHour ?? 0) + fresh.length > HOUR_LIMIT || (perDay ?? 0) + fresh.length > DAY_LIMIT) {
      return json({ error: 'Revisaron muchos nombres seguidos. Intenten de nuevo en un rato.' }, 429)
    }
  }

  const results: Record<string, unknown> = {}
  for (const n of names) if (hit.has(norm(n))) results[n] = { ...hit.get(norm(n)), name: n, cached: true }
  for (let i = 0; i < fresh.length; i += 3) {
    const batch = await Promise.all(fresh.slice(i, i + 3).map(checkOne))
    for (const r of batch) results[r.name] = r
  }
  if (fresh.length) {
    await admin.from('name_checks').upsert(fresh.map((n) => ({ key: norm(n), result: results[n], checked_at: new Date().toISOString() })))
    await admin.from('name_check_usage').insert(fresh.map(() => ({ email })))
  }
  return json({ results })
})

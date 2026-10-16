import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = 'grok-4.20-0309-non-reasoning'
const WEEK = 7 * 24 * 3600e3
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Candidate = { id: string; title: string; image?: string; detail?: string; count?: number }
type Pick = { youtube?: string | null; apple?: string | null; spotify?: string | null }

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
const norm = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const similar = (q: string, t: string) => {
  const a = norm(q)
  const b = norm(t)
  return Boolean(b) && (a === b || b.includes(a) || a.includes(b))
}
const avg = (xs: number[]) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : null)
const round = (n: number | null, d = 1) => (n === null ? null : Math.round(n * 10 ** d) / 10 ** d)

async function getJson(url: string, headers: Record<string, string> = {}) {
  try {
    const r = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
    return r.ok ? await r.json() : null
  } catch {
    return null
  }
}

function everyDays(dates: string[]) {
  const t = dates.map((d) => new Date(d).getTime()).filter((x) => !isNaN(x)).sort((a, b) => b - a)
  if (t.length < 2) return null
  return round((t[0] - t[t.length - 1]) / (t.length - 1) / 86400e3)
}

function seconds(iso = '') {
  const m = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (+(m[1] ?? 0)) * 86400 + (+(m[2] ?? 0)) * 3600 + (+(m[3] ?? 0)) * 60 + +(m[4] ?? 0)
}

let spotifyCache: { value: string; until: number } | null = null
async function spotifyToken() {
  const id = Deno.env.get('SPOTIFY_CLIENT_ID')
  const secret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  if (!id || !secret) return null
  if (spotifyCache && spotifyCache.until > Date.now()) return spotifyCache.value
  try {
    const r = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return null
    const data = await r.json()
    spotifyCache = { value: data.access_token, until: Date.now() + (data.expires_in - 60) * 1000 }
    return spotifyCache.value
  } catch {
    return null
  }
}

async function candidates(name: string) {
  const q = encodeURIComponent(name)
  const yt = Deno.env.get('YOUTUBE_API_KEY')
  const sp = await spotifyToken()
  const [y, a, s] = await Promise.all([
    yt ? getJson(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=6&q=${q}&key=${yt}`) : null,
    getJson(`https://itunes.apple.com/search?media=podcast&limit=10&term=${q}`),
    sp ? getJson(`https://api.spotify.com/v1/search?type=show&market=US&limit=10&q=${q}`, { Authorization: `Bearer ${sp}` }) : null,
  ])
  const ytAll: Candidate[] = (y?.items ?? []).map((i: { snippet: { channelId: string; channelTitle: string; description?: string; thumbnails?: { default?: { url: string } } } }) => ({
    id: i.snippet.channelId,
    title: i.snippet.channelTitle,
    image: i.snippet.thumbnails?.default?.url,
    detail: i.snippet.description?.slice(0, 90),
  }))
  const ytExact = ytAll.filter((c) => norm(c.title) === norm(name))
  const ytList = ytExact.length === 1 ? ytExact : [...ytAll.filter((c) => similar(name, c.title)), ...ytAll.filter((c) => !similar(name, c.title))].slice(0, 4)
  const apple: Candidate[] = (a?.results ?? [])
    .filter((r: { collectionName: string }) => similar(name, r.collectionName))
    .map((r: { collectionId: number; collectionName: string; artistName: string; trackCount: number; artworkUrl100?: string }) => ({
      id: String(r.collectionId),
      title: r.collectionName,
      image: r.artworkUrl100,
      detail: `${r.artistName} · ${r.trackCount} episodios`,
      count: r.trackCount,
    }))
    .sort((x: Candidate, z: Candidate) => (z.count ?? 0) - (x.count ?? 0))
  const spotify: Candidate[] = (s?.shows?.items ?? [])
    .filter((x: { name: string } | null) => x && similar(name, x.name))
    .map((x: { id: string; name: string; publisher: string; total_episodes: number; images?: { url: string }[] }) => ({
      id: x.id,
      title: x.name,
      image: x.images?.[x.images.length - 1]?.url,
      detail: `${x.publisher} · ${x.total_episodes} episodios`,
      count: x.total_episodes,
    }))
    .sort((x: Candidate, z: Candidate) => (z.count ?? 0) - (x.count ?? 0))
  return { youtube: ytList, apple, spotify }
}

async function youtubeFromUrl(url?: string | null) {
  const key = Deno.env.get('YOUTUBE_API_KEY')
  const handle = url?.match(/youtube\.com\/@([\w.-]+)/)?.[1]
  const channel = url?.match(/youtube\.com\/channel\/([\w-]+)/)?.[1]
  if (channel) return channel
  if (!key || !handle) return null
  const data = await getJson(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${key}`)
  return data?.items?.[0]?.id ?? null
}

async function youtube(id: string) {
  const key = Deno.env.get('YOUTUBE_API_KEY')
  if (!key) return null
  const ch = (await getJson(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${id}&key=${key}`))?.items?.[0]
  if (!ch) return null
  const uploads = ch.contentDetails?.relatedPlaylists?.uploads
  const list = uploads ? await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=20&playlistId=${uploads}&key=${key}`) : null
  const ids = (list?.items ?? []).map((i: { contentDetails: { videoId: string } }) => i.contentDetails.videoId)
  const vids = ids.length ? await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${ids.join(',')}&key=${key}`) : null
  const recent = (vids?.items ?? []).map((v: { id: string; snippet: { title: string; publishedAt: string; thumbnails?: { medium?: { url: string } } }; statistics: { viewCount?: string }; contentDetails: { duration: string } }) => ({
    title: v.snippet.title,
    views: Number(v.statistics.viewCount ?? 0),
    seconds: seconds(v.contentDetails.duration),
    date: v.snippet.publishedAt.slice(0, 10),
    thumb: v.snippet.thumbnails?.medium?.url,
    url: `https://www.youtube.com/watch?v=${v.id}`,
  }))
  const shorts = recent.filter((v: { seconds: number }) => v.seconds <= 180)
  const long = recent.filter((v: { seconds: number }) => v.seconds > 180)
  return {
    id,
    title: ch.snippet.title,
    url: ch.snippet.customUrl ? `https://www.youtube.com/${ch.snippet.customUrl}` : `https://www.youtube.com/channel/${id}`,
    image: ch.snippet.thumbnails?.default?.url,
    subscribers: Number(ch.statistics.subscriberCount ?? 0),
    views: Number(ch.statistics.viewCount ?? 0),
    videos: Number(ch.statistics.videoCount ?? 0),
    every_days: everyDays(recent.map((v: { date: string }) => v.date)),
    avg_minutes: round((avg(long.map((v: { seconds: number }) => v.seconds)) ?? 0) / 60) || null,
    shorts: shorts.length,
    long: long.length,
    recent,
  }
}

async function apple(id: string) {
  const data = await getJson(`https://itunes.apple.com/lookup?id=${id}&entity=podcastEpisode&limit=20`)
  const show = data?.results?.find((r: { wrapperType: string }) => r.wrapperType === 'track')
  if (!show) return null
  const eps = data.results.filter((r: { kind?: string }) => r.kind === 'podcast-episode')
  return {
    id,
    title: show.collectionName,
    artist: show.artistName,
    url: show.collectionViewUrl,
    image: show.artworkUrl600 ?? show.artworkUrl100,
    category: show.primaryGenreName,
    episodes: show.trackCount,
    every_days: everyDays(eps.map((e: { releaseDate: string }) => e.releaseDate)),
    avg_minutes: round((avg(eps.map((e: { trackTimeMillis?: number }) => e.trackTimeMillis ?? 0).filter(Boolean)) ?? 0) / 60000) || null,
    recent: eps.slice(0, 10).map((e: { trackName: string; releaseDate: string }) => ({ title: e.trackName, date: e.releaseDate?.slice(0, 10) })),
  }
}

async function spotify(id: string) {
  const token = await spotifyToken()
  if (!token) return null
  const s = await getJson(`https://api.spotify.com/v1/shows/${id}?market=US`, { Authorization: `Bearer ${token}` })
  if (!s) return null
  const eps = (s.episodes?.items ?? []).filter(Boolean)
  return {
    id,
    title: s.name,
    publisher: s.publisher,
    url: s.external_urls?.spotify,
    image: s.images?.[0]?.url,
    episodes: s.total_episodes,
    description: s.description?.slice(0, 300),
    every_days: everyDays(eps.map((e: { release_date: string }) => e.release_date)),
    avg_minutes: round((avg(eps.map((e: { duration_ms: number }) => e.duration_ms)) ?? 0) / 60000) || null,
    recent: eps.slice(0, 10).map((e: { name: string; release_date: string }) => ({ title: e.name, date: e.release_date })),
  }
}

function parseJson(text = '') {
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim())
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    try {
      return m ? JSON.parse(m[0]) : null
    } catch {
      return null
    }
  }
}

async function social(name: string, xai: string) {
  try {
    const r = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${xai}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        input: [{ role: 'user', content: `Busca las cuentas oficiales (Instagram, TikTok, X) del podcast o creador "${name}" y qué se comenta de él recientemente. Responde SOLO JSON: {"instagram":"url o null","tiktok":"url o null","x":"url o null","buzz":["hasta 3 frases cortas en español"]}. Si no estás seguro de una cuenta, pon null.` }],
        tools: [{ type: 'web_search' }, { type: 'x_search' }],
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!r.ok) return null
    const out = await r.json()
    const msg = (out.output ?? []).filter((o: { type: string }) => o.type === 'message').pop()
    const part = msg?.content?.find((c: { type: string }) => c.type === 'output_text')
    const data = parseJson(part?.text)
    if (!data) return null
    const seen = new Set<string>()
    const sources = (part.annotations ?? [])
      .filter((a: { type: string; url?: string }) => a.type === 'url_citation' && a.url && !seen.has(a.url) && seen.add(a.url))
      .slice(0, 6)
      .map((a: { url: string }) => ({ label: new URL(a.url).hostname.replace('www.', ''), url: a.url }))
    const ok = (u: unknown, host: string) => (typeof u === 'string' && u.includes(host) ? u : null)
    return {
      instagram: ok(data.instagram, 'instagram.com'),
      tiktok: ok(data.tiktok, 'tiktok.com'),
      x: ok(data.x, 'x.com') ?? ok(data.x, 'twitter.com'),
      buzz: (Array.isArray(data.buzz) ? data.buzz : []).filter((b: unknown) => typeof b === 'string').slice(0, 3),
      sources,
    }
  } catch {
    return null
  }
}

const ANALYSIS = `Analiza este podcast de referencia usando SOLO los datos públicos que te damos. Responde SOLO JSON válido:
{"format":"...","length":"...","hook":"...","titles":"patrones de títulos","thumbnails":"patrones de miniaturas","cadence":"...","guests":"...","shorts":"estrategia de Shorts","monetization":"cómo ganan dinero y patrocinadores","branding":"...","audience":"...","compare":"2 a 4 frases comparándolo con nuestro brief de marca: en qué nos parecemos, en qué nos diferenciamos y qué hueco podemos ocupar","steal":["3 a 5 ideas concretas para adaptar, no copiar"]}
Respuestas cortas y prácticas, en español, sin tecnicismos. Si falta información para un punto, escribe "No hay datos suficientes".`

async function analyze(xai: string, ref: { name: string; notes?: string }, projectName: string, brief: unknown, data: Record<string, unknown>) {
  const slim = JSON.stringify(data, (k, v) => (k === 'thumb' || k === 'image' ? undefined : v))
  try {
    const r = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${xai}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: `Eres el co-productor del podcast de Carlos y Michelle. ${ANALYSIS}` },
          { role: 'user', content: `Nuestro podcast: ${projectName}\nNuestro brief de marca: ${JSON.stringify(brief ?? {})}\n\nReferente: ${ref.name}\nNotas nuestras: ${ref.notes || 'ninguna'}\nDatos públicos: ${slim}` },
        ],
      }),
      signal: AbortSignal.timeout(60000),
    })
    if (!r.ok) return null
    const out = await r.json()
    return parseJson(out.choices?.[0]?.message?.content)
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const user = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: who } = await user.auth.getUser()
  const email = who.user?.email?.toLowerCase()
  if (!email) return json({ error: 'Inicia sesión de nuevo.' }, 401)
  const { data: allowed } = await user.rpc('is_allowed')
  if (!allowed) return json({ error: 'Esta cuenta no tiene acceso.' }, 403)

  const body = await req.json().catch(() => ({}))
  const { reference_id, refresh = false, ai = true } = body as { reference_id?: string; refresh?: boolean; ai?: boolean }
  let pick = (body as { pick?: Pick }).pick ?? null
  if (!reference_id) return json({ error: 'Falta el referente.' }, 400)

  const { data: ref, error } = await user.from('references_shows').select('*').eq('id', reference_id).single()
  if (error || !ref) return json({ error: 'No encontramos este referente.' }, 404)

  const last = ref.stats?.researched_at ? new Date(ref.stats.researched_at).getTime() : 0
  if (!refresh && !pick && last && Date.now() - last < WEEK) return json({ reference: ref, cached: true })

  if (!pick && refresh && ref.stats?.picked) pick = ref.stats.picked
  if (!pick) {
    const found = await candidates(ref.name)
    const fromUrl = await youtubeFromUrl(ref.url)
    if (fromUrl) found.youtube = [{ id: fromUrl, title: ref.name }]
    if (found.youtube.length > 1 || found.apple.length > 1 || found.spotify.length > 1) return json({ candidates: found })
    pick = { youtube: found.youtube[0]?.id ?? null, apple: found.apple[0]?.id ?? null, spotify: found.spotify[0]?.id ?? null }
  }

  const xai = ai ? Deno.env.get('XAI_API_KEY') : null
  if (xai) {
    const now = Date.now()
    const [{ count: hour }, { count: day }] = await Promise.all([
      admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', new Date(now - 3600e3).toISOString()),
      admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', new Date(now - 86400e3).toISOString()),
    ])
    if ((hour ?? 0) + 2 > 20) return json({ error: 'Llegaste al límite de 20 preguntas por hora. Intenta en un rato.' }, 429)
    if ((day ?? 0) + 2 > 100) return json({ error: 'Llegaste al límite de 100 preguntas por día. Vuelve mañana.' }, 429)
    await admin.from('ai_usage').insert([{ email }, { email }])
  }

  const [yt, ap, sp, so, project, brief] = await Promise.all([
    pick.youtube ? youtube(pick.youtube) : null,
    pick.apple ? apple(pick.apple) : null,
    pick.spotify ? spotify(pick.spotify) : null,
    xai ? social(ref.name, xai) : null,
    user.from('projects').select('name').eq('id', ref.project_id).single(),
    user.from('brand_brief').select('data').eq('project_id', ref.project_id).maybeSingle(),
  ])

  const sources = [
    yt && { label: 'YouTube', url: yt.url },
    ap && { label: 'Apple Podcasts', url: ap.url },
    sp && { label: 'Spotify', url: sp.url },
    ...(so?.sources ?? []),
  ].filter(Boolean)

  const analysis = xai ? await analyze(xai, ref, project.data?.name ?? '', brief.data?.data, { youtube: yt, apple: ap, spotify: sp, social: so }) : null
  const stats = {
    researched_at: new Date().toISOString(),
    picked: pick,
    youtube: yt,
    apple: ap,
    spotify: sp,
    social: so,
    sources,
    subscribers: yt?.subscribers ?? null,
    keys: { youtube: Boolean(Deno.env.get('YOUTUBE_API_KEY')), spotify: Boolean(Deno.env.get('SPOTIFY_CLIENT_ID')) },
  }
  const patch = analysis ? { stats, analysis } : { stats }
  const { data: saved } = await user.from('references_shows').update(patch).eq('id', reference_id).select('*').single()
  return json({ reference: saved ?? { ...ref, ...patch } })
})

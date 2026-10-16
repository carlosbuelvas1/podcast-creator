import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = 'grok-4.20-0309-non-reasoning'
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SYSTEM = `Eres el co-productor de un podcast en español de Carlos y Michelle, creado con la app Podcast Creator (basada en el curso "Produce tu podcast" de Chiste Interno, FIU).
Hablas como un amigo productor: cálido, directo, práctico y sin tecnicismos. Respuestas cortas, con listas cuando ayuden.
Sabes recomendar el siguiente paso, escribir ideas de episodios, títulos, descripciones, texto para miniaturas, notas del episodio y mensajes para invitar invitados.
Explicas temas legales (LLC en Florida, EIN, marcas, permisos, música, impuestos) y siempre agregas: "Esto no es asesoría legal; para dudas consulta a un abogado o contador."
Explicas distribución: YouTube, Spotify for Creators, Apple Podcasts, RSS, shorts y requisitos de monetización.
Las fases del curso: 1 Concepto e identidad, 2 Marca e identidad visual, 3 Equipo de trabajo y presupuesto, 4 Grabación, 5 Edición y entregables, 6 Lanzamiento, crecimiento y monetización.
Nunca inventes datos de otros podcasts: usa solo lo que te pegan y los datos públicos que recibas.`

const CHAT_FORMAT = `Responde SIEMPRE con JSON válido: {"reply": "texto para el usuario", "actions": [ ... ]}.
"actions" es opcional (máximo 4) y solo cuando el usuario se beneficie de un botón. Las acciones aparecen como botones que el usuario toca para confirmar: nunca digas que ya agregaste o creaste algo; di que puede tocar el botón para guardarlo. Tipos permitidos:
{"type":"add_idea","payload":{"title":"...","kind":"episode|short|vlog","tags":["..."]}}
{"type":"create_task","payload":{"title":"...","owner":"Carlos|Michelle","due_date":"AAAA-MM-DD"}}
{"type":"add_guest","payload":{"name":"...","handle":"...","topic":"..."}}
{"type":"schedule_item","payload":{"title":"...","kind":"episode|short|vlog","publish_on":"AAAA-MM-DD"}}`

const MODE_FORMAT: Record<string, string> = {
  thumbnails: 'Crea 3 conceptos de miniatura. JSON: {"concepts":[{"text":"3 a 4 palabras","expression":"...","composition":"...","colors":["#RRGGBB"]}]}. Usa los colores del brief si existen.',
  titles: 'Crea 10 títulos. JSON: {"titles":[{"title":"...","hook":"pregunta|número|secreto|opinión fuerte|historia|cómo","curiosity":1-10,"clarity":1-10}]}. Menos de 60 caracteres, sin engañar.',
  seo: 'Crea SEO. JSON: {"keywords":["..."],"description":"las 2 primeras líneas son clave","tags":["..."],"chapters":["00:00 ..."],"hashtags":{"YouTube":["#..." x3],"Instagram":["#..." x5-10],"TikTok":["#..." x3-5]}}.',
  script: 'Crea la estructura y un guion base del episodio. JSON: {"hook":"primeros 10 segundos","segments":[{"title":"...","minutes":5,"points":["..."]}],"closing":"cierre con llamado a la acción","script":"guion base corto en texto, con las voces de los hosts"}. 4 a 6 bloques, natural y sin tecnicismos.',
  names: 'Crea 10 nombres para el podcast usando el brief y el proyecto. JSON: {"names":[{"name":"1 a 3 palabras","why":"una frase corta"}]}. Cortos, fáciles de decir y deletrear en voz alta, sin copiar podcasts famosos.',
  reference: 'Analiza este podcast de referencia SOLO con la información dada. JSON: {"format":"...","length":"...","hook":"...","titles":"...","thumbnails":"...","cadence":"...","guests":"...","shorts":"...","monetization":"...","branding":"...","audience":"...","steal":["3 a 5 ideas concretas para adaptar"]}. Si falta información di "No hay datos suficientes".',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

async function youtubeStats(url: string | null) {
  const key = Deno.env.get('YOUTUBE_API_KEY')
  if (!key || !url) return null
  const handle = url.match(/youtube\.com\/@([\w.-]+)/)?.[1]
  if (!handle) return null
  const ch = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails,snippet&forHandle=${handle}&key=${key}`).then((r) => r.json())
  const c = ch.items?.[0]
  if (!c) return null
  const uploads = c.contentDetails?.relatedPlaylists?.uploads
  const list = uploads ? await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=10&playlistId=${uploads}&key=${key}`).then((r) => r.json()) : null
  return {
    subscribers: c.statistics?.subscriberCount,
    videos: c.statistics?.videoCount,
    views: c.statistics?.viewCount,
    recent: (list?.items ?? []).map((i: { snippet: { title: string; publishedAt: string } }) => `${i.snippet.publishedAt.slice(0, 10)} ${i.snippet.title}`),
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  const auth = req.headers.get('Authorization') ?? ''
  const url = Deno.env.get('SUPABASE_URL')!
  const user = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } })
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: who } = await user.auth.getUser()
  const email = who.user?.email?.toLowerCase()
  if (!email) return json({ error: 'Inicia sesión de nuevo.' }, 401)
  const { data: allowed } = await user.rpc('is_allowed')
  if (!allowed) return json({ error: 'Esta cuenta no tiene acceso.' }, 403)

  const xai = Deno.env.get('XAI_API_KEY')
  if (!xai) return json({ error: 'La IA todavía no está configurada.' }, 503)

  const { project_id, message, mode = 'chat', context = {}, author, lang } = await req.json().catch(() => ({}))
  if (!project_id || !message || typeof message !== 'string') return json({ error: 'Falta el mensaje.' }, 400)

  const now = Date.now()
  const [{ count: hour }, { count: day }] = await Promise.all([
    admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', new Date(now - 3600e3).toISOString()),
    admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('email', email).gte('created_at', new Date(now - 86400e3).toISOString()),
  ])
  if ((hour ?? 0) >= 20) return json({ error: 'Llegaste al límite de 20 preguntas por hora. Intenta en un rato.' }, 429)
  if ((day ?? 0) >= 100) return json({ error: 'Llegaste al límite de 100 preguntas por día. Vuelve mañana.' }, 429)

  const [project, brief, phases, tasks, guests, ideas, calendar, history] = await Promise.all([
    user.from('projects').select('name, goal, launch_date').eq('id', project_id).single(),
    user.from('brand_brief').select('data').eq('project_id', project_id).maybeSingle(),
    user.from('phases').select('id, position, title').eq('project_id', project_id).order('position'),
    user.from('tasks').select('title, status, owner, due_date, phase_id, position').eq('project_id', project_id).order('position'),
    user.from('guests').select('name, handle, topic, status').eq('project_id', project_id).limit(30),
    user.from('ideas').select('title, kind, tags, vote_carlos, vote_michelle, scheduled').eq('project_id', project_id).limit(40),
    user.from('calendar_items').select('title, kind, publish_on, status').eq('project_id', project_id).order('publish_on').limit(30),
    mode === 'chat' ? user.from('ai_messages').select('role, content').eq('project_id', project_id).order('created_at', { ascending: false }).limit(12) : Promise.resolve({ data: [] }),
  ])
  if (project.error) return json({ error: 'No encontramos el proyecto.' }, 404)

  const phaseTitle = Object.fromEntries((phases.data ?? []).map((p) => [p.id, `${p.position}. ${p.title}`]))
  const summary = (phases.data ?? []).map((p) => {
    const list = (tasks.data ?? []).filter((t) => t.phase_id === p.id)
    const pending = list.filter((t) => t.status !== 'done').slice(0, 4).map((t) => `${t.title}${t.owner ? ` (${t.owner})` : ''}${t.due_date ? ` vence ${t.due_date}` : ''}${t.status === 'doing' ? ' [en progreso]' : ''}`)
    return `${phaseTitle[p.id]}: ${list.filter((t) => t.status === 'done').length}/${list.length} hechos. Pendientes: ${pending.join('; ') || 'ninguno'}`
  })

  let extra = ''
  let stats = null
  if (mode === 'reference' && context?.reference_id) {
    const { data: ref } = await user.from('references_shows').select('name, url, notes').eq('id', context.reference_id).single()
    stats = await youtubeStats(ref?.url ?? null).catch(() => null)
    extra = `Referente: ${ref?.name}\nEnlace: ${ref?.url ?? 'sin enlace'}\nLo que pegó el usuario:\n${ref?.notes || 'nada'}\n${stats ? `Datos públicos de YouTube: ${JSON.stringify(stats)}` : 'Sin datos públicos.'}`
  }
  if (context?.calendar_item_id) {
    const { data: item } = await user.from('calendar_items').select('title, kind, publish_on').eq('id', context.calendar_item_id).maybeSingle()
    if (item) extra = `Contenido: ${item.title} (${item.kind}${item.publish_on ? `, sale ${item.publish_on}` : ''})`
  }

  const dynamic = `Fecha de hoy: ${new Date().toISOString().slice(0, 10)}. Quien escribe: ${author ?? email}.
Proyecto: ${project.data.name}${project.data.goal ? ` — meta: ${project.data.goal}` : ''}${project.data.launch_date ? ` — lanzamiento: ${project.data.launch_date}` : ''}
Brief de marca: ${JSON.stringify(brief.data?.data ?? {})}
Progreso:\n${summary.join('\n')}
Invitados: ${JSON.stringify(guests.data ?? [])}
Ideas: ${JSON.stringify(ideas.data ?? [])}
Calendario: ${JSON.stringify(calendar.data ?? [])}`

  const messages = [
    { role: 'system', content: SYSTEM },
    { role: 'system', content: mode === 'chat' ? CHAT_FORMAT : `Responde SOLO con JSON válido. ${MODE_FORMAT[mode] ?? MODE_FORMAT.titles}` },
    { role: 'system', content: dynamic },
    ...(lang === 'en' ? [{ role: 'system', content: 'The user has the app in English. Write every text for the user in English (keep JSON keys and allowed values exactly as specified).' }] : []),
    ...((history.data ?? []) as { role: string; content: string }[]).reverse(),
    { role: 'user', content: extra ? `${extra}\n\n${message}` : message },
  ]

  await admin.from('ai_usage').insert({ email })

  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${xai}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature: 0.7, response_format: { type: 'json_object' } }),
  })
  if (!res.ok) return json({ error: 'La IA no respondió. Intenta de nuevo en un momento.' }, 502)
  const out = await res.json()
  const raw = out.choices?.[0]?.message?.content ?? '{}'
  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = mode === 'chat' ? { reply: raw } : {}
  }

  if (mode !== 'chat') return json({ reply: '', actions: [], result: parsed, stats })

  const reply = typeof parsed.reply === 'string' ? parsed.reply : 'Listo.'
  const allowedTypes = ['add_idea', 'create_task', 'add_guest', 'schedule_item']
  const actions = (Array.isArray(parsed.actions) ? parsed.actions : []).filter((a) => a && allowedTypes.includes(a.type) && a.payload).slice(0, 4)
  await user.from('ai_messages').insert([
    { project_id, author: author ?? email, role: 'user', content: message },
    { project_id, author: 'IA', role: 'assistant', content: reply },
  ])
  return json({ reply, actions })
})

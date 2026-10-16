import { t, tk } from './i18n'

const IDEAS = [
  { type: 'add_idea', payload: { title: tk('Lo que aprendimos en nuestro primer año'), kind: 'episode' } },
  { type: 'add_idea', payload: { title: tk('Mitos de emprender en Miami'), kind: 'short' } },
]

const REPLIES = [
  [/borradores|drafts/i, tk('Corto: «¡Hola Laura! Nos encantaría tenerte en No Hay Break para hablar de cómo lanzar un negocio sin dinero. ¿Te animas?»\n\nFormal: «Hola Laura, somos Carlos y Michelle, de No Hay Break. Nos gustaría invitarte a un episodio de 60 minutos sobre emprender sin dinero. ¿Qué fechas te funcionan?»\n\nDM: «¡Laura! Te seguimos hace tiempo 🙌 ¿Grabamos un episodio juntos sobre emprender sin dinero?»'), []],
  [/ficha|one-pager|one-page/i, tk('Ficha para Laura Gómez — No Hay Break: dos amigos, cero pausas, conversaciones honestas sobre emprender en Miami. Tema: cómo lanzar un negocio sin dinero. Grabación de 60 minutos en nuestro estudio o por enlace. Para prepararte: trae una historia de tu primer año y un consejo concreto.'), []],
  [/idea|episodio|episode/i, tk('Aquí van dos ideas que encajan con su brief: "Lo que aprendimos en nuestro primer año" como episodio y "Mitos de emprender en Miami" como short.'), IDEAS],
  [/título|title/i, tk('Prueben: "Lo que nadie te dice de emprender a los 25", "Renunciamos y esto pasó" y "3 errores que casi nos cuestan el podcast".'), []],
  [/miniatura|thumbnail/i, tk('Texto corto y grande: "CERO PAUSAS". Los dos riéndose a la izquierda, fondo morado y el logo abajo a la derecha.'), []],
  [/notas|notes/i, tk('En este episodio hablamos de emprender sin dinero, los errores del primer año y cómo encontrar a tu socio ideal. Síguenos para más.'), []],
  [/apple/i, tk('Creen su cuenta en Apple Podcasts Connect, peguen el enlace RSS de su plataforma de hosting y envíen el show a revisión. Tarda de 1 a 5 días.'), []],
]

const CHAT_DEFAULT = tk('Esta semana terminen la identidad visual: elijan logo y colores. Michelle puede preparar la lista de invitados y Carlos cotizar micrófonos.')

const local = (v) => (typeof v === 'string' ? t(v) : Array.isArray(v) ? v.map(local) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, local(x)])) : v)

export function demoAnswer(mode, message) {
  return local(answer(mode, message))
}

function answer(mode, message) {
  if (mode === 'names') {
    return {
      result: {
        names: [
          { name: tk('Cero Pausas'), why: tk('Suena a su energía y es fácil de decir') },
          { name: tk('Sin Filtro Miami'), why: tk('Dice dónde están y cómo hablan') },
          { name: tk('Socios de Sofá'), why: tk('Cercano y con humor') },
        ],
      },
    }
  }
  if (mode === 'titles') {
    return {
      result: {
        titles: [
          { title: tk('Lo que nadie te dice de emprender a los 25'), hook: 'secreto', curiosity: 8, clarity: 9 },
          { title: tk('Renunciamos y esto pasó'), hook: 'historia', curiosity: 9, clarity: 7 },
          { title: tk('3 errores que casi nos cuestan el podcast'), hook: 'número', curiosity: 8, clarity: 8 },
        ],
      },
    }
  }
  if (mode === 'thumbnails') {
    return {
      result: {
        concepts: [
          { text: 'CERO PAUSAS', expression: tk('Los dos riéndose'), composition: tk('Caras a la izquierda, texto grande a la derecha'), colors: ['#7C3AED', '#C084FC', '#0F0B1A'] },
          { text: '¿VALE LA PENA?', expression: tk('Sorpresa'), composition: tk('Primer plano de Carlos señalando el texto'), colors: ['#FBBF24', '#0F0B1A'] },
        ],
      },
    }
  }
  if (mode === 'runsheet') {
    return {
      result: {
        schedule: [
          { time: '15:00', task: tk('Montar micrófonos, cámaras y luces') },
          { time: '15:30', task: tk('Prueba de sonido de 5 minutos') },
          { time: '16:00', task: tk('Grabar el episodio') },
          { time: '17:15', task: tk('Grabar 3 clips cortos para redes') },
          { time: '17:45', task: tk('Respaldar los archivos') },
        ],
        gear: [tk('Micrófonos y audífonos'), tk('Tarjetas de memoria vacías'), tk('Baterías cargadas')],
        questions: [tk('¿Cuál fue tu primer error al emprender?'), tk('¿Qué harías distinto hoy?')],
        reminders: [tk('Firmar el permiso del invitado'), tk('Grabar 1 minuto de silencio del cuarto')],
      },
    }
  }
  if (mode === 'script') {
    return {
      result: {
        hook: tk('Carlos cuenta la vez que casi renuncia a todo por un correo mal enviado.'),
        segments: [
          { title: tk('Intro y presentación'), minutes: 3, points: [tk('Quiénes somos'), tk('De qué va el episodio')] },
          { title: tk('El primer error'), minutes: 12, points: [tk('Qué pasó'), tk('Qué aprendimos')] },
          { title: tk('Lo que haríamos distinto'), minutes: 15, points: [tk('3 consejos concretos'), tk('Pregunta de la audiencia')] },
          { title: tk('Cierre'), minutes: 4, points: [tk('Resumen en una frase'), tk('Invitar a la comunidad')] },
        ],
        closing: tk('Si te sirvió, compártelo con alguien que esté empezando y únete a nuestra comunidad.'),
        script: tk('CARLOS: Bienvenidos a No Hay Break.\nMICHELLE: Hoy hablamos de lo que nadie te dice de emprender a los 25.'),
      },
    }
  }
  if (mode === 'seo') {
    return {
      result: {
        description: tk('Emprender a los 25 no es como lo pintan. Carlos y Michelle cuentan lo que nadie les dijo.'),
        keywords: ['emprender', tk('podcast en español'), 'Miami'],
        tags: ['emprendimiento', 'negocios', 'podcast'],
        chapters: ['00:00 Intro', tk('03:10 El primer error'), tk('18:40 Lo que haríamos distinto')],
        hashtags: { YouTube: ['#podcast', '#emprender', '#miami'], Instagram: ['#podcastenespañol', '#emprendedores', '#miami'], TikTok: ['#podcast', '#emprender', '#fyp'] },
      },
    }
  }
  const hit = REPLIES.find(([re]) => re.test(message ?? ''))
  return { reply: hit ? hit[1] : CHAT_DEFAULT, actions: hit ? hit[2] : [] }
}

const IDEAS = [
  { type: 'add_idea', payload: { title: 'Lo que aprendimos en nuestro primer año', kind: 'episode' } },
  { type: 'add_idea', payload: { title: 'Mitos de emprender en Miami', kind: 'short' } },
]

const REPLIES = [
  [/idea|episodio/i, 'Aquí van dos ideas que encajan con su brief: "Lo que aprendimos en nuestro primer año" como episodio y "Mitos de emprender en Miami" como short.', IDEAS],
  [/título/i, 'Prueben: "Lo que nadie te dice de emprender a los 25", "Renunciamos y esto pasó" y "3 errores que casi nos cuestan el podcast".', []],
  [/miniatura/i, 'Texto corto y grande: "CERO PAUSAS". Los dos riéndose a la izquierda, fondo morado y el logo abajo a la derecha.', []],
  [/notas/i, 'En este episodio hablamos de emprender sin dinero, los errores del primer año y cómo encontrar a tu socio ideal. Síguenos para más.', []],
  [/apple/i, 'Creen su cuenta en Apple Podcasts Connect, peguen el enlace RSS de su plataforma de hosting y envíen el show a revisión. Tarda de 1 a 5 días.', []],
]

const CHAT_DEFAULT = 'Esta semana terminen la identidad visual: elijan logo y colores. Michelle puede preparar la lista de invitados y Carlos cotizar micrófonos.'

export function demoAnswer(mode, message) {
  if (mode === 'names') {
    return {
      result: {
        names: [
          { name: 'Cero Pausas', why: 'Suena a su energía y es fácil de decir' },
          { name: 'Sin Filtro Miami', why: 'Dice dónde están y cómo hablan' },
          { name: 'Socios de Sofá', why: 'Cercano y con humor' },
        ],
      },
    }
  }
  if (mode === 'titles') {
    return {
      result: {
        titles: [
          { title: 'Lo que nadie te dice de emprender a los 25', hook: 'secreto', curiosity: 8, clarity: 9 },
          { title: 'Renunciamos y esto pasó', hook: 'historia', curiosity: 9, clarity: 7 },
          { title: '3 errores que casi nos cuestan el podcast', hook: 'número', curiosity: 8, clarity: 8 },
        ],
      },
    }
  }
  if (mode === 'thumbnails') {
    return {
      result: {
        concepts: [
          { text: 'CERO PAUSAS', expression: 'Los dos riéndose', composition: 'Caras a la izquierda, texto grande a la derecha', colors: ['#7C3AED', '#C084FC', '#0F0B1A'] },
          { text: '¿VALE LA PENA?', expression: 'Sorpresa', composition: 'Primer plano de Carlos señalando el texto', colors: ['#FBBF24', '#0F0B1A'] },
        ],
      },
    }
  }
  if (mode === 'seo') {
    return {
      result: {
        description: 'Emprender a los 25 no es como lo pintan. Carlos y Michelle cuentan lo que nadie les dijo.',
        keywords: ['emprender', 'podcast en español', 'Miami'],
        tags: ['emprendimiento', 'negocios', 'podcast'],
        chapters: ['00:00 Intro', '03:10 El primer error', '18:40 Lo que haríamos distinto'],
        hashtags: { YouTube: ['#podcast', '#emprender', '#miami'], Instagram: ['#podcastenespañol', '#emprendedores', '#miami'], TikTok: ['#podcast', '#emprender', '#fyp'] },
      },
    }
  }
  const hit = REPLIES.find(([re]) => re.test(message ?? ''))
  return { reply: hit ? hit[1] : CHAT_DEFAULT, actions: hit ? hit[2] : [] }
}

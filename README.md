# Podcast Creator

Sistema paso a paso para crear un podcast profesional, de la idea al lanzamiento. Basado en el curso "Produce tu podcast" (Chiste Interno, FIU).

- **Inicio**: el siguiente paso recomendado, alertas, progreso total y por fase, y el brief de marca.
- **Fases**: los pasos de cada fase con su explicación y lista para marcar.
- **Tareas**: tablero Por hacer / En progreso / Hecho (lista con "Mover a…" en el celular).
- **Módulos**: guías de Concepto, Legal, Branding, Invitados, Ideas, Próximamente, Distribución, Laboratorio, Referentes y Asistente, con sus herramientas.
- **IA**: co-productor con Grok (opcional).

Cada proyecto nuevo copia la plantilla de fases y pasos.

## Desarrollo

```bash
npm install
npm run dev
npm test
```

## Supabase

- `supabase/schema.sql`: tablas, permisos (solo los correos de `allowed_emails`), sincronización en vivo y la función `create_project`.
- `supabase/template.sql`: la plantilla de fases y pasos.

## Publicación

Cada cambio en `main` se publica en GitHub Pages con `.github/workflows/deploy.yml`.

## Asistente IA (opcional)

El asistente usa Grok (xAI) desde una función de Supabase. La clave nunca va en la app.

```bash
supabase secrets set XAI_API_KEY=... --project-ref <ref>
supabase secrets set YOUTUBE_API_KEY=... --project-ref <ref>   # opcional, datos públicos de canales
supabase functions deploy ai-chat --project-ref <ref>
```

Límites: 20 preguntas por persona por hora y 100 por día (tabla `ai_usage`). Si la IA está apagada o no responde, la app sigue recomendando pasos sola.

Las tablas de módulos y herramientas están en `supabase/migrations/002_modules.sql`.

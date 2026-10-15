# Podcast Creator

Sistema paso a paso para crear un podcast profesional, de la idea al lanzamiento. Basado en el curso "Produce tu podcast" (Chiste Interno, FIU).

- **Inicio**: progreso total y por fase, y las próximas tareas de cada persona.
- **Fases**: los pasos de cada fase con su explicación y lista para marcar.
- **Tareas**: tablero Por hacer / En progreso / Hecho.

Cada proyecto nuevo copia la plantilla de fases y pasos.

## Desarrollo

```bash
npm install
npm run dev
```

## Supabase

- `supabase/schema.sql`: tablas, permisos (solo los correos de `allowed_emails`), sincronización en vivo y la función `create_project`.
- `supabase/template.sql`: la plantilla de fases y pasos.

## Publicación

Cada cambio en `main` se publica en GitHub Pages con `.github/workflows/deploy.yml`.

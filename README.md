# Cuadrando · Plan del podcast

App para que Carlos y Michelle planeen y lancen el podcast juntos: Inicio, Tareas y Metas.

## Desarrollo

```bash
npm install
VITE_SUPABASE_URL=... VITE_SUPABASE_KEY=... npm run dev
```

## Supabase

- `supabase/schema.sql`: tablas, permisos (solo los correos de `allowed_emails`) y sincronización en vivo.
- `supabase/seed.sql`: metas y tareas de ejemplo.

## Publicación

Cada cambio en `main` se publica en GitHub Pages con `.github/workflows/deploy.yml`.

create table if not exists public.brand_brief (project_id uuid primary key references public.projects(id) on delete cascade, data jsonb not null default '{}', updated_at timestamptz not null default now());
create table if not exists public.module_progress (project_id uuid references public.projects(id) on delete cascade, step_code text, done_items int[] not null default '{}', done boolean not null default false, primary key (project_id, step_code));
create table if not exists public.guests (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, name text not null, handle text, topic text, status text not null default 'idea' check (status in ('idea','contacted','confirmed','recorded','published')), contacted_on date, notes text default '', created_at timestamptz not null default now());
create table if not exists public.ideas (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, title text not null, kind text not null default 'episode' check (kind in ('episode','short','vlog')), tags text[] not null default '{}', vote_carlos smallint check (vote_carlos in (-1,0,1)), vote_michelle smallint check (vote_michelle in (-1,0,1)), notes text default '', scheduled boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.calendar_items (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, title text not null, kind text not null check (kind in ('episode','short','vlog')), publish_on date, status text not null default 'planned' check (status in ('planned','recorded','edited','scheduled','published')), idea_id uuid references public.ideas(id) on delete set null, guest_id uuid references public.guests(id) on delete set null, created_at timestamptz not null default now());
create table if not exists public.ai_messages (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, author text not null, role text not null check (role in ('user','assistant')), content text not null, created_at timestamptz not null default now());
create table if not exists public.favorites (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, calendar_item_id uuid references public.calendar_items(id) on delete cascade, kind text not null check (kind in ('thumbnail','title','seo')), content jsonb not null, created_at timestamptz not null default now());
create table if not exists public.references_shows (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, name text not null, url text, notes text default '', analysis jsonb, stats jsonb, created_at timestamptz not null default now());
create table if not exists public.ai_usage (id bigserial primary key, email text not null, created_at timestamptz not null default now());
do $$ declare t text; begin
  foreach t in array array['brand_brief','module_progress','guests','ideas','calendar_items','ai_messages','favorites','references_shows'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists "solo nosotros" on public.%I', t);
    execute format('create policy "solo nosotros" on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())', t);
  end loop;
  foreach t in array array['brand_brief','module_progress','guests','ideas','calendar_items','ai_messages','favorites','references_shows'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
grant select on public.ai_usage to authenticated;
drop policy if exists "solo nosotros" on public.ai_usage;
create policy "leer uso" on public.ai_usage for select to authenticated using (public.is_allowed());

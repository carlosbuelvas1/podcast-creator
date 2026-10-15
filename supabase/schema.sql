create extension if not exists pgcrypto;

create table if not exists public.allowed_emails (
  email text primary key,
  name text not null
);

create or replace function public.is_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.allowed_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
$$;

revoke execute on function public.is_allowed() from public, anon;
grant execute on function public.is_allowed() to authenticated;

create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  goal text not null default 'Lanzar el podcast Cuadrando',
  launch_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner text not null check (owner in ('Carlos', 'Michelle')),
  due_date date,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_items (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.allowed_emails enable row level security;
alter table public.settings enable row level security;
alter table public.tasks enable row level security;
alter table public.goals enable row level security;
alter table public.goal_items enable row level security;

drop policy if exists "solo nosotros" on public.allowed_emails;
create policy "solo nosotros" on public.allowed_emails
  for select to authenticated using (public.is_allowed());

drop policy if exists "solo nosotros" on public.settings;
create policy "solo nosotros" on public.settings
  for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists "solo nosotros" on public.tasks;
create policy "solo nosotros" on public.tasks
  for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists "solo nosotros" on public.goals;
create policy "solo nosotros" on public.goals
  for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

drop policy if exists "solo nosotros" on public.goal_items;
create policy "solo nosotros" on public.goal_items
  for all to authenticated using (public.is_allowed()) with check (public.is_allowed());

revoke all on public.allowed_emails, public.settings, public.tasks, public.goals, public.goal_items from anon;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tasks') then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'goals') then
    alter publication supabase_realtime add table public.goals;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'goal_items') then
    alter publication supabase_realtime add table public.goal_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end $$;

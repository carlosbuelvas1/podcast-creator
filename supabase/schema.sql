create extension if not exists pgcrypto;

drop table if exists public.goal_items, public.goals, public.tasks, public.settings cascade;

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

create table if not exists public.template_phases (
  id uuid primary key default gen_random_uuid(),
  position int not null,
  title text not null,
  summary text not null default ''
);

create table if not exists public.template_steps (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid not null references public.template_phases (id) on delete cascade,
  position int not null,
  title text not null,
  explanation text not null default '',
  checklist text[] not null default '{}'
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text,
  launch_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  position int not null,
  title text not null,
  summary text not null default ''
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  phase_id uuid not null references public.phases (id) on delete cascade,
  position int not null default 0,
  title text not null,
  explanation text not null default '',
  owner text check (owner in ('Carlos', 'Michelle')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  position int not null default 0,
  text text not null,
  done boolean not null default false
);

create index if not exists phases_project_idx on public.phases (project_id);
create index if not exists tasks_project_idx on public.tasks (project_id);
create index if not exists tasks_phase_idx on public.tasks (phase_id);
create index if not exists checklist_task_idx on public.checklist_items (task_id);
create index if not exists checklist_project_idx on public.checklist_items (project_id);
create index if not exists template_steps_phase_idx on public.template_steps (phase_id);

do $$
declare t text;
begin
  foreach t in array array['allowed_emails', 'template_phases', 'template_steps', 'projects', 'phases', 'tasks', 'checklist_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('drop policy if exists "solo nosotros" on public.%I', t);
    if t = 'allowed_emails' then
      execute format('create policy "solo nosotros" on public.%I for select to authenticated using (public.is_allowed())', t);
    else
      execute format('create policy "solo nosotros" on public.%I for all to authenticated using (public.is_allowed()) with check (public.is_allowed())', t);
    end if;
  end loop;

  foreach t in array array['template_phases', 'template_steps', 'projects', 'phases', 'tasks', 'checklist_items'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

create or replace function public.create_project(p_name text, p_goal text default null, p_launch date default null)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_project uuid;
  v_phase uuid;
  v_task uuid;
  ph record;
  st record;
begin
  if not public.is_allowed() then
    raise exception 'not allowed';
  end if;

  insert into projects (name, goal, launch_date) values (p_name, p_goal, p_launch) returning id into v_project;

  for ph in select * from template_phases order by position loop
    insert into phases (project_id, position, title, summary)
    values (v_project, ph.position, ph.title, ph.summary)
    returning id into v_phase;

    for st in select * from template_steps where phase_id = ph.id order by position loop
      insert into tasks (project_id, phase_id, position, title, explanation)
      values (v_project, v_phase, st.position, st.title, st.explanation)
      returning id into v_task;

      insert into checklist_items (project_id, task_id, position, text)
      select v_project, v_task, u.i, u.t
      from unnest(st.checklist) with ordinality as u(t, i);
    end loop;
  end loop;

  return v_project;
end $$;

revoke execute on function public.create_project(text, text, date) from public, anon;
grant execute on function public.create_project(text, text, date) to authenticated;

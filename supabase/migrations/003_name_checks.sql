create table if not exists public.name_checks (
  key text primary key,
  result jsonb not null,
  checked_at timestamptz not null default now()
);

create table if not exists public.name_check_usage (
  id bigint generated always as identity primary key,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists name_check_usage_email_created on public.name_check_usage (email, created_at);

alter table public.name_checks enable row level security;
alter table public.name_check_usage enable row level security;
revoke all on public.name_checks, public.name_check_usage from anon, authenticated;

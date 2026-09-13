create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique,
  response_email text not null,
  submitted_text text,
  submitted_urls jsonb not null default '[]'::jsonb,
  context text,
  status text not null default 'received',
  verdict text,
  verdict_explanation text,
  reviewed_at timestamptz,
  email_sent_at timestamptz,
  email_last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint submissions_status_check check (status in ('received', 'reviewed')),
  constraint submissions_verdict_check check (
    verdict is null or verdict in ('legitimate', 'suspicious', 'likely_phishing')
  )
);

create table if not exists public.submission_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_name text not null,
  content_type text not null,
  size_bytes integer not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists submissions_status_created_at_idx
  on public.submissions (status, created_at desc);

create index if not exists submission_assets_submission_id_idx
  on public.submission_assets (submission_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists submissions_set_updated_at on public.submissions;
create trigger submissions_set_updated_at
before update on public.submissions
for each row
execute function public.set_updated_at();

alter table public.submissions enable row level security;
alter table public.submission_assets enable row level security;

insert into storage.buckets (id, name, public, file_size_limit)
values ('submission-assets', 'submission-assets', false, 10485760)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;

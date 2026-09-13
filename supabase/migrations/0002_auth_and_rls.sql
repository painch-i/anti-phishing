-- Keep legacy rows complete and readable; new intakes explicitly start as drafts.
alter table public.submissions
  add column submitted_by uuid default auth.uid() references auth.users(id) on delete set null,
  add column intake_completed_at timestamptz default now();

create index submissions_submitted_by_idx on public.submissions (submitted_by);

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from public, anon, authenticated;
grant select on public.admin_users to authenticated;

create policy "Read own operator membership" on public.admin_users
  for select to authenticated using (user_id = (select auth.uid()));

create function public.is_admin()
returns boolean language sql stable security invoker set search_path = ''
as $$
  select coalesce((auth.jwt()->>'is_anonymous')::boolean, false) = false
    and exists (select 1 from public.admin_users where user_id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke all on public.submissions, public.submission_assets from public, anon, authenticated;
grant select, delete on public.submissions to authenticated;
grant insert (public_reference, response_email, submitted_text, submitted_urls, context, intake_completed_at)
  on public.submissions to authenticated;
grant update (status, verdict, verdict_explanation, reviewed_at, email_sent_at, email_last_error)
  on public.submissions to authenticated;
grant select on public.submission_assets to authenticated;
grant insert (id, submission_id, file_name, content_type, size_bytes, storage_path)
  on public.submission_assets to authenticated;

create policy "Create own draft" on public.submissions for insert to authenticated
  with check (
    submitted_by = (select auth.uid()) and intake_completed_at is null
    and status = 'received' and verdict is null and verdict_explanation is null
    and reviewed_at is null and email_sent_at is null and email_last_error is null
  );

create policy "Read own active draft" on public.submissions for select to authenticated
  using (submitted_by = (select auth.uid()) and intake_completed_at is null
    and created_at > now() - interval '15 minutes');

-- FOR UPDATE locks used by attachment reservations need an UPDATE USING policy.
-- WITH CHECK false still prevents visitors from changing any draft columns.
create policy "Lock own active draft" on public.submissions for update to authenticated
  using (submitted_by = (select auth.uid()) and intake_completed_at is null
    and created_at > now() - interval '15 minutes')
  with check (false);

create policy "Cancel own active draft" on public.submissions for delete to authenticated
  using (submitted_by = (select auth.uid()) and intake_completed_at is null
    and created_at > now() - interval '15 minutes');

create policy "Operators read submissions" on public.submissions for select to authenticated
  using ((select public.is_admin()));
create policy "Operators review completed submissions" on public.submissions for update to authenticated
  using (intake_completed_at is not null and (select public.is_admin()))
  with check (intake_completed_at is not null and (select public.is_admin()));

create function public.owns_submission_draft(submission_id uuid)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1 from public.submissions s
    where s.id = submission_id and s.submitted_by = (select auth.uid())
      and s.intake_completed_at is null and s.created_at > now() - interval '15 minutes'
  );
$$;
revoke all on function public.owns_submission_draft(uuid) from public, anon;
grant execute on function public.owns_submission_draft(uuid) to authenticated;

create policy "Read own draft attachments" on public.submission_assets for select to authenticated
  using (public.owns_submission_draft(submission_id));
create policy "Reserve own draft attachments" on public.submission_assets for insert to authenticated
  with check (
    public.owns_submission_draft(submission_id)
    and split_part(storage_path, '/', 1) = (select auth.uid())::text
    and split_part(storage_path, '/', 2) = submission_id::text
    and array_length(string_to_array(storage_path, '/'), 1) = 3
    and length(split_part(storage_path, '/', 3)) > 0
  );
create policy "Operators read attachments" on public.submission_assets for select to authenticated
  using ((select public.is_admin()));

-- Constraints apply to new writes without rewriting potentially older content.
create function public.valid_submission_urls(urls jsonb)
returns boolean language plpgsql immutable security invoker set search_path = ''
as $$
begin
  if jsonb_typeof(urls) <> 'array' then return false; end if;
  return jsonb_array_length(urls) <= 10 and not exists (
    select 1 from jsonb_array_elements(urls) u
    where jsonb_typeof(u) <> 'string' or length(u #>> '{}') > 2048
      or (u #>> '{}') !~ '^https?://[^[:space:]/]+'
  );
end;
$$;

alter table public.submissions add constraint submissions_input_limits check (
  length(public_reference) between 1 and 100
  and length(response_email) <= 254 and response_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  and coalesce(length(submitted_text), 0) <= 20000
  and coalesce(length(context), 0) <= 4000
  and coalesce(length(verdict_explanation), 0) <= 2000
  and public.valid_submission_urls(submitted_urls)
) not valid;

alter table public.submission_assets add constraint submission_assets_input_limits check (
  length(file_name) between 1 and 500 and length(storage_path) between 1 and 1024
  and size_bytes between 1 and 10485760
  and content_type in (
    'application/msword', 'application/pdf', 'application/vnd.ms-outlook',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/gif', 'image/jpeg', 'image/png', 'image/webp', 'message/rfc822', 'text/plain'
  )
) not valid;

create function public.check_attachment_limits()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  -- Serialize reservations so concurrent uploads cannot overrun the limits.
  perform 1 from public.submissions where id = new.submission_id for update;
  if not found then raise exception 'Submission unavailable'; end if;
  if (select count(*) >= 5 or coalesce(sum(size_bytes), 0) + new.size_bytes > 26214400
      from public.submission_assets where submission_id = new.submission_id) then
    raise exception 'Attachment limits exceeded' using errcode = '23514';
  end if;
  return new;
end;
$$;
create trigger submission_assets_check_limits before insert on public.submission_assets
  for each row execute function public.check_attachment_limits();

update storage.buckets set public = false, file_size_limit = 10485760,
  allowed_mime_types = array[
    'application/msword', 'application/pdf', 'application/vnd.ms-outlook',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/gif', 'image/jpeg', 'image/png', 'image/webp', 'message/rfc822', 'text/plain'
  ] where id = 'submission-assets';

create function public.owns_draft_asset(asset_path text)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select exists (select 1 from public.submission_assets a
    where a.storage_path = asset_path and public.owns_submission_draft(a.submission_id));
$$;
revoke all on function public.owns_draft_asset(text) from public, anon;
grant execute on function public.owns_draft_asset(text) to authenticated;

create policy "Upload reserved draft assets" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'submission-assets' and public.owns_draft_asset(name)
    and (
      -- Storage's preflight permission check has no metadata yet.
      metadata is null or metadata = '{}'::jsonb or exists (
        select 1 from public.submission_assets a where a.storage_path = name
          and a.size_bytes = (metadata->>'size')::bigint
          and a.content_type = metadata->>'mimetype'
      )
    )
  );
create policy "Read own draft files" on storage.objects for select to authenticated
  using (bucket_id = 'submission-assets' and public.owns_draft_asset(name));
create policy "Remove own draft files" on storage.objects for delete to authenticated
  using (bucket_id = 'submission-assets' and public.owns_draft_asset(name));
create policy "Operators read private files" on storage.objects for select to authenticated
  using (bucket_id = 'submission-assets' and (select public.is_admin()));

create function public.check_submission_completion()
returns trigger language plpgsql security invoker set search_path = ''
as $$
begin
  if old.intake_completed_at is null and new.intake_completed_at is not null then
    if coalesce(length(btrim(new.submitted_text)), 0) = 0
      and jsonb_array_length(new.submitted_urls) = 0
      and not exists (select 1 from public.submission_assets where submission_id = new.id) then
      raise exception 'Submission must contain content' using errcode = '23514';
    end if;
    if exists (
      select 1 from public.submission_assets a where a.submission_id = new.id
        and not exists (select 1 from storage.objects o
          where o.bucket_id = 'submission-assets' and o.name = a.storage_path
            and (o.metadata->>'size')::bigint = a.size_bytes
            and o.metadata->>'mimetype' = a.content_type)
    ) then
      raise exception 'Attachments are incomplete' using errcode = '23514';
    end if;
    new.intake_completed_at := now();
  end if;
  return new;
end;
$$;
create trigger submissions_check_completion before update on public.submissions
  for each row execute function public.check_submission_completion();

create function public.complete_submission(submission_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  -- Closing intake revokes SELECT access, which PostgreSQL UPDATE also requires
  -- on the new row. This narrow operation therefore checks ownership explicitly.
  update public.submissions set intake_completed_at = now()
    where id = submission_id and submitted_by = (select auth.uid())
      and intake_completed_at is null and created_at > now() - interval '15 minutes';
  if not found then raise exception 'Submission unavailable'; end if;
end;
$$;
revoke all on function public.complete_submission(uuid) from public, anon;
grant execute on function public.complete_submission(uuid) to authenticated;

revoke all on function public.check_attachment_limits(), public.check_submission_completion()
  from public, anon, authenticated;

drop policy if exists "Upload reserved draft assets" on storage.objects;

create policy "Upload reserved draft assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'submission-assets'
    and public.owns_draft_asset(name)
  );

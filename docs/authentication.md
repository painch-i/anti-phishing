# Authentication operations

## Environment setup

Use separate Supabase projects for Preview/Development and Production. The Vercel
integration injects connection variables, but does not apply this repository's
migrations or configure Auth providers.

1. Link the intended **dev** Supabase project with `supabase link --project-ref <dev-ref>`.
2. Apply the repository migrations with `supabase db push`.
3. In Supabase Authentication > Sign In / Providers, enable anonymous sign-ins.
   Keep email/password enabled for operators. The application has no public
   registration page; any other authenticated account still has no operator rights.
4. In Authentication > Users, create the operator's email/password account.
5. Grant that existing account membership through the SQL Editor as a database
   administrator, using the verified user's UUID:

```sql
insert into public.admin_users (user_id)
values ('REPLACE_WITH_AUTH_USER_UUID'::uuid)
on conflict do nothing;
```

No application account, including an operator, can run this administrative write.
Never make membership depend on `user_metadata` or expose a privileged key to
implement a role-management page.

After dev verification, repeat these steps for Production before merging into
`main`. The migration is additive to the original schema; the old deployment can
continue using its server client during the transition. Do not remove integration
variables required by an older deployment until that deployment is retired.

## Revoking access

Delete the user's membership row using database administration. RLS checks the
table on each request, including when the existing JWT is still valid:

```sql
delete from public.admin_users where user_id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid;
```

Supabase logout revokes the local refresh session and clears its cookies. Already
issued access tokens retain their validity until expiry; for immediate operator
revocation remove membership as above. Existing file URLs expire after five minutes.

## Verification before release

- Submit text, a URL and a supported file on the Preview; check the receipt.
- Confirm the guest cannot retrieve the completed row or file through Supabase.
- Sign in as an operator; check the queue, content and private download.
- Record a verdict and verify the Resend result with a test recipient you control.
- Check incorrect credentials, non-operator login, session refresh and logout.
- Remove a test operator's membership and confirm the existing session loses access.

`npm test` executes actual PostgreSQL policies using PGlite and minimal Supabase
schema fixtures, plus SSR-cookie and route tests. It does not emulate the hosted
Auth service, HTTP Storage service or email provider. Perform the above Preview
checks as well; a successful Next.js build alone does not verify those services.

## Limits and cleanup

Drafts are inaccessible to visitors after 15 minutes and do not appear in the
review queue. Failed uploads are cleaned up immediately when possible. Interrupted
requests, uncertain network results or cleanup failures can leave drafts and files
for operational cleanup. Delete files through the **Storage API or dashboard
first**, then delete abandoned database drafts as a database administrator. Do
not delete rows from `storage.objects` directly: that leaves the underlying blobs.

Anonymous identities are not automatically deleted by Supabase. Review and remove
unused anonymous identities after 30 days as part of operations. The nullable
`submitted_by` foreign key uses `on delete set null`, so this does not delete
received submissions. Completed requests remain stored for manual review; no
automatic retention/deletion schedule is introduced by this change.

Supabase's anonymous sign-in rate limit applies to the source IP. Server-side
sign-ins can share Vercel egress IPs; monitor 429 responses before increasing
traffic. Configure abuse protection appropriate to that traffic. Enabling a
CAPTCHA in Supabase also requires wiring its token into the public form; do not
enable it without that integration. RLS protects access, not global spam volume.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs),
[anonymous sign-ins](https://supabase.com/docs/guides/auth/auth-anonymous),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security),
[Storage access control](https://supabase.com/docs/guides/storage/security/access-control).

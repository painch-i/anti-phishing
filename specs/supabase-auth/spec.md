# Authentication and data access

## Behavior

- Operators sign in with Supabase Auth email/password credentials. Membership in
  `public.admin_users` is required for the back-office and verdict delivery.
- Membership is managed through database administration, never through a public
  API, user metadata, or the application's own admin session.
- Every application database and Storage request uses a publishable (or legacy
  anon) key and the current Supabase session. No service-role client is used.
- A visitor submits without registration. The submission endpoint creates or
  reuses a Supabase anonymous session in HTTP-only cookies.
- A submission starts as a private draft. Its owner can prepare attachments and
  cancel it for 15 minutes. Completing the intake makes the submission and its
  attachments inaccessible to the visitor, including through the Supabase API.
- Only completed submissions appear in the review queue. Existing submissions
  and file paths remain readable by operators after migration.

## Boundaries

- An unauthenticated request cannot read or write application data or files.
- A visitor cannot read another draft, attach a file to it, record a verdict,
  change ownership, or grant themselves operator access.
- Public inserts cannot set verdict, email delivery, ownership or creation fields.
- Database constraints and Storage policies enforce input limits even when the
  Next.js endpoint is bypassed. Attachment reservations serialize per submission
  to enforce five files and 25 MiB total; the bucket limits each file to 10 MiB.
- Finalization checks that each reserved attachment actually exists. The response
  contains only the public reference, never a session token or internal record.
- Admin permissions are checked against the current membership table on each
  request, so removing membership takes effect without waiting for JWT expiry.
- Cookie-authenticated mutations reject cross-origin requests. Session-bearing
  responses must not be cached, and refreshed cookies must reach the browser.

## Acceptance

Test invalid credentials, non-admin accounts, expired/refreshed sessions, logout,
cross-origin mutations, and denied verdict delivery. Execute the migrations in
Postgres and test policies as anon, two distinct visitors, an admin and a revoked
admin. Include malicious column writes, direct Storage access, cross-owner paths,
invalid inputs, upload limits, completion, and legacy submissions.

## Operations and scope

Enable anonymous sign-ins in each Supabase environment and provision the first
operator before release. Preview and Production should use separate projects.
Automatic migrations against Production during application builds are excluded.

Anonymous identities and abandoned drafts need operational cleanup; see
`docs/authentication.md`. Registration, password-reset UI, public history, role
management UI, and automated retention jobs are outside this change.

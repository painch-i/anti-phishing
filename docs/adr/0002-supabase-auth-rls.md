# ADR 0002: Supabase Auth and RLS

## Status

Accepted. Supersedes the authentication and privileged database access decisions
in ADR 0001.

## Context

Supabase already hosts the application's data. A shared password in environment
variables and a service-role client duplicate its authentication and move all
authorization into the Next.js server. The public submission flow must continue
to work without registration.

## Decision

Use Supabase Auth and the official `@supabase/ssr` cookie adapter. All runtime
clients use the publishable key and the user's session. Operators are existing
Auth users listed in `public.admin_users`. Only database administration can edit
this table; policies and server guards query its current state, not user metadata
or a stale role claim.

Public submissions use anonymous Auth sessions. Each draft belongs to `auth.uid()`
and is accessible to its owner for 15 minutes. Files are reserved before upload,
with per-submission locking and database limits. Storage RLS permits only those
reserved paths and checks upload metadata. Completed requests become operator-only.

One narrowly scoped SQL function, `complete_submission`, uses `SECURITY DEFINER`.
PostgreSQL checks SELECT policies on an updated row as well, so completing a draft
while simultaneously removing the visitor's read access cannot use ordinary
UPDATE. This function checks the caller's `auth.uid()`, ownership, incomplete
state and deadline explicitly, updates only the completion timestamp and returns
no data. Its search path is empty and PUBLIC/anon execution is revoked. The
completion trigger verifies content and uploaded attachments. All other new
functions use invoker rights and RLS; no runtime secret key is required.

Auth cookies are HTTP-only. Next.js Proxy refreshes sessions on auth-dependent
routes; routes preserve cookie changes on redirects and errors. `getUser()`
verifies identities with Supabase. Mutations require a same-origin Origin header.
Personalized responses use `private, no-store`.

## Consequences

- Existing records and legacy file paths remain available to operators.
- The app no longer needs `ADMIN_*`, service-role, secret or database credentials.
- Anonymous sign-ins and the first operator must be configured per environment.
- RLS and column grants protect the data even if Next.js validation is bypassed.
- Removing membership immediately blocks new database reads, writes and signed
  URL creation. Already issued signed URLs remain valid for up to five minutes.
- Anonymous accounts and abandoned drafts require operational cleanup.
- Password recovery and administrative provisioning use the Supabase dashboard;
  no public account or role-management interface is added to the MVP.

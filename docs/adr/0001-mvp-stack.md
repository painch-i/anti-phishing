# ADR 0001: MVP application stack

## Status

Accepted

## Context

The MVP must support an end-to-end human triage workflow: public submission, private storage, operator review, verdict recording, and email delivery. The repository starts from a product specification, without an existing application stack.

## Decision

Build the MVP as a Next.js TypeScript application. Use Supabase for Postgres and private file storage. Use Resend for transactional verdict emails. Protect the operator area with a single-admin email/password login backed by a signed HTTP-only cookie.

## Consequences

- The public site and API live in one deployable application.
- Supabase is accessed only from server-side code with a service role key.
- Submitted assets remain private and are exposed to the operator through short-lived signed URLs.
- Visitor accounts, public request pages, role management, and automated verdicts remain outside the MVP.

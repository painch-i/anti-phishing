# Deployment workflow

Anti-Phishing is deployed through the GitHub integration in Vercel.

Do not deploy production directly from the local CLI during normal development. Production must come from the Git history so the deployed source is traceable and reproducible.

## Branches

- `main` is the production branch.
- `develop` is the shared development branch.
- Feature work should happen on short-lived branches and be merged into `develop` first.
- Production releases are made by merging `develop` into `main`.

## Vercel environments

Vercel uses three environment scopes:

- Production: deployments created from `main`.
- Preview: deployments created from `develop`, pull requests, and other non-production branches.
- Development: local development through `vercel env pull` or `vercel dev`.

The project should keep separate values for production and preview whenever an external service supports it. In particular:

- production Supabase project and bucket for Production;
- development Supabase project and bucket for Preview/Development;
- production Resend sender/domain for Production;
- development or sandbox sender/domain for Preview/Development.

## Required environment variables

Connect the Supabase integration from the Vercel Marketplace before testing the
full workflow. It synchronizes the Supabase connection variables into the linked
Vercel project automatically.

The application reads:

- Supabase URL: `SUPABASE_URL`, with `NEXT_PUBLIC_SUPABASE_URL` as fallback.
- Supabase server key: `SUPABASE_SECRET_KEY`, with legacy `SUPABASE_SERVICE_ROLE_KEY` as fallback.

The Supabase server key is required because the MVP writes to RLS-protected
tables and a private Storage bucket from server routes. Do not replace it with a
publishable or anon key.

If one Supabase Marketplace resource is scoped to both Production and Preview,
both deployment environments use the same database and Storage bucket. For
strict data isolation, attach a separate Supabase project for Preview or override
the Preview variables, scoped to the `develop` branch, with values from a
development Supabase project.

Set these non-Supabase keys in Vercel for both Production and Preview before
testing the full workflow:

- `SUPABASE_SUBMISSION_ASSETS_BUCKET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `RESEND_API_KEY`
- `RESEND_FROM`

`NEXT_PUBLIC_APP_URL` may differ per environment:

- Production: the production domain, for example `https://anti-phishing.vercel.app`;
- Preview: the preview deployment URL or a stable development domain if one is added later.

## Normal release flow

1. Push feature work to a feature branch.
2. Open a pull request into `develop`; Vercel creates a Preview deployment.
3. Merge into `develop` after review; Vercel creates the shared dev deployment.
4. Merge `develop` into `main` when ready to release; Vercel creates the Production deployment.

## CLI usage

Allowed:

```bash
vercel env ls
vercel env pull .env.local --environment=development --yes
vercel inspect <deployment-url>
vercel curl <deployment-url>
```

Avoid for normal releases:

```bash
vercel deploy --prod
vercel --prod
```

Direct production CLI deployments are reserved for exceptional recovery only and should be followed by a Git-based deployment from `main`.

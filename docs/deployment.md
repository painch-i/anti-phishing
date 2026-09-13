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
- Supabase public key: `SUPABASE_PUBLISHABLE_KEY`, then
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, or
  `SUPABASE_ANON_KEY` as fallbacks.

The application sends the current user's Supabase session with the public key.
Tables and the private `submission-assets` bucket enforce RLS. No secret or
service-role key is used by application code. Integration-provided `POSTGRES_*`
and secret keys are not needed at runtime.

The configured resources are separate:

- Production: `supabase`, project `ukcyborroymsjxavrqdt`.
- Preview/Development: `anti-phishing-dev`, project `arjpmwywkmppbzeirsss`.

Each resource injects its own variables through the Marketplace connection. Keep
these connections scoped to their respective environments. Supabase's optional
preview-branch action is not needed for this shared dev project.

Set these non-Supabase keys in Vercel for both Production and Preview before
testing the full workflow:

- `RESEND_API_KEY`
- `RESEND_FROM`

`NEXT_PUBLIC_APP_URL` may differ per environment:

- Production: the production domain, for example `https://anti-phishing.vercel.app`;
- Preview: the preview deployment URL or a stable development domain if one is added later.

Database migrations run automatically at the start of every Vercel build, before
`next build`. The build fails if the migration fails. Configure these Vercel
variables separately for Preview and Production:

- `SUPABASE_PROJECT_REF`: the target Supabase project ref;
- `SUPABASE_DB_PASSWORD`: the target project's database password.
- `SUPABASE_ACCESS_TOKEN`: a Supabase access token usable by the CLI.

Preview must point to the development project and Production to the
production project. Vercel's environment isolation is therefore part of the
database safety boundary; never put the production values in the Preview scope.

Before deploying the Auth/RLS change, enable anonymous sign-ins and provision an
operator. See [authentication operations](authentication.md).

Vercel can redact sensitive integration variables during `env pull`. Empty or
`[SENSITIVE]` values are not usable credentials. For local development, retrieve
only the dev project's URL and publishable key from its dashboard into a
gitignored `.env.local`; do not copy the production secret key.

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

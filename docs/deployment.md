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

Set these keys in Vercel for both Production and Preview before testing the full workflow:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
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

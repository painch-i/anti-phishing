import { spawnSync } from "node:child_process";

if (process.env.VERCEL !== "1") {
  console.log("Skipping Supabase migrations outside Vercel.");
  process.exit(0);
}

const projectRef = process.env.SUPABASE_PROJECT_REF;
const databasePassword = process.env.SUPABASE_DB_PASSWORD;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!databaseUrl && (!projectRef || !databasePassword || !accessToken)) {
  console.error(
    "Supabase migrations require POSTGRES_URL_NON_POOLING (preferred), POSTGRES_URL, or the Supabase CLI credentials on Vercel."
  );
  process.exit(1);
}

const migrationArgs = databaseUrl
  ? ["--db-url", databaseUrl]
  : ["--project-ref", projectRef, "--password", databasePassword];

const result = spawnSync(
  "npx",
  ["--yes", "supabase@2.117.0", "db", "push", ...migrationArgs, "--yes"],
  { stdio: "inherit", env: process.env }
);

if (result.error) {
  console.error(`Unable to run Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

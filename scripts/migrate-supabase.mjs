import { spawnSync } from "node:child_process";

if (process.env.VERCEL !== "1") {
  console.log("Skipping Supabase migrations outside Vercel.");
  process.exit(0);
}

const projectRef = process.env.SUPABASE_PROJECT_REF;
const databasePassword = process.env.SUPABASE_DB_PASSWORD;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !databasePassword || !accessToken) {
  console.error(
    "Supabase migrations require SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD and SUPABASE_ACCESS_TOKEN on Vercel."
  );
  process.exit(1);
}

const result = spawnSync(
  "npx",
  ["--yes", "supabase@2.117.0", "db", "push", "--project-ref", projectRef, "--password", databasePassword, "--yes"],
  { stdio: "inherit", env: process.env }
);

if (result.error) {
  console.error(`Unable to run Supabase CLI: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);

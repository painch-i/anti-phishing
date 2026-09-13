import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { optionalEnv, requiredEnv } from "@/lib/env";

export const submissionAssetsBucket = optionalEnv(
  "SUPABASE_SUBMISSION_ASSETS_BUCKET",
  "submission-assets"
);

export function getSupabaseAdminClient() {
  return createClient<Database>(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

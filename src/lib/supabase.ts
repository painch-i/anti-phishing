import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { optionalEnv, requiredEnvFrom } from "@/lib/env";

const supabaseUrlEnvNames = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const supabaseAdminKeyEnvNames = ["SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const;

export const submissionAssetsBucket = optionalEnv(
  "SUPABASE_SUBMISSION_ASSETS_BUCKET",
  "submission-assets"
);

export function getSupabaseAdminClient() {
  return createClient<Database>(
    requiredEnvFrom(supabaseUrlEnvNames),
    requiredEnvFrom(supabaseAdminKeyEnvNames),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

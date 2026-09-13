import "server-only";

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database.types";
import { requiredEnvFrom } from "@/lib/env";

const supabaseUrlEnvNames = ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const;
const supabasePublicKeyEnvNames = [
  "SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY"
] as const;

export const submissionAssetsBucket = "submission-assets";

export function createSupabaseClient(cookieMethods: CookieMethodsServer) {
  return createServerClient<Database>(
    requiredEnvFrom(supabaseUrlEnvNames),
    requiredEnvFrom(supabasePublicKeyEnvNames),
    {
      cookies: cookieMethods,
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/"
      }
    }
  );
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;

export async function getSupabaseClient() {
  const cookieStore = await cookies();

  // Server Components only read cookies; proxy.ts persists session refreshes.
  return createSupabaseClient({ getAll: () => cookieStore.getAll() });
}

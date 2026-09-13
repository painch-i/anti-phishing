import "server-only";

import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { createSupabaseClient } from "@/lib/supabase";

export function createSupabaseRouteClient(request: NextRequest) {
  const pendingCookies = new Map<string, { value: string; options: CookieOptions }>();
  const supabase = createSupabaseClient({
    getAll: () => request.cookies.getAll(),
    setAll(cookiesToSet) {
      for (const { name, value, options } of cookiesToSet) {
        request.cookies.set(name, value);
        pendingCookies.set(name, { value, options });
      }
    }
  });

  function withSession(response: NextResponse) {
    for (const [name, { value, options }] of pendingCookies) {
      response.cookies.set(name, value, options);
    }

    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return { supabase, withSession };
}

export function isSameOrigin(request: NextRequest): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}

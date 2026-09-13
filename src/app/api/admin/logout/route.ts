import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient, isSameOrigin } from "@/lib/supabase-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const { supabase, withSession } = createSupabaseRouteClient(request);
  await supabase.auth.signOut({ scope: "local" });
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);

  return withSession(response);
}

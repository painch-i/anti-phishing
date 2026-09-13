import { NextRequest, NextResponse } from "next/server";

import { createSupabaseRouteClient } from "@/lib/supabase-route";

export async function proxy(request: NextRequest) {
  const { supabase, withSession } = createSupabaseRouteClient(request);
  await supabase.auth.getUser();

  return withSession(NextResponse.next({ request }));
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/submissions"]
};

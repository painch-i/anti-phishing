import { NextRequest, NextResponse } from "next/server";

import { createSubmission } from "@/lib/submissions";
import { validateSubmissionFormData } from "@/lib/submission-validation";
import { createSupabaseRouteClient, isSameOrigin } from "@/lib/supabase-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const { supabase, withSession } = createSupabaseRouteClient(request);

  try {
    const formData = await request.formData();
    const validation = validateSubmissionFormData(formData);

    if (!validation.ok) {
      return withSession(NextResponse.json(
        {
          ok: false,
          message: "La demande contient des informations à corriger.",
          errors: validation.errors
        },
        { status: 400 }
      ));
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { error } = await supabase.auth.signInAnonymously();

      if (error) {
        return withSession(NextResponse.json(
          { ok: false, message: "Le dépôt est temporairement indisponible. Réessayez dans quelques instants." },
          { status: error.status === 429 ? 429 : 503 }
        ));
      }
    }

    const submission = await createSubmission(supabase, validation.data);

    return withSession(NextResponse.json(
      {
        ok: true,
        reference: submission.public_reference
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Submission failed", error instanceof Error ? error.name : "UnknownError");

    return withSession(NextResponse.json(
      {
        ok: false,
        message: "La demande n'a pas pu être enregistrée. Réessayez dans quelques instants."
      },
      { status: 500 }
    ));
  }
}

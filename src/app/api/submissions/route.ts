import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { createSubmission } from "@/lib/submissions";
import { validateSubmissionFormData } from "@/lib/submission-validation";
import { createSupabaseRouteClient, isSameOrigin } from "@/lib/supabase-route";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return new NextResponse(null, { status: 403 });
  }

  const { supabase, withSession } = createSupabaseRouteClient(request);
  const requestId = randomUUID();
  let stage = "form-data";

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

    stage = "auth.getUser";
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.warn("Submission auth lookup failed", { requestId, code: userError.code, status: userError.status });
    }

    if (!user) {
      stage = "auth.signInAnonymously";
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error("Submission anonymous sign-in failed", {
          requestId,
          code: error.code,
          status: error.status,
          message: error.message
        });
        return withSession(NextResponse.json(
          { ok: false, message: "Le dépôt est temporairement indisponible. Réessayez dans quelques instants.", requestId },
          { status: error.status === 429 ? 429 : 503 }
        ));
      }

      console.info("Submission anonymous session created", { requestId, userId: data.user?.id });
    }

    stage = "createSubmission";
    const submission = await createSubmission(supabase, validation.data);

    return withSession(NextResponse.json(
      {
        ok: true,
        reference: submission.public_reference,
        requestId
      },
      { status: 201 }
    ));
  } catch (error) {
    console.error("Submission failed", {
      requestId,
      stage,
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      cause: error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined
    });

    return withSession(NextResponse.json(
      {
        ok: false,
        message: "La demande n'a pas pu être enregistrée. Réessayez dans quelques instants.",
        requestId
      },
      { status: 500 }
    ));
  }
}

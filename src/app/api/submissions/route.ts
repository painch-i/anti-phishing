import { NextResponse } from "next/server";

import { createSubmission } from "@/lib/submissions";
import { validateSubmissionFormData } from "@/lib/submission-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const validation = validateSubmissionFormData(formData);

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: "La demande contient des informations à corriger.",
          errors: validation.errors
        },
        { status: 400 }
      );
    }

    const submission = await createSubmission(validation.data);

    return NextResponse.json(
      {
        ok: true,
        reference: submission.public_reference
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        message: "La demande n'a pas pu être enregistrée. Réessayez dans quelques instants."
      },
      { status: 500 }
    );
  }
}

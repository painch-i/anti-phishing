import "server-only";

import { randomUUID } from "node:crypto";

import type { PostgrestError } from "@supabase/supabase-js";

import type { SubmissionAssetRow, SubmissionRow } from "@/lib/database.types";
import { type Verdict } from "@/lib/domain";
import { sendVerdictEmail } from "@/lib/email";
import { createPublicReference } from "@/lib/reference";
import { getSupabaseClient, submissionAssetsBucket, type SupabaseClient } from "@/lib/supabase";
import { getFileContentType } from "@/lib/submission-constraints";
import type { SubmissionInput } from "@/lib/submission-validation";

export type SubmissionWithAssets = SubmissionRow & {
  assets: SubmissionAssetRow[];
};

function throwPostgrest(error: PostgrestError | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function safeFileName(fileName: string): string {
  const fallback = "submission-file";
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

  return cleaned || fallback;
}

async function createSubmissionRow(supabase: SupabaseClient, input: SubmissionInput): Promise<SubmissionRow> {
  let lastError: PostgrestError | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        public_reference: createPublicReference(),
        response_email: input.responseEmail,
        submitted_text: input.submittedText,
        submitted_urls: input.submittedUrls,
        context: input.context,
        intake_completed_at: null
      })
      .select("*")
      .single();

    if (data) {
      return data;
    }

    lastError = error;

    if (error?.code !== "23505") {
      break;
    }
  }

  throwPostgrest(lastError);
  throw new Error("Unable to create submission.");
}

async function reserveAsset(supabase: SupabaseClient, submission: SubmissionRow, file: File): Promise<SubmissionAssetRow> {
  const assetId = randomUUID();
  const fileName = safeFileName(file.name);
  const storagePath = `${submission.submitted_by}/${submission.id}/${assetId}-${fileName}`;
  const contentType = getFileContentType(file);

  const { data, error } = await supabase
    .from("submission_assets")
    .insert({
      id: assetId,
      submission_id: submission.id,
      file_name: file.name || fileName,
      content_type: contentType,
      size_bytes: file.size,
      storage_path: storagePath
    })
    .select("*")
    .single();

  throwPostgrest(error);

  if (!data) {
    throw new Error("Unable to record uploaded asset.");
  }

  return data;
}

export async function createSubmission(supabase: SupabaseClient, input: SubmissionInput): Promise<Pick<SubmissionRow, "public_reference">> {
  const submission = await createSubmissionRow(supabase, input);
  const reservedAssets: SubmissionAssetRow[] = [];

  try {
    for (const file of input.files) {
      const asset = await reserveAsset(supabase, submission, file);
      reservedAssets.push(asset);
      const { error } = await supabase.storage.from(submissionAssetsBucket).upload(
        asset.storage_path,
        Buffer.from(await file.arrayBuffer()),
        { contentType: asset.content_type, upsert: false }
      );

      if (error) {
        throw new Error(error.message);
      }
    }

    const { error } = await supabase.rpc("complete_submission", { submission_id: submission.id });
    throwPostgrest(error);
  } catch (error) {
    // Keep reservations until Storage cleanup finishes: its policies use them.
    const uploadedPaths = reservedAssets.map((asset) => asset.storage_path);

    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await supabase.storage.from(submissionAssetsBucket).remove(uploadedPaths);

      if (cleanupError) {
        throw error;
      }
    }

    await supabase.from("submissions").delete().eq("id", submission.id);
    throw error;
  }

  return { public_reference: submission.public_reference };
}

export async function listSubmissions(): Promise<SubmissionRow[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .not("intake_completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  throwPostgrest(error);

  return data ?? [];
}

export async function getSubmissionWithAssets(id: string, client?: SupabaseClient): Promise<SubmissionWithAssets | null> {
  const supabase = client ?? await getSupabaseClient();
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .not("intake_completed_at", "is", null)
    .single();

  if (error?.code === "PGRST116") {
    return null;
  }

  throwPostgrest(error);

  if (!submission) {
    return null;
  }

  const { data: assets, error: assetsError } = await supabase
    .from("submission_assets")
    .select("*")
    .eq("submission_id", id)
    .order("created_at", { ascending: true });

  throwPostgrest(assetsError);

  return {
    ...submission,
    assets: assets ?? []
  };
}

export async function createSignedAssetUrl(path: string): Promise<string> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase.storage
    .from(submissionAssetsBucket)
    .createSignedUrl(path, 5 * 60, { download: true });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Unable to create signed asset URL.");
  }

  return data.signedUrl;
}

export async function recordVerdictAndSendEmail(supabase: SupabaseClient, input: {
  submissionId: string;
  verdict: Verdict;
  explanation: string | null;
}): Promise<void> {
  const submission = await getSubmissionWithAssets(input.submissionId, supabase);

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "reviewed",
      verdict: input.verdict,
      verdict_explanation: input.explanation,
      reviewed_at: reviewedAt,
      email_last_error: null
    })
    .eq("id", input.submissionId)
    .select("id")
    .single();

  throwPostgrest(updateError);

  try {
    await sendVerdictEmail({
      to: submission.response_email,
      reference: submission.public_reference,
      verdict: input.verdict,
      explanation: input.explanation
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error.";
    await supabase
      .from("submissions")
      .update({
        email_last_error: message,
        email_sent_at: null
      })
      .eq("id", input.submissionId);
    throw error;
  }

  const { error: sentError } = await supabase
    .from("submissions")
    .update({
      email_sent_at: new Date().toISOString(),
      email_last_error: null
    })
    .eq("id", input.submissionId);

  throwPostgrest(sentError);
}

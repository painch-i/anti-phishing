import "server-only";

import { randomUUID } from "node:crypto";

import type { PostgrestError } from "@supabase/supabase-js";

import type { SubmissionAssetRow, SubmissionRow } from "@/lib/database.types";
import { type Verdict } from "@/lib/domain";
import { sendVerdictEmail } from "@/lib/email";
import { createPublicReference } from "@/lib/reference";
import { getSupabaseAdminClient, submissionAssetsBucket } from "@/lib/supabase";
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

async function createSubmissionRow(input: SubmissionInput): Promise<SubmissionRow> {
  const supabase = getSupabaseAdminClient();
  let lastError: PostgrestError | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        public_reference: createPublicReference(),
        response_email: input.responseEmail,
        submitted_text: input.submittedText,
        submitted_urls: input.submittedUrls,
        context: input.context
      })
      .select("*")
      .single();

    if (data) {
      return data;
    }

    lastError = error;
  }

  throwPostgrest(lastError);
  throw new Error("Unable to create submission.");
}

async function uploadAsset(submissionId: string, file: File): Promise<SubmissionAssetRow> {
  const supabase = getSupabaseAdminClient();
  const assetId = randomUUID();
  const fileName = safeFileName(file.name);
  const storagePath = `${submissionId}/${assetId}-${fileName}`;
  const contentType = file.type || "application/octet-stream";
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadResult = await supabase.storage.from(submissionAssetsBucket).upload(storagePath, fileBuffer, {
    contentType,
    upsert: false
  });

  if (uploadResult.error) {
    throw new Error(uploadResult.error.message);
  }

  const { data, error } = await supabase
    .from("submission_assets")
    .insert({
      id: assetId,
      submission_id: submissionId,
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

export async function createSubmission(input: SubmissionInput): Promise<SubmissionRow> {
  const submission = await createSubmissionRow(input);
  const uploadedAssets: SubmissionAssetRow[] = [];

  try {
    for (const file of input.files) {
      uploadedAssets.push(await uploadAsset(submission.id, file));
    }
  } catch (error) {
    const supabase = getSupabaseAdminClient();
    const uploadedPaths = uploadedAssets.map((asset) => asset.storage_path);

    if (uploadedPaths.length > 0) {
      await supabase.storage.from(submissionAssetsBucket).remove(uploadedPaths);
    }

    await supabase.from("submissions").delete().eq("id", submission.id);
    throw error;
  }

  return submission;
}

export async function listSubmissions(): Promise<SubmissionRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  throwPostgrest(error);

  return data ?? [];
}

export async function getSubmissionWithAssets(id: string): Promise<SubmissionWithAssets | null> {
  const supabase = getSupabaseAdminClient();
  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
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
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(submissionAssetsBucket)
    .createSignedUrl(path, 5 * 60, { download: true });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Unable to create signed asset URL.");
  }

  return data.signedUrl;
}

export async function recordVerdictAndSendEmail(input: {
  submissionId: string;
  verdict: Verdict;
  explanation: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const submission = await getSubmissionWithAssets(input.submissionId);

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
    .eq("id", input.submissionId);

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

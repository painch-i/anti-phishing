import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const visitor = "11111111-1111-4111-8111-111111111111";
const otherVisitor = "22222222-2222-4222-8222-222222222222";
const admin = "33333333-3333-4333-8333-333333333333";
let db: PGlite;
let legacyId: string;

async function asUser(id: string, anonymous = true) {
  await db.exec("reset role; set role authenticated;");
  await db.query("select set_config('request.jwt.claims', $1, true)", [
    JSON.stringify({ sub: id, role: "authenticated", is_anonymous: anonymous })
  ]);
}

async function draft(text: string | null = "Suspicious message") {
  const result = await db.query<{ id: string; submitted_by: string }>(`
    insert into public.submissions (public_reference, response_email, submitted_text, intake_completed_at)
    values ($1, 'visitor@example.com', $2, null) returning id, submitted_by
  `, [randomUUID(), text]);
  return result.rows[0];
}

async function reserve(id: string, size = 10, path = `${visitor}/${id}/${randomUUID()}.pdf`) {
  await db.query(`insert into public.submission_assets
    (submission_id, file_name, content_type, size_bytes, storage_path)
    values ($1, 'message.pdf', 'application/pdf', $2, $3)`, [id, size, path]);
  return path;
}

async function upload(path: string, size = 10, mime = "application/pdf") {
  return db.query(`insert into storage.objects (bucket_id, name, metadata)
    values ('submission-assets', $1, $2)`, [path, JSON.stringify({ size, mimetype: mime })]);
}

async function denied(sql: string, params: unknown[] = []) {
  await db.exec("savepoint denied_write");
  try {
    await expect(db.query(sql, params)).rejects.toThrow();
  } finally {
    await db.exec("rollback to savepoint denied_write; release savepoint denied_write;");
  }
}

describe("Supabase RLS migrations in PostgreSQL", () => {
  beforeAll(async () => {
    db = await PGlite.create({ extensions: { pgcrypto } });
    // Supabase owns these schemas; the application migrations below run unchanged.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.jwt() returns jsonb language sql stable as $$
        select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
      $$;
      create function auth.uid() returns uuid language sql stable as $$
        select (auth.jwt()->>'sub')::uuid;
      $$;
      create schema storage;
      create table storage.buckets (
        id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
      );
      create table storage.objects (
        id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets,
        name text, metadata jsonb, unique (bucket_id, name)
      );
      alter table storage.objects enable row level security;
      grant usage on schema public, auth, storage to anon, authenticated;
      grant select, insert, update, delete on storage.objects to anon, authenticated;
    `);
    await db.exec(readFileSync(new URL("../supabase/migrations/0001_mvp.sql", import.meta.url), "utf8"));
    const legacy = await db.query<{ id: string }>(`insert into public.submissions
      (public_reference, response_email, submitted_text) values ('LEGACY', 'legacy@example.com', 'Legacy content')
      returning id`);
    legacyId = legacy.rows[0].id;
    await db.query(`insert into storage.objects (bucket_id, name) values ('submission-assets', $1)`,
      [`${legacyId}/legacy.pdf`]);
    await db.exec(readFileSync(new URL("../supabase/migrations/0002_auth_and_rls.sql", import.meta.url), "utf8"));
    await db.query("insert into auth.users (id) values ($1), ($2), ($3)", [visitor, otherVisitor, admin]);
    await db.query("insert into public.admin_users values ($1)", [admin]);
  }, 30_000);

  beforeEach(async () => { await db.exec("begin"); });
  afterEach(async () => { await db.exec("rollback"); });
  afterAll(async () => { await db?.close(); });

  it("blocks application data and Storage access without an Auth session", async () => {
    await db.exec("set role anon");
    await denied("select * from public.submissions");
    await denied("select * from public.submission_assets");
    await denied("insert into public.submissions (response_email) values ('x@example.com')");
    expect((await db.query("select * from storage.objects")).rows).toEqual([]);
    await denied("select public.is_admin()");
  });

  it("binds a new draft to the session and hides it from other visitors", async () => {
    await asUser(visitor);
    const submission = await draft();
    expect(submission.submitted_by).toBe(visitor);
    await asUser(otherVisitor);
    expect((await db.query("select * from public.submissions")).rows).toEqual([]);
    expect((await db.query("delete from public.submissions where id = $1", [submission.id])).affectedRows).toBe(0);
    await denied("select public.complete_submission($1)", [submission.id]);
    await denied(`insert into public.submission_assets (submission_id, file_name, content_type, size_bytes, storage_path)
      values ($1, 'x.pdf', 'application/pdf', 10, $2)`, [submission.id, `${otherVisitor}/${submission.id}/x.pdf`]);
  });

  it.each([
    ["submitted_by", otherVisitor], ["status", "reviewed"], ["verdict", "legitimate"],
    ["email_sent_at", "2026-01-01"], ["created_at", "2026-01-01"], ["verdict_explanation", "Forged"]
  ])("rejects public insertion of privileged column %s", async (column, value) => {
    await asUser(visitor);
    await denied(`insert into public.submissions (public_reference, response_email, intake_completed_at, ${column})
      values ('FORGED', 'x@example.com', null, $1)`, [value]);
  });

  it("blocks self-promotion, including for an existing operator", async () => {
    for (const id of [visitor, admin]) {
      await asUser(id, false);
      await denied("insert into public.admin_users values ($1)", [visitor]);
      await denied("update public.admin_users set user_id = $1", [visitor]);
      await denied("delete from public.admin_users");
    }
  });

  it("does not grant admin access to anonymous identities or arbitrary metadata", async () => {
    await asUser(admin, true);
    expect((await db.query<{ is_admin: boolean }>("select public.is_admin()")).rows[0].is_admin).toBe(false);
    await asUser(visitor, false);
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({
      sub: visitor, is_anonymous: false, user_metadata: { role: "admin" }
    })]);
    expect((await db.query<{ is_admin: boolean }>("select public.is_admin()")).rows[0].is_admin).toBe(false);
  });

  it("completes text intake and removes the visitor's read, update and delete access", async () => {
    await asUser(visitor);
    const { id } = await draft();
    await db.query("select public.complete_submission($1)", [id]);
    expect((await db.query("select * from public.submissions")).rows).toEqual([]);
    expect((await db.query("update public.submissions set verdict = 'legitimate' where id = $1", [id])).affectedRows).toBe(0);
    expect((await db.query("delete from public.submissions where id = $1", [id])).affectedRows).toBe(0);
    await denied("select public.complete_submission($1)", [id]);
  });

  it("prevents inserting completed requests or assigning a verdict to a draft", async () => {
    await asUser(visitor);
    await denied(`insert into public.submissions (public_reference, response_email)
      values ('BYPASS', 'x@example.com')`);
    const { id } = await draft();
    await denied("update public.submissions set verdict = 'legitimate', intake_completed_at = now() where id = $1", [id]);
    await denied("update public.submissions set submitted_by = $1 where id = $2", [otherVisitor, id]);
  });

  it("enforces completion validation through direct table updates too", async () => {
    await asUser(visitor);
    const { id } = await draft(null);
    await denied("update public.submissions set intake_completed_at = now() where id = $1", [id]);
    await denied("select public.complete_submission($1)", [id]);
    const path = await reserve(id);
    await denied("select public.complete_submission($1)", [id]);
    await upload(path);
    await db.query("select public.complete_submission($1)", [id]);
    expect((await db.query("select * from storage.objects")).rows).toEqual([]);
    expect((await db.query("select * from public.submission_assets")).rows).toEqual([]);
    await denied("insert into storage.objects (bucket_id, name) values ('submission-assets', $1)", [`${visitor}/${id}/later.pdf`]);
  });

  it("allows draft cleanup before deleting the request", async () => {
    await asUser(visitor);
    const { id } = await draft();
    const path = await reserve(id);
    await upload(path);
    expect((await db.query("delete from storage.objects where name = $1", [path])).affectedRows).toBe(1);
    expect((await db.query("delete from public.submissions where id = $1", [id])).affectedRows).toBe(1);
    expect((await db.query("select * from public.submission_assets")).rows).toEqual([]);
  });

  it("denies unreserved files, mismatched sizes, MIME types and other owners' paths", async () => {
    await asUser(visitor);
    const { id } = await draft();
    const path = await reserve(id);
    await denied("insert into storage.objects (bucket_id, name, metadata) values ('submission-assets', $1, $2)",
      [path, JSON.stringify({ size: 100, mimetype: "application/pdf" })]);
    await denied("insert into storage.objects (bucket_id, name, metadata) values ('submission-assets', $1, $2)",
      [path, JSON.stringify({ size: 10, mimetype: "text/html" })]);
    await upload(path);
    await asUser(otherVisitor);
    expect((await db.query("select * from storage.objects")).rows).toEqual([]);
    expect((await db.query("delete from storage.objects where name = $1", [path])).affectedRows).toBe(0);
    await denied("insert into storage.objects (bucket_id, name) values ('submission-assets', $1)", [path + "-forged"]);
  });

  it("enforces both attachment count and cumulative size", async () => {
    await asUser(visitor);
    const first = await draft();
    for (let index = 0; index < 5; index++) await reserve(first.id);
    await denied(`insert into public.submission_assets (submission_id, file_name, content_type, size_bytes, storage_path)
      values ($1, 'sixth.pdf', 'application/pdf', 10, $2)`, [first.id, `${visitor}/${first.id}/sixth.pdf`]);
    const second = await draft();
    await reserve(second.id, 10 * 1024 * 1024);
    await reserve(second.id, 10 * 1024 * 1024);
    await denied(`insert into public.submission_assets (submission_id, file_name, content_type, size_bytes, storage_path)
      values ($1, 'large.pdf', 'application/pdf', 6291456, $2)`, [second.id, `${visitor}/${second.id}/large.pdf`]);
  });

  it.each(["{}", '["javascript:alert(1)"]', '[42]', JSON.stringify(Array(11).fill("https://example.com"))])(
    "rejects invalid URLs through direct database writes: %s", async (urls) => {
      await asUser(visitor);
      await denied(`insert into public.submissions (public_reference, response_email, intake_completed_at, submitted_urls)
        values ('BAD-URL', 'x@example.com', null, $1)`, [urls]);
    }
  );

  it("expires unfinished draft access", async () => {
    await asUser(visitor);
    const { id } = await draft();
    await db.exec("reset role");
    await db.query("update public.submissions set created_at = now() - interval '16 minutes' where id = $1", [id]);
    await asUser(visitor);
    expect((await db.query("select * from public.submissions")).rows).toEqual([]);
    await denied("select public.complete_submission($1)", [id]);
  });

  it("preserves legacy records and files for operators, and immediately enforces revocation", async () => {
    await asUser(admin, false);
    const legacy = await db.query<{ intake_completed_at: Date; submitted_by: null }>(
      "select intake_completed_at, submitted_by from public.submissions where id = $1", [legacyId]);
    expect(legacy.rows[0].intake_completed_at).not.toBeNull();
    expect(legacy.rows[0].submitted_by).toBeNull();
    expect((await db.query("select * from storage.objects")).rows).toHaveLength(1);
    expect((await db.query("update public.submissions set verdict = 'suspicious', status = 'reviewed' where id = $1 returning id",
      [legacyId])).rows).toHaveLength(1);
    await db.exec("reset role");
    await db.query("delete from public.admin_users where user_id = $1", [admin]);
    await asUser(admin, false);
    expect((await db.query("select * from public.submissions")).rows).toEqual([]);
    expect((await db.query("select * from storage.objects")).rows).toEqual([]);
    expect((await db.query("update public.submissions set verdict = 'legitimate' where id = $1", [legacyId])).affectedRows).toBe(0);
  });
});

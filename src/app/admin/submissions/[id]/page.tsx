import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { verdictCopy, verdicts } from "@/lib/domain";
import { formatBytes } from "@/lib/submission-constraints";
import { createSignedAssetUrl, getSubmissionWithAssets } from "@/lib/submissions";

type SubmissionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function urlsFromJson(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function SubmissionDetailPage({
  params,
  searchParams
}: SubmissionDetailPageProps) {
  await requireAdminSession();

  const { id } = await params;
  const query = await searchParams;
  const submission = await getSubmissionWithAssets(id);

  if (!submission) {
    notFound();
  }

  const urls = urlsFromJson(submission.submitted_urls);
  const assets = await Promise.all(
    submission.assets.map(async (asset) => ({
      ...asset,
      signedUrl: await createSignedAssetUrl(asset.storage_path)
    }))
  );

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <Link className="brand" href="/admin">
            <span className="brand-mark">AP</span>
            <span>Anti-Phishing</span>
          </Link>
          <p className="admin-muted" style={{ margin: "10px 0 0" }}>
            {submission.public_reference}
          </p>
        </div>
        <div className="button-row">
          <Link className="secondary-button" href="/admin">
            Retour
          </Link>
          <form action="/api/admin/logout" method="post">
            <button className="secondary-button" type="submit">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <div className="detail-grid">
        <section className="panel">
          <div className="detail-section">
            <h1 className="admin-title" style={{ fontSize: "2rem" }}>
              Demande
            </h1>
            <dl className="detail-list">
              <div>
                <dt>Email</dt>
                <dd>{submission.response_email}</dd>
              </div>
              <div>
                <dt>Reçue</dt>
                <dd>{formatDate(submission.created_at)}</dd>
              </div>
              <div>
                <dt>Revue</dt>
                <dd>{formatDate(submission.reviewed_at)}</dd>
              </div>
              <div>
                <dt>Email verdict</dt>
                <dd>{submission.email_sent_at ? `Envoyé le ${formatDate(submission.email_sent_at)}` : "Non envoyé"}</dd>
              </div>
            </dl>
          </div>

          {submission.email_last_error ? (
            <div className="detail-section">
              <div className="error-box">
                <strong>Erreur d’envoi email.</strong>
                <br />
                {submission.email_last_error}
              </div>
            </div>
          ) : null}

          {query.saved ? (
            <div className="detail-section">
              <div className="success-box">Verdict enregistré et email envoyé.</div>
            </div>
          ) : null}

          {query.error ? (
            <div className="detail-section">
              <div className="error-box">
                Le verdict a été enregistré si possible, mais l’envoi de l’email a échoué.
              </div>
            </div>
          ) : null}

          <div className="detail-section">
            <h2>Liens</h2>
            {urls.length > 0 ? (
              <pre className="content-box">{urls.join("\n")}</pre>
            ) : (
              <p className="admin-muted">Aucun lien transmis.</p>
            )}
          </div>

          <div className="detail-section">
            <h2>Texte transmis</h2>
            {submission.submitted_text ? (
              <pre className="content-box">{submission.submitted_text}</pre>
            ) : (
              <p className="admin-muted">Aucun texte transmis.</p>
            )}
          </div>

          <div className="detail-section">
            <h2>Contexte</h2>
            {submission.context ? (
              <pre className="content-box">{submission.context}</pre>
            ) : (
              <p className="admin-muted">Aucun contexte ajouté.</p>
            )}
          </div>

          <div className="detail-section">
            <h2>Fichiers</h2>
            {assets.length > 0 ? (
              <ul className="asset-list">
                {assets.map((asset) => (
                  <li key={asset.id}>
                    <span>
                      <strong>{asset.file_name}</strong>
                      <span className="asset-meta">
                        {asset.content_type} · {formatBytes(asset.size_bytes)}
                      </span>
                    </span>
                    <a className="secondary-button" download href={asset.signedUrl}>
                      Télécharger
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-muted">Aucun fichier transmis.</p>
            )}
          </div>
        </section>

        <aside className="panel">
          <form
            className="detail-section form-stack"
            action={`/api/admin/submissions/${submission.id}/verdict`}
            method="post"
          >
            <div>
              <p className="eyebrow">Verdict</p>
              <h2>Répondre au visiteur</h2>
            </div>

            <div className="field">
              <label htmlFor="verdict">Catégorie</label>
              <select
                className="select"
                defaultValue={submission.verdict ?? "suspicious"}
                id="verdict"
                name="verdict"
                required
              >
                {verdicts.map((verdict) => (
                  <option key={verdict} value={verdict}>
                    {verdictCopy[verdict].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="explanation">Explication</label>
              <textarea
                className="textarea"
                defaultValue={submission.verdict_explanation ?? ""}
                id="explanation"
                maxLength={2_000}
                name="explanation"
                placeholder="Observations concrètes, sans jargon inutile."
                rows={8}
              />
            </div>

            <div className="notice-box">
              L’email doit rester prudent et ne pas présenter l’avis comme une garantie absolue.
            </div>

            <button className="button" type="submit">
              Enregistrer et envoyer
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}

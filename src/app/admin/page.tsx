import Link from "next/link";

import { requireAdminSession } from "@/lib/admin-auth";
import { statusCopy, verdictCopy } from "@/lib/domain";
import { listSubmissions } from "@/lib/submissions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminPage() {
  await requireAdminSession();
  const submissions = await listSubmissions();

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <Link className="brand" href="/admin">
            <span className="brand-mark">AP</span>
            <span>Anti-Phishing</span>
          </Link>
          <p className="admin-muted" style={{ margin: "10px 0 0" }}>
            Revue des demandes reçues
          </p>
        </div>
        <form action="/api/admin/logout" method="post">
          <button className="secondary-button" type="submit">
            Déconnexion
          </button>
        </form>
      </header>

      <section className="panel">
        <div className="detail-section">
          <h1 className="admin-title" style={{ fontSize: "2rem" }}>
            Demandes
          </h1>
          <p className="admin-muted" style={{ margin: 0 }}>
            {submissions.length} demande{submissions.length > 1 ? "s" : ""} affichée
            {submissions.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Statut</th>
                <th>Email</th>
                <th>Verdict</th>
                <th>Reçue</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td>{submission.public_reference}</td>
                  <td>
                    <span className={`status-pill ${submission.status}`}>
                      {statusCopy[submission.status]}
                    </span>
                  </td>
                  <td>{submission.response_email}</td>
                  <td>{submission.verdict ? verdictCopy[submission.verdict].label : "—"}</td>
                  <td>{formatDate(submission.created_at)}</td>
                  <td>
                    <Link className="secondary-button" href={`/admin/submissions/${submission.id}`}>
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6}>Aucune demande pour le moment.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

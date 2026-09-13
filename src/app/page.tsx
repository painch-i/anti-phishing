import Link from "next/link";

import { SubmissionForm } from "@/components/SubmissionForm";

export default function HomePage() {
  return (
    <div className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">AP</span>
          <span>Anti-Phishing</span>
        </Link>
        <Link className="header-link" href="/admin/login">
          Espace opérateur
        </Link>
      </header>

      <main className="main-grid">
        <section className="intro-panel" aria-labelledby="page-title">
          <p className="eyebrow">Avant de cliquer, payer ou répondre</p>
          <h1 id="page-title">Recevez un avis clair sur un contenu suspect.</h1>
          <p className="lede">
            Transmettez un email, message, lien, document ou capture d’écran. Un opérateur examine les
            éléments et vous répond par email avec un verdict prudent: légitime, suspect ou probable
            phishing.
          </p>

          <div className="principles" aria-label="Principes du service">
            <div className="principle">
              <span className="signal-dot teal" aria-hidden="true" />
              <div>
                <strong>Simple</strong>
                <span>Aucun compte à créer, seulement votre email de réponse.</span>
              </div>
            </div>
            <div className="principle">
              <span className="signal-dot amber" aria-hidden="true" />
              <div>
                <strong>Prudent</strong>
                <span>L’avis ne prétend pas certifier qu’un contenu est sûr à 100%.</span>
              </div>
            </div>
            <div className="principle">
              <span className="signal-dot rose" aria-hidden="true" />
              <div>
                <strong>Privé</strong>
                <span>Les demandes ne sont pas publiées et ne sont pas accessibles aux autres visiteurs.</span>
              </div>
            </div>
          </div>
        </section>

        <div id="demande"><SubmissionForm /></div>
      </main>

      <footer className="site-footer">
        Anti-Phishing fournit un point de contrôle humain. En cas de doute fort, contactez directement
        l’organisation supposée par un canal officiel.
      </footer>
    </div>
  );
}

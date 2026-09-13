import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  const params = await searchParams;

  return (
    <main className="login-shell">
      <form className="panel login-panel form-stack" action="/api/admin/login" method="post">
        <div>
          <Link className="brand" href="/">
            <span className="brand-mark">AP</span>
            <span>Anti-Phishing</span>
          </Link>
        </div>

        <div>
          <p className="eyebrow">Espace opérateur</p>
          <h1 style={{ fontSize: "2rem" }}>Connexion</h1>
        </div>

        {params.error ? (
          <div className="error-box">Identifiants invalides ou session expirée.</div>
        ) : null}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input className="input" id="email" name="email" required type="email" />
        </div>

        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input className="input" id="password" name="password" required type="password" />
        </div>

        <button className="button" type="submit">
          Se connecter
        </button>
      </form>
    </main>
  );
}

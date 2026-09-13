import Link from "next/link";
import type { ReactNode } from "react";

import { SubmissionForm } from "@/components/SubmissionForm";

export type VerificationPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  contentLabel: string;
  contentHint: string;
  guidance: ReactNode;
  questions: { question: string; answer: string }[];
};

export function VerificationPage({ eyebrow, title, description, contentLabel, contentHint, guidance, questions }: VerificationPageProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }))
  };

  return <div className="page-shell">
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">AP</span><span>Anti-Phishing</span></Link><Link className="header-link" href="/">Retour à l’accueil</Link></header>
    <main className="verification-main">
      <section className="verification-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p></section>
      <div className="verification-grid"><div className="verification-guidance"><h2>Que transmettre ?</h2><p>{guidance}</p><ul><li>{contentLabel}</li><li>Le contexte : ce qu’on vous demande et pourquoi</li><li>Une capture d’écran ou un fichier si nécessaire</li></ul><div className="notice-box">Ne cliquez pas sur le lien et n’ouvrez pas la pièce jointe avant la vérification.</div></div><div><SubmissionForm contentLabel={contentLabel} contentHint={contentHint} /></div></div>
      <section className="marketing-section faq-section"><p className="eyebrow">Questions fréquentes</p>{questions.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    </main>
    <footer className="site-footer">Anti-Phishing fournit un avis humain prudent. En cas de doute fort, contactez l’organisation par un canal officiel.</footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </div>;
}

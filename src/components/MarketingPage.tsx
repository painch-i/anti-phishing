import Link from "next/link";
import type { ReactNode } from "react";

export type MarketingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  audience: string;
  useCases: string[];
  faq: { question: string; answer: string }[];
  children?: ReactNode;
};

export function MarketingPage({ eyebrow, title, description, audience, useCases, faq, children }: MarketingPageProps) {
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(({ question, answer }) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) };
  return <div className="page-shell">
    <header className="site-header"><Link className="brand" href="/"><span className="brand-mark">AP</span><span>Anti-Phishing</span></Link><nav className="marketing-nav" aria-label="Navigation principale"><Link href="/pour-les-particuliers">Particuliers</Link><Link href="/pour-les-entreprises">Entreprises</Link><Link href="/pour-les-institutions">Institutions</Link></nav></header>
    <main className="marketing-main">
      <section className="marketing-hero"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p><Link className="button marketing-cta" href="/#demande">Faire vérifier un contenu</Link></div><div className="audience-card"><p className="eyebrow">Pour {audience}</p><h2>Un doute concret, une réponse exploitable.</h2><p>Transmettez les éléments disponibles. Vous recevez un avis humain, prudent et compréhensible par email.</p></div></section>
      {children}
      <section className="marketing-section"><p className="eyebrow">Cas d’usage</p><h2>Quand utiliser Anti-Phishing ?</h2><div className="use-case-grid">{useCases.map((item) => <div className="use-case" key={item}><span className="signal-dot teal" aria-hidden="true" /><p>{item}</p></div>)}</div></section>
      <section className="marketing-section faq-section"><p className="eyebrow">Questions fréquentes</p><h2>Comprendre le service</h2>{faq.map(({ question, answer }) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
    </main>
    <footer className="site-footer"><Link href="/">Vérifier un contenu suspect</Link><span> · </span>Un point de contrôle humain, pas une certification absolue.</footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  </div>;
}

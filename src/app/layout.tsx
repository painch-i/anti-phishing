import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Anti-Phishing | Vérifiez un message ou un lien suspect", template: "%s | Anti-Phishing" },
  description: "Faites vérifier un email, SMS, lien ou document suspect par un opérateur et recevez un avis clair par email.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "fr_FR", siteName: "Anti-Phishing", title: "Vérifiez un contenu suspect avant d'agir", description: "Un point de contrôle humain pour savoir si un email, lien, SMS ou document ressemble à une tentative de phishing." },
  robots: { index: true, follow: true }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}

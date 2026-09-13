import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Anti-Phishing",
  description: "Envoyez un contenu suspect et recevez un avis clair par email."
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

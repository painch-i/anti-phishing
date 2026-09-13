import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return ["/", "/verifier-email", "/verifier-sms", "/verifier-lien", "/verifier-document", "/apres-clic-lien-suspect", "/pour-les-particuliers", "/pour-les-entreprises", "/pour-les-institutions"].map((path) => ({
    url: `${baseUrl}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.8
  }));
}

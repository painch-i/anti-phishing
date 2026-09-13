export const submissionStatuses = ["received", "reviewed"] as const;
export type SubmissionStatus = (typeof submissionStatuses)[number];

export const verdicts = ["legitimate", "suspicious", "likely_phishing"] as const;
export type Verdict = (typeof verdicts)[number];

export type VerdictCopy = {
  label: string;
  emailSubject: string;
  summary: string;
};

export const verdictCopy: Record<Verdict, VerdictCopy> = {
  legitimate: {
    label: "Semble légitime",
    emailSubject: "Avis Anti-Phishing: le contenu semble légitime",
    summary:
      "Les éléments transmis ne montrent pas de signe significatif de phishing ou de fraude d'après les informations disponibles."
  },
  suspicious: {
    label: "Suspect",
    emailSubject: "Avis Anti-Phishing: prudence recommandée",
    summary:
      "Les éléments transmis comportent des signaux d'alerte ou ne permettent pas de conclure avec suffisamment de confiance."
  },
  likely_phishing: {
    label: "Probable phishing",
    emailSubject: "Avis Anti-Phishing: le contenu ressemble à du phishing",
    summary:
      "Les éléments transmis présentent des indicateurs suffisamment forts pour être traités comme une tentative probable de phishing ou de fraude."
  }
};

export const statusCopy: Record<SubmissionStatus, string> = {
  received: "En attente de revue",
  reviewed: "Revue terminée"
};

"use client";

import { Send, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_FILES,
  MAX_FILE_SIZE_BYTES,
  MAX_TOTAL_FILE_SIZE_BYTES,
  MAX_URLS,
  formatBytes
} from "@/lib/submission-constraints";
import type { ValidationErrors } from "@/lib/submission-validation";

type SubmissionSuccess = {
  ok: true;
  reference: string;
};

type SubmissionFailure = {
  ok: false;
  message: string;
  errors?: ValidationErrors;
};

type SubmissionResponse = SubmissionSuccess | SubmissionFailure;

function fieldError(errors: ValidationErrors | undefined, field: string) {
  const messages = errors?.[field];

  if (!messages?.length) {
    return null;
  }

  return <p className="field-error">{messages.join(" ")}</p>;
}

export function SubmissionForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<SubmissionResponse | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setResponse(null);

    try {
      const formData = new FormData(event.currentTarget);
      const apiResponse = await fetch("/api/submissions", {
        method: "POST",
        body: formData
      });
      const payload = (await apiResponse.json()) as SubmissionResponse;

      setResponse(payload);

      if (payload.ok) {
        formRef.current?.reset();
      }
    } catch {
      setResponse({
        ok: false,
        message: "La demande n'a pas pu être envoyée. Réessayez dans quelques instants."
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (response?.ok) {
    return (
      <div className="panel submission-panel">
        <div className="success-box">
          <strong>Demande reçue.</strong>
          <br />
          Référence: {response.reference}. L’analyse n’a pas encore été effectuée; la réponse arrivera
          par email après revue.
        </div>
        <div className="button-row" style={{ marginTop: 18 }}>
          <button className="secondary-button" type="button" onClick={() => setResponse(null)}>
            Envoyer une autre demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} className="panel submission-panel form-stack" onSubmit={onSubmit}>
      <div>
        <p className="eyebrow">Demande d’avis</p>
        <h2>Transmettre un contenu suspect</h2>
        <p className="help-text">
          Ajoutez au moins un élément. Les fichiers sont stockés de manière privée et examinés par un
          opérateur de confiance.
        </p>
      </div>

      {response && !response.ok ? (
        <div className="error-box">
          <strong>{response.message}</strong>
          {fieldError(response.errors, "content")}
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="responseEmail">Email de réponse</label>
        <input
          className="input"
          id="responseEmail"
          name="responseEmail"
          placeholder="vous@example.com"
          required
          type="email"
        />
        {fieldError(response && !response.ok ? response.errors : undefined, "responseEmail")}
      </div>

      <div className="field">
        <label htmlFor="urls">Lien suspect</label>
        <textarea
          className="textarea"
          id="urls"
          name="urls"
          placeholder="https://exemple-suspect.test"
          rows={3}
        />
        <small>Un lien par ligne, {MAX_URLS} maximum.</small>
        {fieldError(response && !response.ok ? response.errors : undefined, "urls")}
      </div>

      <div className="field">
        <label htmlFor="submittedText">Texte copié</label>
        <textarea
          className="textarea"
          id="submittedText"
          name="submittedText"
          placeholder="Collez ici un email, SMS ou message suspect."
          rows={6}
        />
        {fieldError(response && !response.ok ? response.errors : undefined, "submittedText")}
      </div>

      <div className="field">
        <span className="field-label">Fichiers</span>
        <label className="file-input" htmlFor="files">
          <UploadCloud aria-hidden="true" size={22} />
          <span>
            Captures, PDF, emails ou documents
            <small>
              {MAX_FILES} fichiers, {formatBytes(MAX_FILE_SIZE_BYTES)} par fichier,{" "}
              {formatBytes(MAX_TOTAL_FILE_SIZE_BYTES)} au total.
            </small>
          </span>
        </label>
        <input
          accept={ACCEPTED_FILE_EXTENSIONS.join(",")}
          id="files"
          multiple
          name="files"
          type="file"
        />
        {fieldError(response && !response.ok ? response.errors : undefined, "files")}
      </div>

      <div className="field">
        <label htmlFor="context">Contexte</label>
        <textarea
          className="textarea"
          id="context"
          name="context"
          placeholder="Ce qu’on vous demande de faire, pourquoi cela vous semble étrange..."
          rows={4}
        />
        {fieldError(response && !response.ok ? response.errors : undefined, "context")}
      </div>

      <div className="notice-box">
        Ne cliquez pas sur les liens suspects et n’ouvrez pas de pièce jointe douteuse en attendant le
        retour.
      </div>

      <div className="button-row">
        <button className="button" disabled={isSubmitting} type="submit">
          <Send aria-hidden="true" size={18} />
          {isSubmitting ? "Envoi en cours" : "Envoyer la demande"}
        </button>
      </div>
    </form>
  );
}

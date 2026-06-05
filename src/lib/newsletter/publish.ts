import { renderMarkdown } from '../markdown';
import { buildEmailHtml } from '../newsletter-email';
import type { OutgoingEmail, SendResult } from '../resend';

/** Port de persistance des éditions newsletter (destinataires + historique). */
export interface NewsletterStore {
  listOptInRecipients(): Promise<{ id: string; email: string }[]>;
  recordEdition(edition: { subject: string; body_html: string; sent_at: string | null }): Promise<void>;
}

/** Port d'envoi des emails. */
export interface Mailer {
  send(emails: OutgoingEmail[]): Promise<SendResult>;
}

export type PublishResult =
  | { kind: 'no-recipients' }
  | { kind: 'sent'; sent: number; failed: number };

type EditionInput = { subject: string; markdown: string };

function renderOrThrow({ subject, markdown }: EditionInput): { subject: string; body_html: string } {
  const trimmed = subject.trim();
  if (!trimmed) throw new Error('sujet requis');
  return { subject: trimmed, body_html: renderMarkdown(markdown) };
}

/** Enregistre une édition en brouillon (sent_at null). */
export async function saveEditionDraft(
  input: EditionInput,
  deps: { store: NewsletterStore },
): Promise<void> {
  const { subject, body_html } = renderOrThrow(input);
  await deps.store.recordEdition({ subject, body_html, sent_at: null });
}

/**
 * Orchestre l'envoi d'une édition : rend le markdown, récupère les inscrits,
 * compose un email par destinataire, envoie via le mailer, puis historise.
 * Store et mailer sont injectés → testable avec des adapters en mémoire.
 */
export async function publishEdition(
  input: EditionInput,
  deps: { store: NewsletterStore; mailer: Mailer; now?: () => Date },
): Promise<PublishResult> {
  const { subject, body_html } = renderOrThrow(input);

  const recipients = await deps.store.listOptInRecipients();
  if (recipients.length === 0) return { kind: 'no-recipients' };

  const emails: OutgoingEmail[] = recipients.map((r) => ({
    to: r.email,
    subject,
    html: buildEmailHtml(body_html, r.id),
  }));
  const { sent, failed } = await deps.mailer.send(emails);

  const now = deps.now ?? (() => new Date());
  await deps.store.recordEdition({ subject, body_html, sent_at: now().toISOString() });

  return { kind: 'sent', sent, failed };
}

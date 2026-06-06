import { Resend } from 'resend';
import { env } from './env/server';

export function getResend(): Resend {
  return new Resend(env.RESEND_API_KEY);
}

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
}

export interface SendResult {
  sent: number;
  failed: number;
}

/** Envoie une liste d'emails par lots de 100 (batch Resend). Un échec n'interrompt pas. */
export async function sendBatch(emails: OutgoingEmail[]): Promise<SendResult> {
  const from = env.NEWSLETTER_FROM;
  const resend = getResend();
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100);
    try {
      const { error } = await resend.batch.send(
        chunk.map((e) => ({ from, to: e.to, subject: e.subject, html: e.html })),
      );
      if (error) {
        failed += chunk.length;
        console.error('Resend batch error:', error);
      } else {
        sent += chunk.length;
      }
    } catch (err) {
      failed += chunk.length;
      console.error('Resend batch exception:', err);
    }
  }
  return { sent, failed };
}

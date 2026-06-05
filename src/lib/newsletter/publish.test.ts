import { describe, it, expect, beforeAll } from 'vitest';
import { publishEdition, saveEditionDraft, type NewsletterStore, type Mailer } from './publish';
import type { OutgoingEmail } from '../resend';

beforeAll(() => {
  process.env.NEWSLETTER_UNSUBSCRIBE_SECRET = 'secret-de-test';
  process.env.NEXT_PUBLIC_SITE_URL = 'https://site.test';
});

type RecordedEdition = { subject: string; body_html: string; sent_at: string | null };

function fakeStore(recipients: { id: string; email: string }[]) {
  const recorded: RecordedEdition[] = [];
  const store: NewsletterStore = {
    async listOptInRecipients() {
      return recipients;
    },
    async recordEdition(e) {
      recorded.push(e);
    },
  };
  return { store, recorded };
}

function fakeMailer(result = { sent: 0, failed: 0 }) {
  const calls: OutgoingEmail[][] = [];
  const mailer: Mailer = {
    async send(emails) {
      calls.push(emails);
      return result;
    },
  };
  return { mailer, calls };
}

describe('saveEditionDraft', () => {
  it('sujet vide → throw "sujet requis"', async () => {
    const { store } = fakeStore([]);
    await expect(saveEditionDraft({ subject: '  ', markdown: 'x' }, { store })).rejects.toThrow(
      'sujet requis',
    );
  });

  it('enregistre un brouillon (sent_at null) avec le markdown rendu en HTML', async () => {
    const { store, recorded } = fakeStore([]);
    await saveEditionDraft({ subject: 'Hello', markdown: '# Titre' }, { store });
    expect(recorded).toHaveLength(1);
    expect(recorded[0].subject).toBe('Hello');
    expect(recorded[0].sent_at).toBeNull();
    expect(recorded[0].body_html).toContain('<h1>Titre</h1>');
  });
});

describe('publishEdition', () => {
  it('sujet vide → throw "sujet requis"', async () => {
    const { store } = fakeStore([{ id: 'u1', email: 'a@b.fr' }]);
    const { mailer } = fakeMailer();
    await expect(
      publishEdition({ subject: '', markdown: 'x' }, { store, mailer }),
    ).rejects.toThrow('sujet requis');
  });

  it('aucun inscrit → no-recipients, pas d’envoi ni d’édition enregistrée', async () => {
    const { store, recorded } = fakeStore([]);
    const { mailer, calls } = fakeMailer();
    const res = await publishEdition({ subject: 'S', markdown: 'corps' }, { store, mailer });
    expect(res).toEqual({ kind: 'no-recipients' });
    expect(calls).toHaveLength(0);
    expect(recorded).toHaveLength(0);
  });

  it('avec inscrits → un email par destinataire, retourne sent/failed du mailer', async () => {
    const { store } = fakeStore([
      { id: 'u1', email: 'a@b.fr' },
      { id: 'u2', email: 'c@d.fr' },
    ]);
    const { mailer, calls } = fakeMailer({ sent: 2, failed: 0 });
    const res = await publishEdition({ subject: 'Sujet', markdown: '**gras**' }, { store, mailer });

    expect(res).toEqual({ kind: 'sent', sent: 2, failed: 0 });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toHaveLength(2);
    expect(calls[0].map((e) => e.to)).toEqual(['a@b.fr', 'c@d.fr']);
    expect(calls[0][0].subject).toBe('Sujet');
    expect(calls[0][0].html).toContain('<strong>gras</strong>');
    expect(calls[0][0].html).toContain('/api/newsletter/unsubscribe?token=u1.');
  });

  it('enregistre l’édition avec sent_at horodaté après envoi', async () => {
    const { store, recorded } = fakeStore([{ id: 'u1', email: 'a@b.fr' }]);
    const { mailer } = fakeMailer({ sent: 1, failed: 0 });
    const now = () => new Date('2026-06-05T12:00:00.000Z');
    await publishEdition({ subject: 'S', markdown: 'x' }, { store, mailer, now });
    expect(recorded).toHaveLength(1);
    expect(recorded[0].sent_at).toBe('2026-06-05T12:00:00.000Z');
  });
});

import { marked } from 'marked';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Markdown -> HTML. Le HTML brut de la source est échappé (anti-injection). */
export function renderMarkdown(md: string): string {
  // marked.parse est synchrone quand async:false (défaut).
  return marked.parse(escapeHtml(md), { async: false }) as string;
}

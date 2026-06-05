import { describe, it, expect } from 'vitest';
import { renderMarkdown } from './markdown';

describe('renderMarkdown', () => {
  it('rend un titre et un paragraphe', () => {
    const html = renderMarkdown('# Titre\n\nUn paragraphe.');
    expect(html).toContain('<h1>Titre</h1>');
    expect(html).toContain('<p>Un paragraphe.</p>');
  });

  it('rend une liste et un lien', () => {
    const html = renderMarkdown('- a\n- b\n\n[lien](https://ex.fr)');
    expect(html).toContain('<li>a</li>');
    expect(html).toContain('href="https://ex.fr"');
  });

  it('échappe le HTML brut injecté', () => {
    const html = renderMarkdown('Bonjour <script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });
});

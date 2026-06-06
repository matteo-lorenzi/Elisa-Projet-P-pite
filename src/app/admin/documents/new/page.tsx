import Link from 'next/link';
import {
  Banner,
  Button,
  CheckboxField,
  SelectField,
  TextField,
  TextareaField,
} from '@/components/ui';
import { createDocument } from '../actions';

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <Link
        href="/admin/documents"
        className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span aria-hidden="true">←</span> Documents
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance">
        Nouveau document
      </h1>

      {error && (
        <Banner tone="danger" className="mt-6">
          {error}
        </Banner>
      )}

      <form action={createDocument} className="mt-8 flex max-w-xl flex-col gap-5">
        <TextField name="title" label="Titre" required placeholder="Intitulé du document" />
        <TextareaField
          name="description"
          label="Description"
          rows={3}
          placeholder="Ce que le document explique, en une ou deux phrases."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="author" label="Auteur" placeholder="Nom de l’auteur" />
          <TextField name="category" label="Catégorie" placeholder="Baux, succession…" />
        </div>
        <TextField
          name="tags"
          label="Tags"
          hint="Séparés par des virgules."
          placeholder="bail, préemption, durée"
        />
        <SelectField name="type" label="Type">
          <option value="pdf">PDF</option>
          <option value="schema">Schéma (image)</option>
        </SelectField>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="file" className="text-sm font-medium text-foreground">
            Fichier
          </label>
          <input
            id="file"
            name="file"
            type="file"
            required
            className="w-full rounded-[var(--radius)] border border-border bg-background text-foreground transition file:mr-3 file:cursor-pointer file:border-0 file:bg-surface file:px-4 file:py-2 file:font-medium file:text-foreground hover:file:bg-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          />
        </div>

        <CheckboxField name="is_premium" label="Réserver aux abonnés (premium)" />

        <Button type="submit" className="self-start">
          Publier
        </Button>
      </form>
    </div>
  );
}

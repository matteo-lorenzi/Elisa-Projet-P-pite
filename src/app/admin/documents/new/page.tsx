import { createDocument } from '../actions';

export default async function NewDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div>
      <h1 className="text-xl font-bold">Nouveau document</h1>
      {error && <p className="mt-2 text-red-600">{error}</p>}
      <form action={createDocument} className="mt-4 flex flex-col gap-3">
        <input name="title" required placeholder="Titre" className="border p-2 rounded" />
        <textarea name="description" placeholder="Description" className="border p-2 rounded" />
        <input name="author" placeholder="Auteur" className="border p-2 rounded" />
        <input name="category" placeholder="Catégorie" className="border p-2 rounded" />
        <input name="tags" placeholder="Tags (séparés par des virgules)" className="border p-2 rounded" />
        <select name="type" className="border p-2 rounded">
          <option value="pdf">PDF</option>
          <option value="schema">Schéma (image)</option>
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_premium" /> Premium
        </label>
        <input type="file" name="file" required className="border p-2 rounded" />
        <button className="bg-black text-white p-2 rounded">Publier</button>
      </form>
    </div>
  );
}

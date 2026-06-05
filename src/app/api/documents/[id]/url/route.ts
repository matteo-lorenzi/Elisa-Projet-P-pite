import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/admin';
import { getViewer } from '@/lib/auth/viewer';
import { canViewDocumentFile } from '@/lib/access';
import type { DocumentRow } from '@/lib/supabase/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const viewer = await getViewer(supabase);
  if (!viewer) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: doc } = await supabase
    .from('documents').select('*').eq('id', id).single();

  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const allowed = canViewDocumentFile(viewer.profile, viewer.subscription, doc as DocumentRow);
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // service role : génère l'URL signée sur le bucket privé
  const admin = createServiceRoleClient();
  const bucket = (doc as DocumentRow).is_premium ? 'documents-premium' : 'documents-free';
  const path = (doc as DocumentRow).storage_path;
  const { data: signed, error } = await admin.storage.from(bucket).createSignedUrl(path, 60);
  if (error || !signed) {
    // Cas le plus courant : le fichier n'existe pas dans le bucket (métadonnées
    // créées sans upload, ex. seed de démo). On renvoie 404 plutôt qu'un 500 opaque.
    return NextResponse.json(
      { error: 'file not found in storage', detail: error?.message },
      { status: 404 },
    );
  }
  return NextResponse.json({ url: signed.signedUrl });
}

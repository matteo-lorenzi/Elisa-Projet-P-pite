import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { canViewDocumentFile } from '@/lib/access';
import type { Profile, SubscriptionRow, DocumentRow } from '@/lib/supabase/types';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single();
  const { data: subscription } = await supabase
    .from('subscriptions').select('*').eq('user_id', user.id).maybeSingle();
  const { data: doc } = await supabase
    .from('documents').select('*').eq('id', id).single();

  if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const allowed = canViewDocumentFile(
    profile as Profile,
    subscription as SubscriptionRow | null,
    doc as DocumentRow,
  );
  if (!allowed) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  // service role : génère l'URL signée sur le bucket privé
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
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

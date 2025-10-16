import { NextRequest, NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import supabaseAdmin from '@/lib/supabaseAdmin';

function extractPath(url: string, bucket: string) {
  const marker = `/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const supabase = supabaseRoute();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data: proj, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Supprimer fichiers storage si possible
  try {
    if (proj.input_image_url) {
      const p = extractPath(proj.input_image_url, process.env.SUPABASE_INPUT_BUCKET || 'input-images');
      if (p) await supabaseAdmin.storage.from(process.env.SUPABASE_INPUT_BUCKET || 'input-images').remove([p]);
    }
    if (proj.output_image_url) {
      const p = extractPath(proj.output_image_url, process.env.SUPABASE_OUTPUT_BUCKET || 'output-images');
      if (p) await supabaseAdmin.storage.from(process.env.SUPABASE_OUTPUT_BUCKET || 'output-images').remove([p]);
    }
  } catch (e) {
    // continue even if storage deletion fails
  }

  const del = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);
  if (del.error) return NextResponse.json({ error: del.error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

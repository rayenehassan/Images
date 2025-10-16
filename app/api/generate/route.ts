import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { replicate } from '@/lib/replicate';
import { supabaseRoute } from '@/lib/supabaseServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INPUT_BUCKET = process.env.SUPABASE_INPUT_BUCKET || 'input-images';
const OUTPUT_BUCKET = process.env.SUPABASE_OUTPUT_BUCKET || 'output-images';
// Replicate expects a spec like "owner/model" or "owner/model:version"
const MODEL = (process.env.REPLICATE_MODEL || 'google/nano-banana') as
  `${string}/${string}` | `${string}/${string}:${string}`;

export async function POST(request: Request) {
  try {
    const supabaseUser = supabaseRoute();
    const { data: { session } } = await supabaseUser.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const userId = session.user.id;

    // Vérifier abonnement/quota
    const subRes = await supabaseUser
      .from('subscriptions')
      .select('status, quota_limit, quota_used')
      .eq('user_id', userId)
      .single();
    if (!subRes.data || subRes.error) {
      return NextResponse.json({ error: 'Aucun abonnement actif. Veuillez souscrire.' }, { status: 402 });
    }
    const { status, quota_limit, quota_used } = subRes.data as any;
    if (status !== 'active') {
      return NextResponse.json({ error: 'Abonnement inactif. Veuillez réactiver dans votre compte.' }, { status: 402 });
    }
    if (typeof quota_limit === 'number' && typeof quota_used === 'number' && quota_used >= quota_limit) {
      return NextResponse.json({ error: 'Quota mensuel atteint.' }, { status: 402 });
    }
    const formData = await request.formData();
    const image = formData.get('image');
    const prompt = String(formData.get('prompt') || '').trim();

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: 'Image manquante.' }, { status: 400 });
    }
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt manquant.' }, { status: 400 });
    }

    const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

    // Upload de l'image d’entrée dans Supabase Storage
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = image.type || 'application/octet-stream';
    const inputPath = `${userId}/input/${id}`;

    const uploadInput = await supabaseAdmin
      .storage
      .from(INPUT_BUCKET)
      .upload(inputPath, buffer, { contentType, upsert: false });

    if (uploadInput.error) {
      console.error('Erreur upload input:', uploadInput.error);
      return NextResponse.json({ error: "Échec upload image d’entrée." }, { status: 500 });
    }

    const storageRef = supabaseAdmin.storage.from(INPUT_BUCKET);
    const publicInput = storageRef.getPublicUrl(inputPath);
    const signed = await storageRef.createSignedUrl(inputPath, 60 * 60);
    const inputImageUrl = signed.data?.signedUrl || publicInput.data.publicUrl;

    // Génération via Replicate
    let generatedImageUrl: string | null = null;
    if (process.env.REPLICATE_MOCK === '1') {
      generatedImageUrl = inputImageUrl;
    } else {
      // Appel conforme au modèle bytedance/seedream-4
      const replicateInput: Record<string, any> = {
        prompt,
        image_input: [inputImageUrl],
        size: '2K',
        width: 2048,
        height: 2048,
        max_images: 1,
        aspect_ratio: '4:3',
        sequential_image_generation: 'disabled',
      };

      let output: any;
      try {
        output = await replicate.run(
          MODEL as `${string}/${string}` | `${string}/${string}:${string}`,
          { input: replicateInput } as any
        );
      } catch (e: any) {
        const msg = String(e?.message || 'Erreur Replicate');
        if (msg.includes('402') || msg.toLowerCase().includes('insufficient credit')) {
          return NextResponse.json(
            { error: 'Crédits Replicate insuffisants. Ajoutez du crédit (prépayé): https://replicate.com/account/billing' },
            { status: 402 }
          );
        }
        if (msg.includes('422') || msg.toLowerCase().includes('unprocessable')) {
          return NextResponse.json(
            { error: 'Paramètres invalides (422) pour google/nano-banana. Assurez-vous que prompt et image_input sont fournis.' },
            { status: 422 }
          );
        }
        throw e;
      }

      if (output && typeof (output as any).url === 'function') {
        try {
          generatedImageUrl = (output as any).url();
        } catch {}
      }
      if (!generatedImageUrl && Array.isArray(output)) {
        for (const v of output) {
          if (!generatedImageUrl && v && typeof (v as any).url === 'function') {
            try { generatedImageUrl = (v as any).url(); } catch {}
          }
          if (!generatedImageUrl && typeof v === 'string' && v.startsWith('http')) generatedImageUrl = v;
          if (!generatedImageUrl && v && typeof v === 'object') {
            const c = (v as any).image || (v as any).url || (v as any).output;
            if (typeof c === 'string' && c.startsWith('http')) generatedImageUrl = c;
          }
        }
      } else if (!generatedImageUrl && typeof output === 'string' && output.startsWith('http')) {
        generatedImageUrl = output;
      } else if (!generatedImageUrl && output && typeof output === 'object') {
        const candidate = (output as any).image || (output as any).url || (output as any).output;
        if (typeof candidate === 'string' && candidate.startsWith('http')) generatedImageUrl = candidate;
        if (!generatedImageUrl && Array.isArray(candidate)) {
          const last = candidate.filter((x: any) => typeof x === 'string' && x.startsWith('http')).pop();
          if (last) generatedImageUrl = last;
        }
      }
    }

    if (!generatedImageUrl) {
      return NextResponse.json({ error: 'Aucune image générée par le modèle.' }, { status: 500 });
    }

    // Téléchargement de l'image générée
    const genRes = await fetch(generatedImageUrl);
    if (!genRes.ok) {
      return NextResponse.json({ error: 'Échec du téléchargement de l’image générée.' }, { status: 502 });
    }
    const genArrayBuffer = await genRes.arrayBuffer();
    const genBuffer = Buffer.from(genArrayBuffer);
    const outContentType = genRes.headers.get('content-type') || 'image/png';
    const outExt = outContentType.split('/')[1]?.split(';')[0] || 'png';
    const outputPath = `${userId}/output/${id}.${outExt}`;

    const uploadOutput = await supabaseAdmin
      .storage
      .from(OUTPUT_BUCKET)
      .upload(outputPath, genBuffer, { contentType: outContentType, upsert: false });

    if (uploadOutput.error) {
      console.error('Erreur upload output:', uploadOutput.error);
      return NextResponse.json({ error: 'Échec upload image générée.' }, { status: 500 });
    }

    const storageOut = supabaseAdmin.storage.from(OUTPUT_BUCKET);
    const outputSigned = await storageOut.createSignedUrl(outputPath, 3600);
    const outputImageUrl = outputSigned.data?.signedUrl || '';

    // Sauvegarde en base, côté user (RLS)
    const insert = await supabaseUser
      .from('projects')
      .insert({ input_image_url: inputImageUrl, output_image_url: outputImageUrl, prompt, status: 'completed', user_id: session.user.id })
      .select()
      .single();

    if (insert.error) {
      console.error('Erreur insert DB:', insert.error);
    }

    // Incrémenter quota
    await supabaseUser
      .from('subscriptions')
      .update({ quota_used: (quota_used ?? 0) + 1 })
      .eq('user_id', userId);

    return NextResponse.json({ outputImageUrl });
  } catch (err: any) {
    console.error(err);
    const message = process.env.NODE_ENV !== 'production'
      ? (err?.message || 'Erreur interne.')
      : 'Erreur interne.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

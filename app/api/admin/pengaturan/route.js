import {revalidatePath} from 'next/cache';
import {NextResponse} from 'next/server';
import {pastikanAdmin} from '../../../../lib/autentikasi';

export const runtime = 'nodejs';

function periksaUrl(nilai) {
  const s = typeof nilai === 'string' ? nilai.trim().slice(0, 300) : '';
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol === 'https:' || u.protocol === 'http:') return s;
  } catch {}
  return null;
}

export async function GET() {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  return NextResponse.json({
    channel_tiktok: cek.pengaturan.channel_tiktok || '',
    channel_youtube: cek.pengaturan.channel_youtube || '',
  });
}

export async function PUT(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({pesan: 'Format tidak valid.'}, {status: 400});
  }

  const tiktok = periksaUrl(body?.channel_tiktok);
  const youtube = periksaUrl(body?.channel_youtube);

  if (tiktok === null || youtube === null) {
    return NextResponse.json({pesan: 'URL profil harus diawali https:// (atau kosongkan).'}, {status: 422});
  }

  const sekarang = new Date().toISOString();
  const {error} = await cek.db.from('pengaturan_admin').upsert(
    [
      {kunci: 'channel_tiktok', nilai: tiktok, diubah_pada: sekarang},
      {kunci: 'channel_youtube', nilai: youtube, diubah_pada: sekarang},
    ],
    {onConflict: 'kunci'}
  );

  if (error) return NextResponse.json({pesan: error.message}, {status: 502});

  revalidatePath('/');
  return NextResponse.json({pesan: 'Tautan channel berhasil disimpan.'});
}

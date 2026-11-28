import {NextResponse} from 'next/server';
import {pastikanAdmin} from '../../../../lib/autentikasi';

export const runtime = 'nodejs';

const STATUS_SAH = new Set(['baru', 'dibaca', 'dipilih', 'sudah-jadi-video', 'ditolak']);

export async function GET(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  const {searchParams} = new URL(req.url);
  const status = searchParams.get('status');

  let kueri = cek.db
    .from('kiriman')
    .select('id, dibuat_pada, jenis, judul, nama, isi, kontak, sebut_nama, status, catatan')
    .order('dibuat_pada', {ascending: false})
    .limit(250);

  if (status && STATUS_SAH.has(status)) {
    kueri = kueri.eq('status', status);
  }

  const {data, error} = await kueri;
  if (error) {
    console.error('Supabase (ambil kiriman):', error.message);
    return NextResponse.json({pesan: `Gagal memuat kiriman: ${error.message}`}, {status: 502});
  }

  return NextResponse.json({kiriman: data || []});
}

export async function PATCH(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({pesan: 'Format tidak valid.'}, {status: 400});
  }

  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({pesan: 'ID kiriman tidak valid.'}, {status: 400});
  }

  const perubahan = {};
  if (body?.status !== undefined) {
    if (!STATUS_SAH.has(body.status)) {
      return NextResponse.json({pesan: 'Status kiriman tidak dikenali.'}, {status: 422});
    }
    perubahan.status = body.status;
  }
  if (body?.catatan !== undefined) {
    perubahan.catatan = typeof body.catatan === 'string' ? body.catatan.trim().slice(0, 2000) || null : null;
  }

  const {data, error} = await cek.db.from('kiriman').update(perubahan).eq('id', id).select().single();
  if (error) {
    return NextResponse.json(
      {pesan: `Gagal menyimpan perubahan (${error.message}). Pastikan grant update di schema.sql sudah dijalankan.`},
      {status: 502}
    );
  }

  return NextResponse.json({pesan: 'Kiriman diperbarui.', kiriman: data});
}

export async function DELETE(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  const {searchParams} = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({pesan: 'ID kiriman tidak valid.'}, {status: 400});
  }

  const {error} = await cek.db.from('kiriman').delete().eq('id', id);
  if (error) {
    return NextResponse.json(
      {pesan: `Gagal menghapus kiriman (${error.message}).`},
      {status: 502}
    );
  }

  return NextResponse.json({pesan: 'Kiriman dihapus.'});
}

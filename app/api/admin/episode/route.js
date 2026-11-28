import {revalidatePath} from 'next/cache';
import {NextResponse} from 'next/server';
import {pastikanAdmin} from '../../../../lib/autentikasi';
import {EPISODE_BAWAAN} from '../../../../lib/cerita-bawaan';

export const runtime = 'nodejs';

const teks = (v, maks) => (typeof v === 'string' ? v.trim().slice(0, maks) : '');

function buatSlug(masukan) {
  return teks(masukan, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function validasiUrl(u, bolehLokal = false) {
  const s = teks(u, 500);
  if (!s) return '';
  if (bolehLokal && s.startsWith('/') && !s.startsWith('//')) return s;
  try {
    const parsed = new URL(s);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return s;
  } catch {}
  return null;
}

function susunDataEpisode(body) {
  const judul = teks(body?.judul, 140);
  if (judul.length < 2) return {galat: 'Judul episode minimal 2 karakter.'};

  const slug = buatSlug(body?.slug || judul);
  if (slug.length < 2) return {galat: 'Slug tidak valid.'};

  const sampul_url = validasiUrl(body?.sampul_url, true);
  if (sampul_url === null) return {galat: 'URL sampul harus diawali / atau https://'};

  const tiktok_url = validasiUrl(body?.tiktok_url, false);
  if (tiktok_url === null) return {galat: 'Link TikTok harus diawali https://'};

  const youtube_url = validasiUrl(body?.youtube_url, false);
  if (youtube_url === null) return {galat: 'Link YouTube harus diawali https://'};

  const adeganMentah = Array.isArray(body?.adegan) ? body.adegan.slice(0, 6) : [];
  const adegan = [];
  for (const item of adeganMentah) {
    const url = validasiUrl(item?.url, true);
    if (!url) continue;
    adegan.push({
      url,
      alt: teks(item?.alt || judul, 160),
      teks: teks(item?.teks, 220),
    });
  }

  return {
    data: {
      judul,
      slug,
      label_seri: teks(body?.label_seri, 60),
      ringkasan: teks(body?.ringkasan, 600),
      sampul_url,
      tiktok_url,
      youtube_url,
      urutan: Number.isFinite(Number(body?.urutan)) ? Math.trunc(Number(body.urutan)) : 0,
      sorotan: body?.sorotan === true,
      terbit: body?.terbit !== false,
      adegan,
      diubah_pada: new Date().toISOString(),
    },
  };
}

export async function GET() {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  const {data, error} = await cek.db
    .from('episode')
    .select('*')
    .order('urutan', {ascending: false})
    .order('id', {ascending: false});

  if (error) {
    console.error('Supabase (ambil episode):', error.message);
    return NextResponse.json(
      {pesan: `Gagal memuat tabel episode (${error.message}). Pastikan schema.sql terbaru sudah dijalankan.`},
      {status: 502}
    );
  }

  return NextResponse.json({episode: data || []});
}

export async function POST(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({pesan: 'Format tidak dikenali.'}, {status: 400});
  }

  if (body?.aksi === 'muat-bawaan') {
    const baris = EPISODE_BAWAAN.map(({id: _id, ...sisa}) => sisa);
    const {error} = await cek.db.from('episode').upsert(baris, {onConflict: 'slug'});
    if (error) {
      return NextResponse.json({pesan: `Gagal memuat cerita bawaan: ${error.message}`}, {status: 502});
    }
    revalidatePath('/');
    return NextResponse.json({pesan: 'Episode bawaan berhasil dimuat.'});
  }

  const hasil = susunDataEpisode(body);
  if (hasil.galat) return NextResponse.json({pesan: hasil.galat}, {status: 422});

  if (hasil.data.sorotan) {
    await cek.db.from('episode').update({sorotan: false}).eq('sorotan', true);
  }

  const {data, error} = await cek.db.from('episode').insert(hasil.data).select().single();
  if (error) {
    const pesan = error.code === '23505' ? 'Slug sudah dipakai episode lain. Ubah sedikit judul atau slug-nya.' : error.message;
    return NextResponse.json({pesan}, {status: 422});
  }

  revalidatePath('/');
  return NextResponse.json({pesan: 'Episode berhasil ditambahkan.', episode: data}, {status: 201});
}

export async function PATCH(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({pesan: 'Format tidak dikenali.'}, {status: 400});
  }

  const id = Number(body?.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({pesan: 'ID episode tidak valid.'}, {status: 400});
  }

  // Pintasan cepat jadikan sorotan
  if (body?.hanyaSorotan === true) {
    await cek.db.from('episode').update({sorotan: false}).neq('id', id);
    const {error} = await cek.db.from('episode').update({sorotan: true, diubah_pada: new Date().toISOString()}).eq('id', id);
    if (error) return NextResponse.json({pesan: error.message}, {status: 502});
    revalidatePath('/');
    return NextResponse.json({pesan: 'Sorotan halaman utama diperbarui.'});
  }

  const hasil = susunDataEpisode(body);
  if (hasil.galat) return NextResponse.json({pesan: hasil.galat}, {status: 422});

  if (hasil.data.sorotan) {
    await cek.db.from('episode').update({sorotan: false}).neq('id', id);
  }

  const {data, error} = await cek.db.from('episode').update(hasil.data).eq('id', id).select().single();
  if (error) {
    const pesan = error.code === '23505' ? 'Slug sudah dipakai episode lain.' : error.message;
    return NextResponse.json({pesan}, {status: 422});
  }

  revalidatePath('/');
  return NextResponse.json({pesan: 'Perubahan episode disimpan.', episode: data});
}

export async function DELETE(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  const {searchParams} = new URL(req.url);
  const id = Number(searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({pesan: 'ID episode tidak valid.'}, {status: 400});
  }

  const {error} = await cek.db.from('episode').delete().eq('id', id);
  if (error) return NextResponse.json({pesan: error.message}, {status: 502});

  revalidatePath('/');
  return NextResponse.json({pesan: 'Episode dihapus.'});
}

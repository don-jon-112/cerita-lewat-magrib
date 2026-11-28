import {randomBytes} from 'node:crypto';
import {NextResponse} from 'next/server';
import {pastikanAdmin} from '../../../../lib/autentikasi';
import {NAMA_BUCKET} from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const MAKS_UKURAN = 5 * 1024 * 1024; // 5 MB

function deteksiTipeGambar(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return {mime: 'image/jpeg', ext: 'jpg'};
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return {mime: 'image/png', ext: 'png'};
  }
  if (
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return {mime: 'image/webp', ext: 'webp'};
  }
  return null;
}

export async function POST(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({pesan: 'Gagal membaca berkas unggahan.'}, {status: 400});
  }

  const berkas = form.get('berkas');
  if (!berkas || typeof berkas.arrayBuffer !== 'function') {
    return NextResponse.json({pesan: 'Pilih berkas gambar terlebih dulu.'}, {status: 400});
  }

  if (berkas.size > MAKS_UKURAN) {
    return NextResponse.json({pesan: 'Ukuran gambar maksimal 5 MB.'}, {status: 413});
  }

  const buf = Buffer.from(await berkas.arrayBuffer());
  const info = deteksiTipeGambar(buf);
  if (!info) {
    return NextResponse.json(
      {pesan: 'Format harus berupa gambar JPG, PNG, atau WebP.'},
      {status: 415}
    );
  }

  // Pastikan bucket sudah tersedia
  await cek.db.storage.createBucket(NAMA_BUCKET, {
    public: true,
    fileSizeLimit: MAKS_UKURAN,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  }).catch(() => {});

  const tanggal = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const acak = randomBytes(5).toString('hex');
  const jalur = `episode/${tanggal}-${acak}.${info.ext}`;

  const unggah = await cek.db.storage.from(NAMA_BUCKET).upload(jalur, buf, {
    contentType: info.mime,
    cacheControl: '31536000',
    upsert: false,
  });

  if (unggah.error) {
    console.error('Supabase Storage (unggah):', unggah.error.message);
    return NextResponse.json(
      {pesan: `Gagal mengunggah ke Supabase Storage: ${unggah.error.message}`},
      {status: 502}
    );
  }

  const {data: pub} = cek.db.storage.from(NAMA_BUCKET).getPublicUrl(jalur);
  return NextResponse.json({
    pesan: 'Gambar berhasil diunggah.',
    url: pub.publicUrl,
  });
}

import {NextResponse} from 'next/server';
import {
  buatPasswordAcak,
  buatTokenSesi,
  cocokkanPassword,
  hashPassword,
  NAMA_COOKIE,
  opsiCookieSesi,
  pastikanAdmin,
} from '../../../../lib/autentikasi';

export const runtime = 'nodejs';

export async function POST(req) {
  const cek = await pastikanAdmin();
  if (!cek.sah) return NextResponse.json({pesan: cek.pesan}, {status: cek.status});

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({pesan: 'Format tidak valid.'}, {status: 400});
  }

  const sandiSekarang = typeof body?.passwordSekarang === 'string' ? body.passwordSekarang.trim() : '';
  if (!cocokkanPassword(sandiSekarang, cek.pengaturan.password_hash)) {
    return NextResponse.json(
      {pesan: 'Master password saat ini tidak cocok.'},
      {status: 403}
    );
  }

  const mode = body?.mode === 'manual' ? 'manual' : 'acak';
  let passwordBaru = '';

  if (mode === 'manual') {
    passwordBaru = typeof body?.passwordBaru === 'string' ? body.passwordBaru.trim() : '';
    if (passwordBaru.length < 10) {
      return NextResponse.json(
        {pesan: 'Password baru minimal 10 karakter.'},
        {status: 422}
      );
    }
  } else {
    passwordBaru = buatPasswordAcak();
  }

  const hashBaru = hashPassword(passwordBaru);
  const versiBaru = String(Date.now());
  const sekarang = new Date().toISOString();

  const {error} = await cek.db.from('pengaturan_admin').upsert(
    [
      {kunci: 'password_hash', nilai: hashBaru, diubah_pada: sekarang},
      {kunci: 'session_version', nilai: versiBaru, diubah_pada: sekarang},
    ],
    {onConflict: 'kunci'}
  );

  if (error) {
    console.error('Gagal simpan password baru:', error.message);
    return NextResponse.json({pesan: 'Gagal menyimpan password ke Supabase.'}, {status: 502});
  }

  const tokenBaru = buatTokenSesi(versiBaru);
  const res = NextResponse.json({
    pesan: 'Master password berhasil diperbarui. Simpan password baru ini sekarang.',
    passwordBaru,
  });
  if (tokenBaru) res.cookies.set(NAMA_COOKIE, tokenBaru, opsiCookieSesi());
  return res;
}

import {NextResponse} from 'next/server';
import {
  ambilPengaturanMap,
  buatTokenSesi,
  cocokkanPassword,
  NAMA_COOKIE,
  opsiCookieSesi,
  sidikIp,
} from '../../../../lib/autentikasi';
import {bukaDatabase} from '../../../../lib/supabase-admin';

export const runtime = 'nodejs';

const MAKS_GAGAL = 5;
const JENDELA_MS = 15 * 60 * 1000; // 15 menit

export async function POST(req) {
  const db = bukaDatabase();
  if (!db) {
    return NextResponse.json(
      {pesan: 'SUPABASE_URL dan SUPABASE_SECRET_KEY belum diisi di server.'},
      {status: 503}
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({pesan: 'Format permintaan tidak dikenali.'}, {status: 400});
  }

  const password = typeof body?.password === 'string' ? body.password.trim() : '';
  if (!password) {
    return NextResponse.json({pesan: 'Masukkan master password terlebih dulu.'}, {status: 400});
  }

  const ip_hash = sidikIp(req);
  const batasWaktu = new Date(Date.now() - JENDELA_MS).toISOString();

  const hitung = await db
    .from('percobaan_login')
    .select('id', {count: 'exact', head: true})
    .eq('ip_hash', ip_hash)
    .gte('dibuat_pada', batasWaktu);

  if (!hitung.error && (hitung.count ?? 0) >= MAKS_GAGAL) {
    return NextResponse.json(
      {pesan: 'Terlalu banyak percobaan gagal. Coba lagi 15 menit lagi.'},
      {status: 429}
    );
  }

  const pengaturan = await ambilPengaturanMap(db);
  if (!pengaturan.password_hash) {
    return NextResponse.json(
      {
        pesan:
          'Master password belum dibuat di Supabase. Jalankan "npm run admin:password" di folder web terlebih dulu.',
      },
      {status: 503}
    );
  }

  const cocok = cocokkanPassword(password, pengaturan.password_hash);
  if (!cocok) {
    await db.from('percobaan_login').insert({ip_hash});
    return NextResponse.json({pesan: 'Master password salah.'}, {status: 401});
  }

  // Bersihkan catatan gagal untuk IP ini setelah berhasil masuk
  await db.from('percobaan_login').delete().eq('ip_hash', ip_hash);

  const versi = pengaturan.session_version || '1';
  const token = buatTokenSesi(versi);
  if (!token) {
    return NextResponse.json({pesan: 'Gagal membuat sesi admin.'}, {status: 500});
  }

  const res = NextResponse.json({pesan: 'Berhasil masuk.'});
  res.cookies.set(NAMA_COOKIE, token, opsiCookieSesi());
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({pesan: 'Berhasil keluar.'});
  res.cookies.set(NAMA_COOKIE, '', opsiCookieSesi(0));
  return res;
}

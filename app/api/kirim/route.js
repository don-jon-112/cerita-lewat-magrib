import {createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {periksa} from '../../../lib/validasi';
import {MAKS_PER_JAM} from '../../../lib/konfigurasi';

export const runtime = 'nodejs';

const balas = (status, pesan, lain = {}) => Response.json({pesan, ...lain}, {status});

export async function POST(req) {
  if (!req.headers.get('content-type')?.includes('application/json')) return balas(415, 'Format kiriman tidak dikenali.');
  const teks = await req.text();
  if (teks.length > 40_000) return balas(413, 'Kiriman terlalu besar.');
  let masukan;
  try {
    masukan = JSON.parse(teks);
  } catch {
    return balas(400, 'Format kiriman tidak dikenali.');
  }

  // Jebakan bot: kolom tersembunyi harus kosong, dan formulir tidak mungkin selesai dalam 3 detik.
  if (masukan?.situs || !(Number(masukan?.lama_ms) >= 3000)) return balas(400, 'Kiriman ditolak. Coba lagi sebentar.');

  const {data, galat, sah} = periksa(masukan);
  if (!sah) return balas(422, 'Ada isian yang belum pas.', {galat});

  const {SUPABASE_URL, SUPABASE_SECRET_KEY, IP_SALT} = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !IP_SALT) {
    console.error('SUPABASE_URL, SUPABASE_SECRET_KEY, atau IP_SALT belum diisi.');
    return balas(503, 'Formulir belum aktif. Coba lagi nanti.');
  }
  const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {auth: {persistSession: false}});

  // Alamat IP tidak disimpan, hanya sidik jarinya (untuk membatasi spam).
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'tidak-diketahui';
  const ip_hash = createHash('sha256').update(`${IP_SALT}:${ip}`).digest('hex');

  const sejamLalu = new Date(Date.now() - 3600_000).toISOString();
  const hitung = await db.from('kiriman').select('id', {count: 'exact', head: true}).eq('ip_hash', ip_hash).gte('dibuat_pada', sejamLalu);
  if (hitung.error) {
    console.error('Supabase (hitung):', hitung.error.message);
    return balas(502, 'Gagal menyimpan. Coba lagi sebentar.');
  }
  if ((hitung.count ?? 0) >= MAKS_PER_JAM) return balas(429, 'Sudah banyak kiriman dari perangkat ini. Coba lagi satu jam lagi.');

  const {setuju, ...baris} = data;
  const simpan = await db.from('kiriman').insert({...baris, kontak: baris.kontak || null, ip_hash});
  if (simpan.error) {
    console.error('Supabase (simpan):', simpan.error.message);
    return balas(502, 'Gagal menyimpan. Coba lagi sebentar.');
  }
  return balas(201, 'Terkirim.');
}

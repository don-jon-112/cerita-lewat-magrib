import {createHash, createHmac, hkdfSync, randomBytes, scryptSync, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {bukaDatabase} from './supabase-admin';

export const NAMA_COOKIE = 'clm_admin_sesi';
const UMUR_SESI_DETIK = 60 * 60 * 24 * 7; // 7 hari
const ALFABET_SANDI = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export function buatPasswordAcak() {
  // 20 karakter acak dibagi 4 blok (XXXXX-XXXXX-XXXXX-XXXXX), ~116 bit entropi, mudah dibaca & disalin.
  const byte = randomBytes(20);
  const huruf = Array.from(byte, (b) => ALFABET_SANDI[b % ALFABET_SANDI.length]);
  return [
    huruf.slice(0, 5).join(''),
    huruf.slice(5, 10).join(''),
    huruf.slice(10, 15).join(''),
    huruf.slice(15, 20).join(''),
  ].join('-');
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const kunci = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${kunci}`;
}

export function cocokkanPassword(password, tersimpan) {
  if (typeof password !== 'string' || typeof tersimpan !== 'string') return false;
  const bagian = tersimpan.split('$');
  if (bagian.length !== 3 || bagian[0] !== 'scrypt') return false;
  const [, salt, hexAsli] = bagian;
  try {
    const bufAsli = Buffer.from(hexAsli, 'hex');
    const bufUji = scryptSync(password, salt, bufAsli.length);
    if (bufAsli.length !== bufUji.length) return false;
    return timingSafeEqual(bufAsli, bufUji);
  } catch {
    return false;
  }
}

function kunciPenandaSesi() {
  const rahasia = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SECRET_KEY || '';
  const garam = process.env.IP_SALT || 'cerita-lewat-magrib';
  if (!rahasia) return null;
  return Buffer.from(hkdfSync('sha256', rahasia, garam, 'clm-admin-sesi-v1', 32));
}

export function buatTokenSesi(versi = '1') {
  const kunci = kunciPenandaSesi();
  if (!kunci) return null;
  const muatan = Buffer.from(
    JSON.stringify({
      ver: String(versi),
      exp: Math.floor(Date.now() / 1000) + UMUR_SESI_DETIK,
    })
  ).toString('base64url');
  const tanda = createHmac('sha256', kunci).update(muatan).digest('base64url');
  return `${muatan}.${tanda}`;
}

export function bacaTokenSesi(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const kunci = kunciPenandaSesi();
  if (!kunci) return null;
  const [muatan, tanda] = token.split('.');
  if (!muatan || !tanda) return null;
  const tandaHarapan = createHmac('sha256', kunci).update(muatan).digest('base64url');
  const a = Buffer.from(tanda);
  const b = Buffer.from(tandaHarapan);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(muatan, 'base64url').toString('utf8'));
    if (!data?.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export function opsiCookieSesi(maxAge = UMUR_SESI_DETIK) {
  return {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

export function sidikIp(req) {
  const ip =
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'tidak-diketahui';
  const garam = process.env.IP_SALT || 'clm-garam-bawaan';
  return createHash('sha256').update(`${garam}:${ip}`).digest('hex');
}

export async function ambilPengaturanMap(db) {
  const {data, error} = await db.from('pengaturan_admin').select('kunci, nilai');
  if (error || !data) return {};
  return Object.fromEntries(data.map((b) => [b.kunci, b.nilai]));
}

export async function pastikanAdmin() {
  const db = bukaDatabase();
  if (!db) return {sah: false, status: 503, pesan: 'Supabase belum dikonfigurasi di server.'};

  const jar = await cookies();
  const token = jar.get(NAMA_COOKIE)?.value;
  const isi = bacaTokenSesi(token);
  if (!isi) return {sah: false, status: 401, pesan: 'Sesi admin berakhir. Silakan masuk kembali.'};

  const map = await ambilPengaturanMap(db);
  const versiSekarang = map.session_version || '1';
  if (!map.password_hash || String(isi.ver) !== String(versiSekarang)) {
    return {sah: false, status: 401, pesan: 'Sesi tidak lagi berlaku. Silakan masuk kembali.'};
  }
  return {sah: true, db, pengaturan: map};
}

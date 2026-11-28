#!/usr/bin/env node
// Generator Master Password Admin Cerita Lewat Magrib.
// Jalankan dari folder web: npm run admin:password
import {randomBytes, scryptSync} from 'node:crypto';
import {existsSync, readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createClient} from '@supabase/supabase-js';

const akar = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ALFABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

function muatEnvLokal() {
  for (const berkas of ['.env.local', '.env']) {
    const jalur = resolve(akar, berkas);
    if (!existsSync(jalur)) continue;
    const baris = readFileSync(jalur, 'utf8').split(/\r?\n/);
    for (const b of baris) {
      const bersih = b.trim();
      if (!bersih || bersih.startsWith('#')) continue;
      const idx = bersih.indexOf('=');
      if (idx === -1) continue;
      const k = bersih.slice(0, idx).trim();
      const v = bersih.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

function buatPassword() {
  const byte = randomBytes(20);
  const huruf = Array.from(byte, (b) => ALFABET[b % ALFABET.length]);
  return [
    huruf.slice(0, 5).join(''),
    huruf.slice(5, 10).join(''),
    huruf.slice(10, 15).join(''),
    huruf.slice(15, 20).join(''),
  ].join('-');
}

function buatHash(password) {
  const salt = randomBytes(16).toString('hex');
  const kunci = scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${kunci}`;
}

muatEnvLokal();

const argumenKustom = process.argv[2]?.trim();
if (argumenKustom && argumenKustom.length < 10) {
  console.error('Password kustom minimal 10 karakter (atau kosongkan argumen agar dibuat otomatis).');
  process.exit(1);
}

const password = argumenKustom || buatPassword();
const hash = buatHash(password);
const versiBaru = String(Date.now());

console.log('\n========================================================');
console.log(' MASTER PASSWORD ADMIN — CERITA LEWAT MAGRIB');
console.log('========================================================');
console.log(`\n  Password Anda :  ${password}\n`);
console.log('  PENTING: Simpan password di atas sekarang (mis. di password manager).');
console.log('  Password asli TIDAK disimpan di kode maupun di database.\n');

const {SUPABASE_URL, SUPABASE_SECRET_KEY} = process.env;

if (SUPABASE_URL && SUPABASE_SECRET_KEY) {
  const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {auth: {persistSession: false}});
  const {error} = await db.from('pengaturan_admin').upsert(
    [
      {kunci: 'password_hash', nilai: hash, diubah_pada: new Date().toISOString()},
      {kunci: 'session_version', nilai: versiBaru, diubah_pada: new Date().toISOString()},
    ],
    {onConflict: 'kunci'}
  );

  if (!error) {
    console.log('  STATUS: Berhasil disimpan langsung ke tabel public.pengaturan_admin di Supabase!');
    console.log('  Anda sudah bisa login di halaman /admin menggunakan password di atas.\n');
    process.exit(0);
  }
  console.warn(`  Catatan: Gagal menyimpan otomatis ke Supabase (${error.message}).`);
  console.warn('  Pastikan supabase/schema.sql sudah dijalankan, atau jalankan SQL di bawah ini:\n');
} else {
  console.log('  (.env.local belum terisi SUPABASE_URL & SUPABASE_SECRET_KEY)');
  console.log('  Tempel dan Run perintah SQL berikut di Supabase > SQL Editor:\n');
}

console.log(`insert into public.pengaturan_admin (kunci, nilai, diubah_pada)
values
  ('password_hash', '${hash}', now()),
  ('session_version', '${versiBaru}', now())
on conflict (kunci) do update set
  nilai = excluded.nilai,
  diubah_pada = excluded.diubah_pada;\n`);

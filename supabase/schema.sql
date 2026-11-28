-- Jalankan di Supabase: SQL Editor > New query > tempel > Run.
-- Aman dijalankan ulang (idempotent) baik untuk project baru maupun project lama.

-- 1. Tabel kiriman cerita penonton
create table if not exists public.kiriman (
  id          bigint generated always as identity primary key,
  dibuat_pada timestamptz not null default now(),
  jenis       text not null check (jenis in ('ide', 'cerita')),
  judul       text not null check (char_length(judul) between 3 and 120),
  nama        text not null check (char_length(nama) between 2 and 40),
  isi         text not null check (char_length(isi) between 30 and 8000),
  kontak      text check (char_length(kontak) <= 100),
  sebut_nama  boolean not null default false,
  status      text not null default 'baru' check (status in ('baru', 'dibaca', 'dipilih', 'sudah-jadi-video', 'ditolak')),
  catatan     text,
  ip_hash     text not null
);

create index if not exists kiriman_batas_idx on public.kiriman (ip_hash, dibuat_pada);

alter table public.kiriman enable row level security;
revoke all on public.kiriman from anon, authenticated;
grant select, insert, update, delete on public.kiriman to service_role;

-- 2. Tabel episode untuk katalog cerita & tautan TikTok
create table if not exists public.episode (
  id          bigint generated always as identity primary key,
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now(),
  slug        text not null unique check (char_length(slug) between 2 and 120),
  urutan      integer not null default 0,
  label_seri  text not null default '' check (char_length(label_seri) <= 60),
  judul       text not null check (char_length(judul) between 2 and 140),
  ringkasan   text not null default '' check (char_length(ringkasan) <= 600),
  sampul_url  text not null default '' check (char_length(sampul_url) <= 500),
  tiktok_url  text not null default '' check (char_length(tiktok_url) <= 500),
  youtube_url text not null default '' check (char_length(youtube_url) <= 500),
  sorotan     boolean not null default false,
  terbit      boolean not null default true,
  adegan      jsonb not null default '[]'::jsonb
);

create index if not exists episode_urutan_idx on public.episode (terbit, urutan desc, id desc);

alter table public.episode enable row level security;
revoke all on public.episode from anon, authenticated;
grant select, insert, update, delete on public.episode to service_role;

-- 3. Tabel pengaturan admin (menyimpan hash master password, versi sesi, dan tautan channel)
create table if not exists public.pengaturan_admin (
  kunci       text primary key,
  nilai       text not null,
  diubah_pada timestamptz not null default now()
);

alter table public.pengaturan_admin enable row level security;
revoke all on public.pengaturan_admin from anon, authenticated;
grant select, insert, update, delete on public.pengaturan_admin to service_role;

-- 4. Tabel pembatas percobaan login admin (anti brute-force)
create table if not exists public.percobaan_login (
  id          bigint generated always as identity primary key,
  ip_hash     text not null,
  dibuat_pada timestamptz not null default now()
);

create index if not exists percobaan_login_idx on public.percobaan_login (ip_hash, dibuat_pada);

alter table public.percobaan_login enable row level security;
revoke all on public.percobaan_login from anon, authenticated;
grant select, insert, delete on public.percobaan_login to service_role;

-- 5. Bucket Supabase Storage untuk upload sampul & screenshot (maks 5 MB, publik baca, upload khusus server)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-cerita',
  'media-cerita',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Publik baca media cerita'
  ) then
    create policy "Publik baca media cerita"
      on storage.objects for select
      using (bucket_id = 'media-cerita');
  end if;
end $$;

-- 6. Data awal episode: Kamar 04 (Part 1 & 2) dan Cerita #2 Suara Ibu di Dapur
insert into public.episode (slug, urutan, label_seri, judul, ringkasan, sampul_url, tiktok_url, youtube_url, sorotan, terbit, adegan)
values
  (
    'kamar-04-part-1',
    10,
    'Cerita #1 · Part 1',
    'Kamar 04: Aturan Jam Sepuluh',
    'Kos murah di tengah kota dengan satu pesan ibu kos: di atas jam sepuluh malam, jangan jawab suara apa pun dari kamar sebelah.',
    '/sampul/kamar-04-part-1.jpg',
    '',
    '',
    false,
    true,
    '[
      {"url": "/adegan-1.jpg", "alt": "Bu Ratna menyodorkan kunci Kamar 04 sambil tersenyum lebar", "teks": "\"Jangan pernah dijawab. Jangan juga diintip.\""},
      {"url": "/adegan-2.jpg", "alt": "Aris duduk di kasur, keran menyala di balik tembok Kamar 05", "teks": "Keran menyala di kamar yang katanya kosong."},
      {"url": "/adegan-3.jpg", "alt": "Aris menyorot senter ke tembok yang penuh bekas cakaran", "teks": "Lalu ketukannya berubah jadi cakaran."}
    ]'::jsonb
  ),
  (
    'kamar-04-part-2',
    20,
    'Cerita #1 · Part 2',
    'Kamar 04: Kunci yang Dibuang',
    'Kamar 05 ternyata sudah dikunci mati sejak tiga tahun lalu. Lalu siapa yang menyalakan keran dan berbisik di depan pintu Aris?',
    '/sampul/kamar-04-part-2.jpg',
    '',
    '',
    false,
    true,
    '[
      {"url": "/adegan-2.jpg", "alt": "Suara air mengalir dari Kamar 05 tengah malam", "teks": "\"Kamar 05 sudah dikunci mati tiga tahun lalu.\""},
      {"url": "/adegan-3.jpg", "alt": "Aris menyorot senter ke bekas cakaran di tembok", "teks": "\"Terus yang di belakang kamu... siapa?\""}
    ]'::jsonb
  ),
  (
    'suara-ibu-di-dapur',
    30,
    'Cerita #2',
    'Suara Ibu di Dapur',
    'Dina dipanggil ibunya dari dapur selepas magrib. Saat mulutnya hampir menjawab, masuk pesan di HP: "Ojeknya mogok. Ibu masih di pasar."',
    '/sampul/suara-ibu-part-1.jpg',
    '',
    '',
    true,
    true,
    '[
      {"url": "/suara-ibu-1.jpg", "alt": "Ibu memegang HP di pasar malam di samping ojek yang mogok", "teks": "Dipanggil dari dapur, padahal pesan masuk: \"Ibu masih di pasar.\""},
      {"url": "/suara-ibu-2.jpg", "alt": "Gagang pintu kamar Dina turun dua kali dari luar", "teks": "Gagang pintu turun pelan. Pantangannya cuma satu: jangan disahuti."},
      {"url": "/suara-ibu-3.jpg", "alt": "Dina duduk di sofa sebelah sosok menyerupai Ibu saat HP berdering", "teks": "Saat telepon asli dari Ibu berdering, perempuan di sebelahnya menoleh."}
    ]'::jsonb
  )
on conflict (slug) do nothing;

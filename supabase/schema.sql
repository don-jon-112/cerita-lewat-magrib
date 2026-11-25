-- Jalankan sekali di Supabase: SQL Editor > New query > tempel > Run.
create table public.kiriman (
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

create index kiriman_batas_idx on public.kiriman (ip_hash, dibuat_pada);

-- RLS aktif tanpa policy: pengunjung tidak bisa membaca maupun menulis langsung.
-- Hanya server website (memakai secret key) dan Anda lewat dashboard yang bisa.
alter table public.kiriman enable row level security;
revoke all on public.kiriman from anon, authenticated;
grant select, insert on public.kiriman to service_role;

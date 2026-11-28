'use client';

import {useCallback, useEffect, useState} from 'react';

const FORM_KOSONG = {
  id: null,
  label_seri: '',
  judul: '',
  slug: '',
  urutan: 40,
  ringkasan: '',
  sampul_url: '',
  tiktok_url: '',
  youtube_url: '',
  sorotan: false,
  terbit: true,
  adegan: [],
};

const LABEL_STATUS = {
  baru: 'Baru',
  dibaca: 'Dibaca',
  dipilih: 'Dipilih',
  'sudah-jadi-video': 'Sudah Jadi Video',
  ditolak: 'Ditolak',
};

export default function PanelAdmin({sudahMasukAwal, statusServer}) {
  const [masuk, setMasuk] = useState(sudahMasukAwal);
  const [sandiMasuk, setSandiMasuk] = useState('');
  const [tampilSandi, setTampilSandi] = useState(false);
  const [sedangProses, setSedangProses] = useState(false);
  const [notif, setNotif] = useState(null); // {tipe: 'sukses' | 'galat', teks}

  const [tab, setTab] = useState('episode'); // episode | kiriman | channel | keamanan

  // State Episode
  const [daftarEpisode, setDaftarEpisode] = useState([]);
  const [muatEpisode, setMuatEpisode] = useState(false);
  const [bukaForm, setBukaForm] = useState(false);
  const [formEp, setFormEp] = useState(FORM_KOSONG);
  const [sedangUnggah, setSedangUnggah] = useState('');

  // State Kiriman
  const [daftarKiriman, setDaftarKiriman] = useState([]);
  const [muatKiriman, setMuatKiriman] = useState(false);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterJenis, setFilterJenis] = useState('semua');
  const [kataCari, setKataCari] = useState('');
  const [drafCatatan, setDrafCatatan] = useState({});

  // State Channel
  const [channelTiktok, setChannelTiktok] = useState('');
  const [channelYoutube, setChannelYoutube] = useState('');

  // State Password Baru
  const [sandiSekarang, setSandiSekarang] = useState('');
  const [modeSandi, setModeSandi] = useState('acak');
  const [sandiManual, setSandiManual] = useState('');
  const [hasilSandiBaru, setHasilSandiBaru] = useState('');

  const kabari = (tipe, teks) => setNotif({tipe, teks});

  const ambilSemuaData = useCallback(async () => {
    setMuatEpisode(true);
    setMuatKiriman(true);
    try {
      const [rEp, rKir, rPeng] = await Promise.all([
        fetch('/api/admin/episode'),
        fetch('/api/admin/kiriman'),
        fetch('/api/admin/pengaturan'),
      ]);

      if (rEp.status === 401 || rKir.status === 401) {
        setMasuk(false);
        return;
      }

      const [jEp, jKir, jPeng] = await Promise.all([
        rEp.json().catch(() => ({})),
        rKir.json().catch(() => ({})),
        rPeng.json().catch(() => ({})),
      ]);

      if (rEp.ok) setDaftarEpisode(jEp.episode || []);
      else if (jEp.pesan) kabari('galat', jEp.pesan);

      if (rKir.ok) {
        const list = jKir.kiriman || [];
        setDaftarKiriman(list);
        setDrafCatatan(Object.fromEntries(list.map((k) => [k.id, k.catatan || ''])));
      }

      if (rPeng.ok) {
        setChannelTiktok(jPeng.channel_tiktok || '');
        setChannelYoutube(jPeng.channel_youtube || '');
      }
    } catch {
      kabari('galat', 'Gagal memuat data dari server.');
    } finally {
      setMuatEpisode(false);
      setMuatKiriman(false);
    }
  }, []);

  useEffect(() => {
    if (masuk) ambilSemuaData();
  }, [masuk, ambilSemuaData]);

  const kirimLogin = async (e) => {
    e.preventDefault();
    setNotif(null);
    setSedangProses(true);
    try {
      const res = await fetch('/api/admin/masuk', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: sandiMasuk}),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setSandiMasuk('');
        setMasuk(true);
        return;
      }
      kabari('galat', j.pesan || 'Gagal masuk.');
    } catch {
      kabari('galat', 'Koneksi ke server gagal.');
    } finally {
      setSedangProses(false);
    }
  };

  const keluar = async () => {
    await fetch('/api/admin/masuk', {method: 'DELETE'}).catch(() => {});
    setMasuk(false);
    setNotif(null);
  };

  // ---------- Unggah Gambar ----------
  const unggahGambar = async (berkas, targetId, saatBerhasil) => {
    if (!berkas) return;
    setSedangUnggah(targetId);
    setNotif(null);
    try {
      const fd = new FormData();
      fd.append('berkas', berkas);
      const res = await fetch('/api/admin/unggah', {method: 'POST', body: fd});
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        kabari('galat', j.pesan || 'Gagal mengunggah gambar.');
        return;
      }
      saatBerhasil(j.url);
      kabari('sukses', 'Gambar berhasil diunggah ke Supabase Storage.');
    } catch {
      kabari('galat', 'Koneksi terputus saat mengunggah gambar.');
    } finally {
      setSedangUnggah('');
    }
  };

  // ---------- Operasi Episode ----------
  const mulaiTambahEpisode = () => {
    const maksUrutan = daftarEpisode.reduce((m, e) => Math.max(m, e.urutan || 0), 0);
    setFormEp({
      ...FORM_KOSONG,
      urutan: maksUrutan + 10,
      label_seri: `Cerita #${daftarEpisode.length + 1}`,
      sorotan: true,
    });
    setBukaForm(true);
    setNotif(null);
  };

  const mulaiEditEpisode = (ep) => {
    setFormEp({
      id: ep.id,
      label_seri: ep.label_seri || '',
      judul: ep.judul || '',
      slug: ep.slug || '',
      urutan: ep.urutan ?? 0,
      ringkasan: ep.ringkasan || '',
      sampul_url: ep.sampul_url || '',
      tiktok_url: ep.tiktok_url || '',
      youtube_url: ep.youtube_url || '',
      sorotan: !!ep.sorotan,
      terbit: ep.terbit !== false,
      adegan: Array.isArray(ep.adegan) ? ep.adegan.map((a) => ({...a})) : [],
    });
    setBukaForm(true);
    setNotif(null);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const simpanEpisode = async (e) => {
    e.preventDefault();
    setSedangProses(true);
    setNotif(null);
    try {
      const metode = formEp.id ? 'PATCH' : 'POST';
      const res = await fetch('/api/admin/episode', {
        method: metode,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(formEp),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        kabari('galat', j.pesan || 'Gagal menyimpan episode.');
        return;
      }
      kabari('sukses', j.pesan || 'Episode disimpan.');
      setBukaForm(false);
      await ambilSemuaData();
    } catch {
      kabari('galat', 'Gagal menghubungi server.');
    } finally {
      setSedangProses(false);
    }
  };

  const jadikanSorotanCepat = async (id) => {
    setSedangProses(true);
    try {
      const res = await fetch('/api/admin/episode', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id, hanyaSorotan: true}),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        kabari('sukses', j.pesan);
        await ambilSemuaData();
      } else {
        kabari('galat', j.pesan || 'Gagal mengubah sorotan.');
      }
    } finally {
      setSedangProses(false);
    }
  };

  const hapusEpisode = async (ep) => {
    if (!window.confirm(`Hapus episode "${ep.judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setSedangProses(true);
    try {
      const res = await fetch(`/api/admin/episode?id=${ep.id}`, {method: 'DELETE'});
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        kabari('sukses', 'Episode dihapus.');
        await ambilSemuaData();
      } else {
        kabari('galat', j.pesan || 'Gagal menghapus episode.');
      }
    } finally {
      setSedangProses(false);
    }
  };

  const muatEpisodeAwal = async () => {
    setSedangProses(true);
    try {
      const res = await fetch('/api/admin/episode', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({aksi: 'muat-bawaan'}),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        kabari('sukses', j.pesan);
        await ambilSemuaData();
      } else {
        kabari('galat', j.pesan || 'Gagal memuat cerita awal.');
      }
    } finally {
      setSedangProses(false);
    }
  };

  // ---------- Operasi Adegan di dalam Form ----------
  const tambahBarisAdegan = () => {
    if (formEp.adegan.length >= 6) return;
    setFormEp((x) => ({
      ...x,
      adegan: [...x.adegan, {url: '', alt: '', teks: ''}],
    }));
  };

  const ubahAdegan = (idx, kunci, nilai) => {
    setFormEp((x) => ({
      ...x,
      adegan: x.adegan.map((item, i) => (i === idx ? {...item, [kunci]: nilai} : item)),
    }));
  };

  const hapusBarisAdegan = (idx) => {
    setFormEp((x) => ({
      ...x,
      adegan: x.adegan.filter((_, i) => i !== idx),
    }));
  };

  // ---------- Operasi Kiriman ----------
  const simpanPerubahanKiriman = async (id, statusBaru, catatanBaru) => {
    setSedangProses(true);
    try {
      const res = await fetch('/api/admin/kiriman', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id, status: statusBaru, catatan: catatanBaru}),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        kabari('galat', j.pesan || 'Gagal memperbarui kiriman.');
        return;
      }
      setDaftarKiriman((lama) => lama.map((k) => (k.id === id ? j.kiriman : k)));
      kabari('sukses', 'Status / catatan kiriman tersimpan.');
    } finally {
      setSedangProses(false);
    }
  };

  const hapusKiriman = async (k) => {
    if (!window.confirm(`Hapus kiriman "${k.judul}" dari ${k.nama}?`)) return;
    setSedangProses(true);
    try {
      const res = await fetch(`/api/admin/kiriman?id=${k.id}`, {method: 'DELETE'});
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setDaftarKiriman((lama) => lama.filter((x) => x.id !== k.id));
        kabari('sukses', 'Kiriman dihapus.');
      } else {
        kabari('galat', j.pesan || 'Gagal menghapus kiriman.');
      }
    } finally {
      setSedangProses(false);
    }
  };

  // ---------- Operasi Channel & Password ----------
  const simpanChannel = async (e) => {
    e.preventDefault();
    setSedangProses(true);
    setNotif(null);
    try {
      const res = await fetch('/api/admin/pengaturan', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({channel_tiktok: channelTiktok, channel_youtube: channelYoutube}),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) kabari('sukses', j.pesan);
      else kabari('galat', j.pesan || 'Gagal menyimpan tautan channel.');
    } finally {
      setSedangProses(false);
    }
  };

  const perbaruiPassword = async (e) => {
    e.preventDefault();
    setSedangProses(true);
    setNotif(null);
    setHasilSandiBaru('');
    try {
      const res = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          passwordSekarang: sandiSekarang,
          mode: modeSandi,
          passwordBaru: sandiManual,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        kabari('galat', j.pesan || 'Gagal memperbarui password.');
        return;
      }
      setSandiSekarang('');
      setSandiManual('');
      setHasilSandiBaru(j.passwordBaru || '');
      kabari('sukses', j.pesan);
    } finally {
      setSedangProses(false);
    }
  };

  // ==================== LAYAR LOGIN ====================
  if (!masuk) {
    return (
      <div className="wadah bungkus-admin">
        <div className="panel-kotak kotak-masuk">
          <h1 style={{fontSize: '1.6rem', marginBottom: 6}}>Ruang Pengelola</h1>
          <p className="redup" style={{marginBottom: 20, fontSize: '0.93rem'}}>
            Masukkan master password untuk mengatur episode, link TikTok, dan membaca kiriman cerita.
          </p>

          {statusServer === 'belum-env' && (
            <div className="peringatan-setup">
              <strong>Supabase belum terhubung.</strong> Isi <code>SUPABASE_URL</code>,{' '}
              <code>SUPABASE_SECRET_KEY</code>, dan <code>IP_SALT</code> di <code>.env.local</code> atau Vercel terlebih dulu.
            </div>
          )}

          {statusServer === 'belum-password' && (
            <div className="peringatan-setup">
              <strong>Master password belum digenerate.</strong> Jalankan perintah{' '}
              <code>npm run admin:password</code> di folder <code>web</code> untuk membuat master password pertama di Supabase.
            </div>
          )}

          {notif && (
            <div className={`notif-admin ${notif.tipe === 'sukses' ? 'sukses' : 'galat-kotak'}`} role="alert">
              {notif.teks}
            </div>
          )}

          <form onSubmit={kirimLogin}>
            <div className="grup-input" style={{marginBottom: 14}}>
              <label htmlFor="sandi-admin">Master Password</label>
              <div className="baris-unggah">
                <input
                  id="sandi-admin"
                  type={tampilSandi ? 'text' : 'password'}
                  className="input-admin"
                  value={sandiMasuk}
                  onChange={(e) => setSandiMasuk(e.target.value)}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="btn-admin"
                  onClick={() => setTampilSandi((x) => !x)}
                >
                  {tampilSandi ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 20}}>
              <a href="/" className="tautan" style={{fontSize: '0.9rem'}}>← Halaman depan</a>
              <button type="submit" className="btn-admin btn-utama" disabled={sedangProses}>
                {sedangProses ? 'Memeriksa...' : 'Masuk Admin'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==================== LAYAR UTAMA CMS ====================
  const jumlahBaru = daftarKiriman.filter((k) => k.status === 'baru').length;
  const kirimanTersaring = daftarKiriman.filter((k) => {
    if (filterStatus !== 'semua' && k.status !== filterStatus) return false;
    if (filterJenis !== 'semua' && k.jenis !== filterJenis) return false;
    if (kataCari.trim()) {
      const q = kataCari.toLowerCase();
      return (
        k.judul?.toLowerCase().includes(q) ||
        k.nama?.toLowerCase().includes(q) ||
        k.isi?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="wadah bungkus-admin">
      <header className="kepala-admin">
        <div className="judul-admin">
          <h1>CMS Cerita Lewat Magrib</h1>
          <span>Kelola episode, screenshot, link TikTok, dan kiriman cerita penonton</span>
        </div>
        <div className="aksi-atas-admin">
          <a href="/" target="_blank" rel="noreferrer" className="btn-admin">
            Lihat Website ↗
          </a>
          <button type="button" className="btn-admin" onClick={ambilSemuaData}>
            Muat Ulang
          </button>
          <button type="button" className="btn-admin btn-bahaya" onClick={keluar}>
            Keluar
          </button>
        </div>
      </header>

      <nav className="tab-nav" aria-label="Menu CMS">
        <button
          type="button"
          className={`tab-tombol ${tab === 'episode' ? 'aktif' : ''}`}
          onClick={() => setTab('episode')}
        >
          Episode & Link TikTok ({daftarEpisode.length})
        </button>
        <button
          type="button"
          className={`tab-tombol ${tab === 'kiriman' ? 'aktif' : ''}`}
          onClick={() => setTab('kiriman')}
        >
          Kiriman Cerita ({daftarKiriman.length})
          {jumlahBaru > 0 && <span className="lencana-hitung">{jumlahBaru} baru</span>}
        </button>
        <button
          type="button"
          className={`tab-tombol ${tab === 'channel' ? 'aktif' : ''}`}
          onClick={() => setTab('channel')}
        >
          Link Profil Channel
        </button>
        <button
          type="button"
          className={`tab-tombol ${tab === 'keamanan' ? 'aktif' : ''}`}
          onClick={() => setTab('keamanan')}
        >
          Generate Password
        </button>
      </nav>

      {notif && (
        <div className={`notif-admin ${notif.tipe === 'sukses' ? 'sukses' : 'galat-kotak'}`} role="status">
          {notif.teks}
        </div>
      )}

      {/* ==================== TAB 1: EPISODE ==================== */}
      {tab === 'episode' && (
        <>
          <div className="baris-atas-seksi">
            <h2 style={{fontSize: '1.3rem'}}>Daftar Episode</h2>
            <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
              {daftarEpisode.length === 0 && !muatEpisode && (
                <button
                  type="button"
                  className="btn-admin"
                  onClick={muatEpisodeAwal}
                  disabled={sedangProses}
                >
                  Muat 3 Episode Awal (Kamar 04 & Suara Ibu)
                </button>
              )}
              <button
                type="button"
                className="btn-admin btn-utama"
                onClick={bukaForm ? () => setBukaForm(false) : mulaiTambahEpisode}
              >
                {bukaForm ? 'Tutup Formulir' : '+ Tambah Episode Baru'}
              </button>
            </div>
          </div>

          {bukaForm && (
            <form className="panel-kotak" onSubmit={simpanEpisode}>
              <h3 style={{fontSize: '1.15rem', marginBottom: 16}}>
                {formEp.id ? `Edit Episode: ${formEp.judul}` : 'Tambah Episode Baru'}
              </h3>

              <div className="baris-form baris-3">
                <div className="grup-input">
                  <label htmlFor="ep-judul">Judul Episode *</label>
                  <input
                    id="ep-judul"
                    className="input-admin"
                    value={formEp.judul}
                    onChange={(e) => setFormEp({...formEp, judul: e.target.value})}
                    placeholder="Mis. Suara Ibu di Dapur — Bagian 2"
                    required
                  />
                </div>
                <div className="grup-input">
                  <label htmlFor="ep-seri">Label Seri / Bagian</label>
                  <input
                    id="ep-seri"
                    className="input-admin"
                    value={formEp.label_seri}
                    onChange={(e) => setFormEp({...formEp, label_seri: e.target.value})}
                    placeholder="Mis. Cerita #2 · Part 2"
                  />
                </div>
                <div className="grup-input">
                  <label htmlFor="ep-urutan">Nomor Urut (besar = atas)</label>
                  <input
                    id="ep-urutan"
                    type="number"
                    className="input-admin"
                    value={formEp.urutan}
                    onChange={(e) => setFormEp({...formEp, urutan: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="baris-form baris-2">
                <div className="grup-input">
                  <label htmlFor="ep-tiktok">Link Video TikTok</label>
                  <input
                    id="ep-tiktok"
                    type="url"
                    className="input-admin"
                    value={formEp.tiktok_url}
                    onChange={(e) => setFormEp({...formEp, tiktok_url: e.target.value})}
                    placeholder="https://www.tiktok.com/@.../video/..."
                  />
                  <small>Jika dikosongkan dulu, kartu akan menampilkan tulisan &ldquo;Segera di TikTok&rdquo;.</small>
                </div>
                <div className="grup-input">
                  <label htmlFor="ep-youtube">Link YouTube Shorts (opsional)</label>
                  <input
                    id="ep-youtube"
                    type="url"
                    className="input-admin"
                    value={formEp.youtube_url}
                    onChange={(e) => setFormEp({...formEp, youtube_url: e.target.value})}
                    placeholder="https://youtube.com/shorts/..."
                  />
                </div>
              </div>

              <div className="baris-form">
                <div className="grup-input">
                  <label htmlFor="ep-ringkasan">Ringkasan Cerita (1–2 kalimat)</label>
                  <textarea
                    id="ep-ringkasan"
                    className="textarea-admin"
                    rows={3}
                    value={formEp.ringkasan}
                    onChange={(e) => setFormEp({...formEp, ringkasan: e.target.value})}
                    placeholder="Premis singkat yang membuat penonton penasaran..."
                  />
                </div>
              </div>

              <div className="baris-form baris-2">
                <div className="grup-input">
                  <label htmlFor="ep-sampul">Sampul Poster (3:4)</label>
                  <div className="baris-unggah">
                    <input
                      id="ep-sampul"
                      className="input-admin"
                      value={formEp.sampul_url}
                      onChange={(e) => setFormEp({...formEp, sampul_url: e.target.value})}
                      placeholder="/sampul/... atau https://..."
                    />
                    <label className="btn-admin tombol-file">
                      {sedangUnggah === 'sampul' ? 'Mengunggah...' : 'Upload Sampul'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={!!sedangUnggah}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = '';
                          unggahGambar(f, 'sampul', (url) => setFormEp((x) => ({...x, sampul_url: url})));
                        }}
                      />
                    </label>
                  </div>
                  {formEp.sampul_url && (
                    <div className="pratinjau-sampul">
                      <img src={formEp.sampul_url} alt="Pratinjau sampul" />
                      <small>Pratinjau sampul vertikal</small>
                    </div>
                  )}
                </div>

                <div className="grup-input">
                  <label htmlFor="ep-slug">Slug Unik (opsional)</label>
                  <input
                    id="ep-slug"
                    className="input-admin"
                    value={formEp.slug}
                    onChange={(e) => setFormEp({...formEp, slug: e.target.value})}
                    placeholder="Otomatis dibuat dari judul bila dikosongkan"
                  />
                </div>
              </div>

              {/* Adegan Polaroid */}
              <div className="grup-input" style={{marginTop: 10}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10}}>
                  <label>Screenshot Adegan Polaroid (tampil saat cerita dijadikan Sorotan, maks 6)</label>
                  <button
                    type="button"
                    className="btn-admin"
                    onClick={tambahBarisAdegan}
                    disabled={formEp.adegan.length >= 6}
                  >
                    + Tambah SS Adegan
                  </button>
                </div>

                <div className="daftar-adegan-form">
                  {formEp.adegan.map((ad, idx) => (
                    <div className="item-adegan-form" key={idx}>
                      {ad.url ? (
                        <img src={ad.url} alt={ad.alt || `Adegan ${idx + 1}`} />
                      ) : (
                        <div className="kotak-thumb-kosong">Belum ada SS</div>
                      )}
                      <div style={{display: 'grid', gap: 8}}>
                        <div className="baris-unggah">
                          <input
                            className="input-admin"
                            value={ad.url}
                            onChange={(e) => ubahAdegan(idx, 'url', e.target.value)}
                            placeholder="URL gambar SS atau klik Upload SS"
                          />
                          <label className="btn-admin tombol-file">
                            {sedangUnggah === `ad-${idx}` ? 'Mengunggah...' : 'Upload SS'}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              disabled={!!sedangUnggah}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                unggahGambar(f, `ad-${idx}`, (url) => ubahAdegan(idx, 'url', url));
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            className="btn-admin btn-bahaya"
                            onClick={() => hapusBarisAdegan(idx)}
                          >
                            Hapus
                          </button>
                        </div>
                        <input
                          className="input-admin"
                          value={ad.teks}
                          onChange={(e) => ubahAdegan(idx, 'teks', e.target.value)}
                          placeholder="Teks tulisan tangan di bawah foto polaroid..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="opsi-centang-admin">
                <label>
                  <input
                    type="checkbox"
                    checked={formEp.sorotan}
                    onChange={(e) => setFormEp({...formEp, sorotan: e.target.checked})}
                  />
                  <span>Jadikan Sorotan Utama di bagian atas halaman</span>
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={formEp.terbit}
                    onChange={(e) => setFormEp({...formEp, terbit: e.target.checked})}
                  />
                  <span>Terbitkan (tampil ke pengunjung)</span>
                </label>
              </div>

              <div style={{display: 'flex', gap: 10, justifyContent: 'flex-end'}}>
                <button type="button" className="btn-admin" onClick={() => setBukaForm(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-admin btn-utama" disabled={sedangProses}>
                  {sedangProses ? 'Menyimpan...' : 'Simpan Episode'}
                </button>
              </div>
            </form>
          )}

          {muatEpisode ? (
            <p className="redup">Memuat daftar episode...</p>
          ) : (
            <div className="daftar-episode-admin">
              {daftarEpisode.map((ep) => (
                <div className="baris-episode-admin" key={ep.id}>
                  {ep.sampul_url ? (
                    <img className="thumb-ep-admin" src={ep.sampul_url} alt={ep.judul} />
                  ) : (
                    <div className="kotak-thumb-kosong" style={{width: 76, height: 100}}>Tanpa Sampul</div>
                  )}

                  <div>
                    <div className="meta-ep-admin">
                      {ep.label_seri && <span className="pil-status">{ep.label_seri}</span>}
                      <span className="pil-status">Urutan: {ep.urutan}</span>
                      {ep.sorotan && <span className="pil-status pil-emas">★ Sorotan Polaroid</span>}
                      {ep.terbit ? (
                        <span className="pil-status pil-hijau">Terbit</span>
                      ) : (
                        <span className="pil-status pil-merah">Draf Tersembunyi</span>
                      )}
                      {ep.tiktok_url ? (
                        <span className="pil-status pil-hijau">Link TikTok Aktif</span>
                      ) : (
                        <span className="pil-status">Belum Ada Link TikTok</span>
                      )}
                    </div>
                    <h3 style={{marginBottom: 4}}>{ep.judul}</h3>
                    {ep.ringkasan && (
                      <p className="redup" style={{marginTop: 0, fontSize: '0.88rem'}}>
                        {ep.ringkasan}
                      </p>
                    )}
                  </div>

                  <div className="aksi-ep-admin">
                    {ep.tiktok_url && (
                      <a
                        href={ep.tiktok_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-admin"
                      >
                        TikTok ↗
                      </a>
                    )}
                    {!ep.sorotan && (
                      <button
                        type="button"
                        className="btn-admin"
                        onClick={() => jadikanSorotanCepat(ep.id)}
                        disabled={sedangProses}
                      >
                        Jadikan Sorotan
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-admin btn-utama"
                      onClick={() => mulaiEditEpisode(ep)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-admin btn-bahaya"
                      onClick={() => hapusEpisode(ep)}
                      disabled={sedangProses}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== TAB 2: KIRIMAN CERITA ==================== */}
      {tab === 'kiriman' && (
        <>
          <div className="filter-baris">
            <select
              className="select-admin"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter status kiriman"
            >
              <option value="semua">Semua Status ({daftarKiriman.length})</option>
              {Object.entries(LABEL_STATUS).map(([nilai, label]) => (
                <option key={nilai} value={nilai}>
                  {label} ({daftarKiriman.filter((k) => k.status === nilai).length})
                </option>
              ))}
            </select>

            <select
              className="select-admin"
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              aria-label="Filter jenis kiriman"
            >
              <option value="semua">Cerita & Ide</option>
              <option value="cerita">Hanya Cerita</option>
              <option value="ide">Hanya Ide</option>
            </select>

            <input
              className="input-admin"
              placeholder="Cari judul, pengirim, atau isi..."
              value={kataCari}
              onChange={(e) => setKataCari(e.target.value)}
            />
          </div>

          {muatKiriman ? (
            <p className="redup">Memuat kiriman cerita...</p>
          ) : kirimanTersaring.length === 0 ? (
            <div className="panel-kotak">
              <p className="redup" style={{margin: 0}}>Belum ada kiriman yang cocok dengan filter ini.</p>
            </div>
          ) : (
            kirimanTersaring.map((k) => (
              <article className="kartu-kiriman" key={k.id}>
                <div className="kepala-kiriman">
                  <div>
                    <div className="meta-ep-admin">
                      <span className={`pil-status ${k.status === 'baru' ? 'pil-emas' : k.status === 'dipilih' || k.status === 'sudah-jadi-video' ? 'pil-hijau' : ''}`}>
                        {LABEL_STATUS[k.status] || k.status}
                      </span>
                      <span className="pil-status">{k.jenis === 'ide' ? 'Ide Singkat' : 'Cerita Lengkap'}</span>
                      <span className="pil-status">
                        {k.sebut_nama ? '✓ Boleh sebut nama' : 'Anonim / Jangan sebut nama'}
                      </span>
                    </div>
                    <h3 style={{fontSize: '1.15rem', marginBottom: 2}}>{k.judul}</h3>
                    <p className="info-pengirim">
                      Dari <strong>{k.nama}</strong>
                      {k.kontak ? ` · Kontak: ${k.kontak}` : ''}
                      {' · '}
                      {new Date(k.dibuat_pada).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <div className="naskah-kiriman">{k.isi}</div>

                <div className="kontrol-kiriman">
                  <select
                    className="select-admin"
                    value={k.status}
                    onChange={(e) =>
                      simpanPerubahanKiriman(k.id, e.target.value, drafCatatan[k.id] ?? k.catatan ?? '')
                    }
                    disabled={sedangProses}
                  >
                    {Object.entries(LABEL_STATUS).map(([nilai, label]) => (
                      <option key={nilai} value={nilai}>{label}</option>
                    ))}
                  </select>

                  <input
                    className="input-admin"
                    placeholder="Catatan internal produser (mis. kandidat episode minggu depan)..."
                    value={drafCatatan[k.id] ?? ''}
                    onChange={(e) => setDrafCatatan((lama) => ({...lama, [k.id]: e.target.value}))}
                  />

                  <button
                    type="button"
                    className="btn-admin btn-utama"
                    disabled={sedangProses}
                    onClick={() => simpanPerubahanKiriman(k.id, k.status, drafCatatan[k.id] ?? '')}
                  >
                    Simpan Catatan
                  </button>

                  <button
                    type="button"
                    className="btn-admin btn-bahaya"
                    disabled={sedangProses}
                    onClick={() => hapusKiriman(k)}
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))
          )}
        </>
      )}

      {/* ==================== TAB 3: PENGATURAN CHANNEL ==================== */}
      {tab === 'channel' && (
        <form className="panel-kotak" style={{maxWidth: 640}} onSubmit={simpanChannel}>
          <h2 style={{fontSize: '1.3rem', marginBottom: 6}}>Tautan Profil Channel</h2>
          <p className="redup" style={{marginBottom: 20, fontSize: '0.92rem'}}>
            Tautan ini ditampilkan pada tombol atas halaman utama. Kosongkan bila belum ingin ditampilkan.
          </p>

          <div className="baris-form">
            <div className="grup-input">
              <label htmlFor="ch-tiktok">URL Profil TikTok Channel</label>
              <input
                id="ch-tiktok"
                type="url"
                className="input-admin"
                value={channelTiktok}
                onChange={(e) => setChannelTiktok(e.target.value)}
                placeholder="https://www.tiktok.com/@ceritalewatmagrib"
              />
            </div>
            <div className="grup-input">
              <label htmlFor="ch-youtube">URL Profil YouTube Channel</label>
              <input
                id="ch-youtube"
                type="url"
                className="input-admin"
                value={channelYoutube}
                onChange={(e) => setChannelYoutube(e.target.value)}
                placeholder="https://www.youtube.com/@ceritalewatmagrib"
              />
            </div>
          </div>

          <button type="submit" className="btn-admin btn-utama" disabled={sedangProses}>
            {sedangProses ? 'Menyimpan...' : 'Simpan Tautan Channel'}
          </button>
        </form>
      )}

      {/* ==================== TAB 4: KEAMANAN / GENERATE PASSWORD ==================== */}
      {tab === 'keamanan' && (
        <div className="panel-kotak" style={{maxWidth: 640}}>
          <h2 style={{fontSize: '1.3rem', marginBottom: 6}}>Generate Master Password Baru</h2>
          <p className="redup" style={{marginBottom: 20, fontSize: '0.92rem'}}>
            Supabase hanya menyimpan <strong>hash scrypt</strong> dari password Anda. Saat password digenerate ulang, semua sesi login di perangkat lain otomatis terputus.
          </p>

          <form onSubmit={perbaruiPassword}>
            <div className="baris-form">
              <div className="grup-input">
                <label htmlFor="pw-lama">Master Password Saat Ini *</label>
                <input
                  id="pw-lama"
                  type="password"
                  className="input-admin"
                  value={sandiSekarang}
                  onChange={(e) => setSandiSekarang(e.target.value)}
                  required
                />
              </div>

              <div className="grup-input">
                <label htmlFor="pw-mode">Cara Buat Password Baru</label>
                <select
                  id="pw-mode"
                  className="select-admin"
                  value={modeSandi}
                  onChange={(e) => setModeSandi(e.target.value)}
                >
                  <option value="acak">Generate otomatis (acak kuat 20 karakter — disarankan)</option>
                  <option value="manual">Ketik sendiri (minimal 10 karakter)</option>
                </select>
              </div>

              {modeSandi === 'manual' && (
                <div className="grup-input">
                  <label htmlFor="pw-manual">Password Baru Pilihan Anda *</label>
                  <input
                    id="pw-manual"
                    type="text"
                    className="input-admin"
                    minLength={10}
                    value={sandiManual}
                    onChange={(e) => setSandiManual(e.target.value)}
                    placeholder="Minimal 10 karakter"
                    required
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn-admin btn-utama" disabled={sedangProses}>
              {sedangProses
                ? 'Memproses...'
                : modeSandi === 'acak'
                  ? 'Generate & Simpan Master Password Baru'
                  : 'Simpan Master Password Baru'}
            </button>
          </form>

          {hasilSandiBaru && (
            <div className="kotak-sandi-baru">
              <strong>Master Password Baru Anda (hanya tampil sekali ini):</strong>
              <div className="teks-sandi-baru">{hasilSandiBaru}</div>
              <div style={{display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap'}}>
                <button
                  type="button"
                  className="btn-admin btn-utama"
                  onClick={() => {
                    navigator.clipboard?.writeText(hasilSandiBaru);
                    kabari('sukses', 'Password baru disalin ke clipboard.');
                  }}
                >
                  Salin Password
                </button>
                <small style={{color: 'var(--kertas)'}}>
                  Simpan di tempat aman sebelum menutup halaman ini.
                </small>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

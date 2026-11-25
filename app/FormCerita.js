'use client';

import {useEffect, useRef, useState} from 'react';
import {periksa} from '../lib/validasi';
import {BATAS} from '../lib/konfigurasi';

const KOSONG = {nama: '', jenis: 'cerita', judul: '', isi: '', kontak: '', sebut_nama: false, setuju: false, situs: ''};
const DRAF = 'draf-cerita';

export default function FormCerita() {
  const [f, setF] = useState(KOSONG);
  const [galat, setGalat] = useState({});
  const [status, setStatus] = useState('isi'); // isi | kirim | selesai
  const [pesan, setPesan] = useState('');
  const mulai = useRef(0);
  const siap = useRef(false);

  // Draf disimpan di perangkat penonton supaya cerita panjang tidak hilang.
  useEffect(() => {
    mulai.current = Date.now();
    try {
      const d = JSON.parse(localStorage.getItem(DRAF) || 'null');
      if (d) setF({...KOSONG, ...d, setuju: false, situs: ''});
    } catch {}
    siap.current = true;
  }, []);
  useEffect(() => {
    if (!siap.current || status !== 'isi') return;
    try {
      const {setuju, situs, ...d} = f;
      localStorage.setItem(DRAF, JSON.stringify(d));
    } catch {}
  }, [f, status]);

  const ubah = (kunci) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((x) => ({...x, [kunci]: v}));
    setGalat(({[kunci]: _, ...sisa}) => sisa);
  };

  const tampilkanGalat = (g) => {
    setGalat(g);
    const pertama = ['nama', 'judul', 'isi', 'kontak', 'setuju'].find((k) => g[k]);
    document.getElementById(pertama)?.focus();
  };

  const kirim = async (e) => {
    e.preventDefault();
    setPesan('');
    const cek = periksa(f);
    if (!cek.sah) return tampilkanGalat(cek.galat);
    setStatus('kirim');
    try {
      const res = await fetch('/api/kirim', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...f, lama_ms: Date.now() - mulai.current}),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        try {
          localStorage.removeItem(DRAF);
        } catch {}
        setStatus('selesai');
        return;
      }
      setStatus('isi');
      setPesan(j.pesan || 'Gagal mengirim. Coba lagi.');
      if (j.galat) tampilkanGalat(j.galat);
    } catch {
      setStatus('isi');
      setPesan('Koneksi bermasalah. Ceritamu masih tersimpan di perangkat ini, coba kirim lagi.');
    }
  };

  if (status === 'selesai')
    return (
      <div className="kartu selesai" role="status">
        <div className="tok" aria-hidden="true">tok... tok... tok...</div>
        <h2>Ceritamu sudah masuk</h2>
        <p>Terima kasih. Setiap kiriman dibaca dulu, dan yang terpilih bisa jadi video berikutnya.</p>
        <button
          type="button"
          className="tombol"
          onClick={() => {
            setF({...KOSONG, nama: f.nama, kontak: f.kontak});
            mulai.current = Date.now();
            setStatus('isi');
          }}
        >
          Kirim cerita lain
        </button>
      </div>
    );

  const batas = BATAS[f.jenis];
  const attr = (k) => ({id: k, name: k, value: f[k], onChange: ubah(k), 'aria-invalid': !!galat[k], 'aria-describedby': galat[k] ? `${k}-galat` : undefined});
  const Galat = (k) => galat[k] && <p className="galat" id={`${k}-galat`}>{galat[k]}</p>;

  return (
    <form className="kartu" onSubmit={kirim} noValidate>
      <fieldset className="pilihan">
        <legend>Mau kirim apa?</legend>
        {[
          ['cerita', 'Cerita', 'Pengalaman atau karangan lengkap'],
          ['ide', 'Ide', 'Premis singkat untuk dikembangkan'],
        ].map(([v, judul, ket]) => (
          <label key={v} className={f.jenis === v ? 'aktif' : ''}>
            <input type="radio" name="jenis" value={v} checked={f.jenis === v} onChange={ubah('jenis')} />
            <strong>{judul}</strong>
            <span>{ket}</span>
          </label>
        ))}
      </fieldset>

      <label htmlFor="nama">Nama atau nama samaran</label>
      <input {...attr('nama')} maxLength={BATAS.nama.maks} autoComplete="nickname" placeholder="Misalnya: Aris" />
      {Galat('nama')}

      <label htmlFor="judul">Judul</label>
      <input {...attr('judul')} maxLength={BATAS.judul.maks} placeholder="Misalnya: Ketukan dari kamar kosong" />
      {Galat('judul')}

      <label htmlFor="isi">{f.jenis === 'ide' ? 'Idemu' : 'Ceritamu'}</label>
      <textarea {...attr('isi')} rows={f.jenis === 'ide' ? 5 : 10} maxLength={batas.maks} placeholder={f.jenis === 'ide' ? 'Apa yang terjadi, di mana, dan apa yang bikin merinding?' : 'Mulai dari tempat dan waktunya. Lalu, apa yang pertama kali terasa janggal?'} />
      <p className="hitung">
        {f.isi.length < batas.min ? `Minimal ${batas.min} karakter · ` : ''}
        {f.isi.length.toLocaleString('id-ID')} / {batas.maks.toLocaleString('id-ID')}
      </p>
      {Galat('isi')}

      <label htmlFor="kontak">Kontak <small>(boleh dikosongkan)</small></label>
      <input {...attr('kontak')} maxLength={BATAS.kontak.maks} placeholder="Akun TikTok, Instagram, atau email" />
      {Galat('kontak')}

      {/* kolom jebakan bot, disembunyikan dari manusia */}
      <div className="jebakan" aria-hidden="true">
        <label htmlFor="situs">Situs</label>
        <input id="situs" name="situs" value={f.situs} onChange={ubah('situs')} tabIndex={-1} autoComplete="off" />
      </div>

      <label className="centang">
        <input type="checkbox" checked={f.sebut_nama} onChange={ubah('sebut_nama')} />
        <span>Sebut nama atau nama samaranku kalau ceritaku dijadikan video.</span>
      </label>
      <label className="centang">
        <input id="setuju" type="checkbox" checked={f.setuju} onChange={ubah('setuju')} aria-invalid={!!galat.setuju} />
        <span>Ini ceritaku sendiri atau aku berhak membagikannya, tidak memuat data pribadi orang lain, dan boleh diubah serta dijadikan video.</span>
      </label>
      {Galat('setuju')}

      {pesan && <p className="galat pesan" role="alert">{pesan}</p>}
      <button className="tombol" type="submit" disabled={status === 'kirim'}>
        {status === 'kirim' ? 'Mengirim...' : 'Kirim'}
      </button>
    </form>
  );
}

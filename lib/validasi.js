import {BATAS} from './konfigurasi';

const rapi = (v) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : '');

// Dipakai di browser (pesan cepat) dan di server (penentu akhir).
export function periksa(masukan) {
  const data = {
    nama: rapi(masukan?.nama),
    jenis: masukan?.jenis === 'ide' ? 'ide' : 'cerita',
    judul: rapi(masukan?.judul),
    isi: rapi(masukan?.isi),
    kontak: rapi(masukan?.kontak),
    sebut_nama: masukan?.sebut_nama === true,
    setuju: masukan?.setuju === true,
  };
  const galat = {};
  const cek = (kunci, label, {min = 0, maks}) => {
    const n = data[kunci].length;
    if (n < min) galat[kunci] = `${label} minimal ${min} karakter.`;
    else if (n > maks) galat[kunci] = `${label} maksimal ${maks} karakter.`;
  };
  cek('nama', 'Nama', BATAS.nama);
  cek('judul', 'Judul', BATAS.judul);
  cek('isi', data.jenis === 'ide' ? 'Ide' : 'Cerita', BATAS[data.jenis]);
  cek('kontak', 'Kontak', BATAS.kontak);
  if (!data.setuju) galat.setuju = 'Centang persetujuan ini dulu.';
  return {data, galat, sah: Object.keys(galat).length === 0};
}

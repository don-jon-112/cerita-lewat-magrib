import Image from 'next/image';
import FormCerita from './FormCerita';
import Pintu from './Pintu';
import {CHANNEL} from '../lib/konfigurasi';
import adegan1 from '../public/adegan-1.jpg';
import adegan2 from '../public/adegan-2.jpg';
import adegan3 from '../public/adegan-3.jpg';

const ADEGAN = [
  [adegan1, 'Bu Ratna menyodorkan kunci Kamar 04 sambil tersenyum lebar', '"Jangan pernah dijawab. Jangan juga diintip."'],
  [adegan2, 'Aris duduk di kasur, keran menyala di balik tembok Kamar 05', 'Keran menyala di kamar yang katanya kosong.'],
  [adegan3, 'Aris menyorot senter ke tembok yang penuh bekas cakaran', 'Lalu ketukannya berubah jadi cakaran.'],
];

export default function Halaman() {
  const tautan = [
    ['TikTok', CHANNEL.tiktok],
    ['YouTube', CHANNEL.youtube],
  ].filter(([, url]) => url);
  return (
    <>
      <header className="atas">
        <div className="wadah hero">
          <div className="ajakan">
            <p className="merek">{CHANNEL.nama}</p>
            <h1>Cerita seram kamu, kami hidupkan.</h1>
            <p className="pengantar">Pernah dengar suara dari kamar kosong? Kirim ceritanya. Yang terpilih kami jadikan video animasi horor.</p>
            <div className="aksi">
              <a className="tombol" href="#tulis">Kirim cerita</a>
              {tautan.map(([nama, url]) => (
                <a key={nama} className="tautan" href={url} target="_blank" rel="noreferrer">Tonton di {nama}</a>
              ))}
            </div>
          </div>
          <Pintu />
        </div>
      </header>

      <section className="wadah" aria-labelledby="judul-cerita">
        <h2 id="judul-cerita">Cerita pertama: Kamar 04</h2>
        <p className="redup">Kos murah, satu aturan: di atas jam sepuluh malam, jangan jawab suara dari sebelah.</p>
        <div className="galeri">
          {ADEGAN.map(([src, alt, teks]) => (
            <figure key={alt}>
              <Image src={src} alt={alt} sizes="(max-width: 700px) 78vw, 320px" placeholder="blur" />
              <figcaption>{teks}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wadah" aria-labelledby="judul-alur">
        <h2 id="judul-alur">Dari kamu ke layar</h2>
        <ol className="alur">
          <li><strong>Kamu kirim</strong><span>Cerita lengkap, atau cukup satu ide yang bikin merinding.</span></li>
          <li><strong>Kami baca</strong><span>Semua kiriman dibaca dulu. Tidak ada yang tampil otomatis.</span></li>
          <li><strong>Jadi video</strong><span>Yang terpilih dianimasikan. Namamu disebut kalau kamu mau.</span></li>
        </ol>
      </section>

      <main className="wadah tulis" id="tulis">
        <h2>Selipkan ceritamu di bawah pintu</h2>
        <FormCerita />
      </main>

      <footer className="wadah">
        <div>
          <h3>Sebelum mengirim</h3>
          <ul>
            <li>Samarkan nama orang, alamat, dan tempat yang bisa dikenali.</li>
            <li>Jangan menyalin cerita milik orang lain.</li>
            <li>Tanpa kekerasan sadis, konten dewasa, SARA, atau menuduh orang nyata.</li>
            <li>Tidak semua kiriman dijadikan video, dan isinya bisa disesuaikan.</li>
          </ul>
        </div>
        <div>
          <h3>Data yang disimpan</h3>
          <p>Hanya isian formulir, waktu kirim, dan kode acak dari alamat internetmu untuk menahan spam. Kirimanmu tidak ditampilkan di halaman ini. Mau dihapus? Hubungi pengelola lewat channel dan sebutkan judulnya.</p>
        </div>
      </footer>
    </>
  );
}

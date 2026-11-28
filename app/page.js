import Image from 'next/image';
import FormCerita from './FormCerita';
import Pintu from './Pintu';
import {CHANNEL} from '../lib/konfigurasi';
import {muatDataHalamanUtama} from '../lib/data-publik';
import logo from '../public/logo.png';

export const revalidate = 60;

function domainTeroptimasi(url) {
  if (!url) return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  try {
    const {hostname, protocol} = new URL(url);
    return protocol === 'https:' && hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function GambarCerita({src, alt, width, height, sizes, className}) {
  if (!src) return <div className={`gambar-kosong ${className || ''}`} aria-hidden="true" />;
  if (domainTeroptimasi(src)) {
    return <Image src={src} alt={alt || ''} width={width} height={height} sizes={sizes} className={className} />;
  }
  return <img src={src} alt={alt || ''} loading="lazy" className={className} />;
}

export default async function Halaman() {
  const {episode, sorotan, tautanChannel} = await muatDataHalamanUtama();

  const tautan = [
    ['TikTok', tautanChannel.tiktok],
    ['YouTube', tautanChannel.youtube],
  ].filter(([, url]) => url);

  const linkSorotanUtama = sorotan?.tiktok_url || sorotan?.youtube_url || '';
  const platformSorotan = sorotan?.tiktok_url ? 'TikTok' : sorotan?.youtube_url ? 'YouTube' : '';
  const daftarAdegan =
    sorotan?.adegan?.length > 0
      ? sorotan.adegan
      : sorotan?.sampul_url
        ? [{url: sorotan.sampul_url, alt: sorotan.judul, teks: sorotan.ringkasan}]
        : [];

  return (
    <>
      <header className="atas">
        <div className="wadah hero">
          <div className="ajakan">
            <p className="merek">
              <Image src={logo} alt="" width={52} height={52} priority />
              {CHANNEL.nama}
            </p>
            <h1>Cerita seram kamu, kami hidupkan.</h1>
            <p className="pengantar">
              Pernah dengar suara dari kamar kosong atau panggilan selepas magrib? Tonton episodenya, atau kirim ceritamu sendiri untuk kami jadikan animasi horor berikutnya.
            </p>
            <div className="aksi">
              <a className="tombol" href="#tulis">Kirim cerita</a>
              <a className="tombol-sekunder" href="#daftar-episode">Tonton episode</a>
              {tautan.map(([nama, url]) => (
                <a key={nama} className="tautan" href={url} target="_blank" rel="noopener noreferrer">
                  Channel {nama} ↗
                </a>
              ))}
            </div>
          </div>
          <Pintu />
        </div>
      </header>

      {sorotan && (
        <section className="wadah seksi-sorotan" aria-labelledby="judul-cerita">
          <div className="kepala-sorotan">
            <div>
              <p className="label-kecil">
                <span>Sorotan Cerita</span>
                {sorotan.label_seri && <> · {sorotan.label_seri}</>}
              </p>
              <h2 id="judul-cerita">{sorotan.judul}</h2>
              {sorotan.ringkasan && <p className="redup">{sorotan.ringkasan}</p>}
            </div>
            <div className="aksi-sorotan">
              {linkSorotanUtama ? (
                <a
                  className="tombol tombol-kecil"
                  href={linkSorotanUtama}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ▶ Tonton di {platformSorotan}
                </a>
              ) : (
                <span className="lencana-segera">Segera tayang di TikTok</span>
              )}
              {sorotan.tiktok_url && sorotan.youtube_url && (
                <a
                  className="tautan"
                  href={sorotan.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  YouTube Shorts ↗
                </a>
              )}
            </div>
          </div>

          {daftarAdegan.length > 0 && (
            <div className="galeri">
              {daftarAdegan.map((item, idx) => {
                const isiPolaroid = (
                  <>
                    <GambarCerita
                      src={item.url}
                      alt={item.alt || sorotan.judul}
                      width={640}
                      height={522}
                      sizes="(max-width: 760px) 78vw, 320px"
                    />
                    {item.teks && <figcaption>{item.teks}</figcaption>}
                  </>
                );
                return (
                  <figure key={`${item.url}-${idx}`}>
                    {linkSorotanUtama ? (
                      <a
                        href={linkSorotanUtama}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tautan-polaroid"
                        aria-label={`Tonton ${sorotan.judul} di ${platformSorotan}`}
                      >
                        {isiPolaroid}
                      </a>
                    ) : (
                      isiPolaroid
                    )}
                  </figure>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="wadah" id="daftar-episode" aria-labelledby="judul-semua-episode">
        <div className="kepala-seksi">
          <div>
            <h2 id="judul-semua-episode">Semua episode</h2>
            <p className="redup">Pilih cerita untuk langsung menonton videonya di TikTok.</p>
          </div>
          <span className="jumlah-episode">{episode.length} episode</span>
        </div>

        <div className="grid-episode">
          {episode.map((ep) => {
            const urlTujuan = ep.tiktok_url || ep.youtube_url || '';
            const namaPlatform = ep.tiktok_url ? 'TikTok' : ep.youtube_url ? 'YouTube' : '';
            const gambarSampul = ep.sampul_url || ep.adegan?.[0]?.url || '';

            const isiKartu = (
              <>
                <div className="poster-episode">
                  <GambarCerita
                    src={gambarSampul}
                    alt={ep.judul}
                    width={600}
                    height={800}
                    sizes="(max-width: 600px) 90vw, (max-width: 960px) 45vw, 310px"
                  />
                  <div className="lapisan-poster">
                    {ep.label_seri && <span className="pita-seri">{ep.label_seri}</span>}
                    {ep.sorotan && <span className="pita-baru">Terbaru</span>}
                  </div>
                  {urlTujuan && (
                    <span className="ikon-putar" aria-hidden="true">▶</span>
                  )}
                </div>
                <div className="isi-episode">
                  <h3>{ep.judul}</h3>
                  {ep.ringkasan && <p>{ep.ringkasan}</p>}
                  <div className="kaki-episode">
                    {urlTujuan ? (
                      <span className="ajakan-tonton">▶ Tonton di {namaPlatform} ↗</span>
                    ) : (
                      <span className="status-segera">Segera di TikTok</span>
                    )}
                  </div>
                </div>
              </>
            );

            if (urlTujuan) {
              return (
                <a
                  key={ep.id || ep.slug}
                  href={urlTujuan}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="kartu-episode bisa-diklik"
                >
                  {isiKartu}
                </a>
              );
            }

            return (
              <article key={ep.id || ep.slug} className="kartu-episode belum-tayang">
                {isiKartu}
              </article>
            );
          })}
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
          <p>
            Hanya isian formulir, waktu kirim, dan kode acak dari alamat internetmu untuk menahan spam. Kirimanmu tidak ditampilkan di halaman ini. Mau dihapus? Hubungi pengelola lewat channel dan sebutkan judulnya.
          </p>
        </div>
      </footer>
    </>
  );
}

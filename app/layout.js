import {Bricolage_Grotesque, Plus_Jakarta_Sans, Kalam} from 'next/font/google';
import './globals.css';
import {CHANNEL} from '../lib/konfigurasi';

const judul = Bricolage_Grotesque({subsets: ['latin'], display: 'swap', variable: '--f-judul'});
const isi = Plus_Jakarta_Sans({subsets: ['latin'], display: 'swap', variable: '--f-isi'});
const tangan = Kalam({subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--f-tangan'});

export const metadata = {
  title: `${CHANNEL.nama} | Kirim Cerita Horor`,
  description: 'Kirim ide atau cerita horormu. Yang terpilih dijadikan video animasi.',
};

export const viewport = {themeColor: '#141735'};

export default function RootLayout({children}) {
  return (
    <html lang="id" className={`${judul.variable} ${isi.variable} ${tangan.variable}`}>
      <body>{children}</body>
    </html>
  );
}

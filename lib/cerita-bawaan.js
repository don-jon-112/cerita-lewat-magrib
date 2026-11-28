// Data bawaan yang dipakai bila tabel episode di Supabase belum dibuat atau .env.local belum diisi.
export const EPISODE_BAWAAN = [
  {
    id: 3,
    slug: 'suara-ibu-di-dapur',
    urutan: 30,
    label_seri: 'Cerita #2',
    judul: 'Suara Ibu di Dapur',
    ringkasan:
      'Dina dipanggil ibunya dari dapur selepas magrib. Saat mulutnya hampir menjawab, masuk pesan di HP: "Ojeknya mogok. Ibu masih di pasar."',
    sampul_url: '/sampul/suara-ibu-part-1.jpg',
    tiktok_url: '',
    youtube_url: '',
    sorotan: true,
    terbit: true,
    adegan: [
      {
        url: '/suara-ibu-1.jpg',
        alt: 'Ibu memegang HP di pasar malam di samping ojek yang mogok',
        teks: 'Dipanggil dari dapur, padahal pesan masuk: "Ojeknya mogok. Ibu masih di pasar."',
      },
      {
        url: '/suara-ibu-2.jpg',
        alt: 'Gagang pintu kamar Dina turun dua kali dari luar',
        teks: 'Gagang pintu turun pelan. Pantangannya cuma satu: jangan disahuti.',
      },
      {
        url: '/suara-ibu-3.jpg',
        alt: 'Dina duduk di sofa sebelah sosok menyerupai Ibu saat HP berdering',
        teks: 'Saat telepon asli dari Ibu berdering, perempuan di sebelahnya menoleh.',
      },
    ],
  },
  {
    id: 2,
    slug: 'kamar-04-part-2',
    urutan: 20,
    label_seri: 'Cerita #1 · Part 2',
    judul: 'Kamar 04: Kunci yang Dibuang',
    ringkasan:
      'Kamar 05 ternyata sudah dikunci mati sejak tiga tahun lalu. Lalu siapa yang menyalakan keran dan berbisik di depan pintu Aris?',
    sampul_url: '/sampul/kamar-04-part-2.jpg',
    tiktok_url: '',
    youtube_url: '',
    sorotan: false,
    terbit: true,
    adegan: [
      {
        url: '/adegan-2.jpg',
        alt: 'Suara air mengalir dari Kamar 05 tengah malam',
        teks: '"Kamar 05 sudah dikunci mati tiga tahun lalu."',
      },
      {
        url: '/adegan-3.jpg',
        alt: 'Aris menyorot senter ke bekas cakaran di tembok',
        teks: '"Terus yang di belakang kamu... siapa?"',
      },
    ],
  },
  {
    id: 1,
    slug: 'kamar-04-part-1',
    urutan: 10,
    label_seri: 'Cerita #1 · Part 1',
    judul: 'Kamar 04: Aturan Jam Sepuluh',
    ringkasan:
      'Kos murah di tengah kota dengan satu pesan ibu kos: di atas jam sepuluh malam, jangan jawab suara apa pun dari kamar sebelah.',
    sampul_url: '/sampul/kamar-04-part-1.jpg',
    tiktok_url: '',
    youtube_url: '',
    sorotan: false,
    terbit: true,
    adegan: [
      {
        url: '/adegan-1.jpg',
        alt: 'Bu Ratna menyodorkan kunci Kamar 04 sambil tersenyum lebar',
        teks: '"Jangan pernah dijawab. Jangan juga diintip."',
      },
      {
        url: '/adegan-2.jpg',
        alt: 'Aris duduk di kasur, keran menyala di balik tembok Kamar 05',
        teks: 'Keran menyala di kamar yang katanya kosong.',
      },
      {
        url: '/adegan-3.jpg',
        alt: 'Aris menyorot senter ke tembok yang penuh bekas cakaran',
        teks: 'Lalu ketukannya berubah jadi cakaran.',
      },
    ],
  },
];

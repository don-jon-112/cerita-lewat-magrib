import {EPISODE_BAWAAN} from './cerita-bawaan';
import {CHANNEL} from './konfigurasi';
import {bukaDatabase} from './supabase-admin';

export async function muatDataHalamanUtama() {
  const db = bukaDatabase();
  let daftarEpisode = null;
  let tautanChannel = {
    tiktok: CHANNEL.tiktok || '',
    youtube: CHANNEL.youtube || '',
  };

  if (db) {
    const [hasilEpisode, hasilPengaturan] = await Promise.all([
      db
        .from('episode')
        .select('*')
        .eq('terbit', true)
        .order('urutan', {ascending: false})
        .order('id', {ascending: false}),
      db
        .from('pengaturan_admin')
        .select('kunci, nilai')
        .in('kunci', ['channel_tiktok', 'channel_youtube']),
    ]);

    if (!hasilEpisode.error && Array.isArray(hasilEpisode.data) && hasilEpisode.data.length > 0) {
      daftarEpisode = hasilEpisode.data.map((ep) => ({
        ...ep,
        adegan: Array.isArray(ep.adegan) ? ep.adegan : [],
      }));
    }

    if (!hasilPengaturan.error && Array.isArray(hasilPengaturan.data)) {
      const peta = Object.fromEntries(hasilPengaturan.data.map((b) => [b.kunci, b.nilai]));
      if (peta.channel_tiktok) tautanChannel.tiktok = peta.channel_tiktok;
      if (peta.channel_youtube) tautanChannel.youtube = peta.channel_youtube;
    }
  }

  const episode = daftarEpisode || EPISODE_BAWAAN;
  const sorotan = episode.find((e) => e.sorotan) || episode[0] || null;

  return {
    episode,
    sorotan,
    tautanChannel,
  };
}

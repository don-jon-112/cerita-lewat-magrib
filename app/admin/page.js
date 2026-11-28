import './admin.css';
import PanelAdmin from './PanelAdmin';
import {ambilPengaturanMap, pastikanAdmin} from '../../lib/autentikasi';
import {bukaDatabase} from '../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin CMS | Cerita Lewat Magrib',
  robots: {index: false, follow: false},
};

export default async function HalamanAdmin() {
  const db = bukaDatabase();
  if (!db) {
    return <PanelAdmin sudahMasukAwal={false} statusServer="belum-env" />;
  }

  const pengaturan = await ambilPengaturanMap(db);
  if (!pengaturan.password_hash) {
    return <PanelAdmin sudahMasukAwal={false} statusServer="belum-password" />;
  }

  const sesi = await pastikanAdmin();
  return <PanelAdmin sudahMasukAwal={sesi.sah} statusServer="siap" />;
}

import {createClient} from '@supabase/supabase-js';

export const NAMA_BUCKET = 'media-cerita';

export function bukaDatabase() {
  const {SUPABASE_URL, SUPABASE_SECRET_KEY} = process.env;
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: {persistSession: false},
  });
}

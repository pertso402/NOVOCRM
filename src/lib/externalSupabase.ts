import { createClient } from '@supabase/supabase-js';

const EXTERNAL_SUPABASE_URL = 'https://nnnrnaxvghgbtqjlxjnk.supabase.co';
const EXTERNAL_SUPABASE_ANON_KEY = 'sb_publishable_4NneyQucsf6rHMQpF81IQw_LwMWyIEb';

// Client for connecting to the user's external Supabase project
// This project has the leads, scripts tables and v_metrics_* views
export const externalSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_ANON_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  }
});

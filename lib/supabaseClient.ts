import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan Key dari Project Supabase Anda
// Sebaiknya simpan ini di .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
// We cast import.meta to any to avoid TypeScript errors when vite/client types are missing or not picked up
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'public-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
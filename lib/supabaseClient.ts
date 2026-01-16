import { createClient } from '@supabase/supabase-js';

// Mengambil variabel lingkungan dari file .env
// Pastikan Anda telah membuat file .env di root folder dengan isi:
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...

// Fix: Cast import.meta to any to resolve missing 'env' property type error and missing vite/client types
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "⚠️ Supabase URL atau Anon Key tidak ditemukan. Pastikan Anda telah membuat file .env yang berisi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');
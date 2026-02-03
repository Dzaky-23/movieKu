import { createClient } from '@supabase/supabase-js';

// Ambil config dari .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Supabase URL atau Anon Key belum diset di .env.local');
}

// Export client biar bisa dipake di mana aja
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
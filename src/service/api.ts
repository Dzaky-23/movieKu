import { supabase } from '@/lib/supabaseClient';

// --- TIPE DATA (Types) ---
// Sesuaikan dengan tabel database kita
export interface Profile {
    id: string;
    name: string;
    email: string;
    interests: string[];
    avatar_url?: string;
}

export interface Content {
    id: string;
    tmdb_id: number;
    title: string;
    overview: string;
    poster_path: string;
    backdrop_path?: string;
    media_type: 'movie' | 'tv';
    category: string;
    vote_average: number;
    release_date: string;
    genres: string[];
    similarity?: number; // Khusus hasil search AI
}

// --- API SERVICE ---
export const api = {

    // 1. AUTHENTICATION
    auth: {
        // Register User Baru
        async register(email: string, pass: string, name: string) {
            // Kita kirim 'name' di metadata, biar Trigger SQL 'handle_new_user'
            // bisa otomatis masukin nama ke tabel profiles.
            const { data, error } = await supabase.auth.signUp({
                email,
                password: pass,
                options: {
                    data: { name: name } // <-- Metadata penting!
                }
            });
            return { user: data.user, error };
        },

        // Login
        async login(email: string, pass: string) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: pass
            });
            return { user: data.user, error };
        },

        // Logout
        async logout() {
            const { error } = await supabase.auth.signOut();
            return { error };
        },

        // Cek User yang sedang login
        async getCurrentUser() {
            const { data } = await supabase.auth.getUser();
            return data.user;
        }
    },

    // 2. USER PROFILE
    user: {
        // Ambil data profile lengkap (termasuk interests)
        async getProfile(userId: string) {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            return { profile: data as Profile | null, error };
        },

        // Update Minat User (Personality)
        async updateInterests(userId: string, newInterests: string[]) {
            const { data, error } = await supabase
                .from('profiles')
                .update({ interests: newInterests })
                .eq('id', userId)
                .select()
                .single();

            return { profile: data as Profile | null, error };
        }
    },

    // 3. CONTENT & AI RECOMMENDATION
    content: {
        // Ambil film trending (Rating tertinggi)
        async getTrending(limit = 10) {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .order('vote_average', { ascending: false })
                .limit(limit);

            return { data: data as Content[] || [], error };
        },

        // Ambil berdasarkan kategori (Anime/Drakor)
        async getByCategory(category: string, limit = 10) {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('category', category)
                .limit(limit);

            return { data: data as Content[] || [], error };
        },

        // PENCARIAN AI (Vector Search)
        // Nanti function ini akan kita upgrade pake embedding dari text input
        // Untuk sekarang, kita panggil RPC database
        async searchAI(embeddingVector: number[], filterType?: 'movie' | 'tv') {
            const { data, error } = await supabase.rpc('match_content', {
                query_embedding: embeddingVector,
                match_threshold: 0.5, // Tingkat kemiripan minimal 50%
                match_count: 20,
                filter_media_type: filterType || null
            });

            return { data: data as Content[] || [], error };
        }
    }
};
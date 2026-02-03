import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Konfigurasi dotenv untuk membaca file .env.local di root project
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TMDB_API_KEY = process.env.TMDB_API_KEY;

/**
 * Fungsi untuk mengambil data film populer dari TMDB API
 */
async function fetchPopularMovies(page: number = 1) {
  const url = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.results || [];
  } catch (err) {
    console.error("❌ Gagal fetch data dari TMDB:", err);
    return [];
  }
}

/**
 * Fungsi utama untuk sinkronisasi data ke Supabase
 */
async function sync() {
  console.log("🚀 Memulai proses sinkronisasi data film...");

  // Validasi env variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !TMDB_API_KEY) {
    console.error("❌ Error: Pastikan NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, dan TMDB_API_KEY sudah diisi di .env.local!");
    return;
  }

  // Kita ambil 5 halaman pertama (kira-kira 100 film) sebagai database awal
  for (let i = 1; i <= 5; i++) {
    console.log(`📦 Mengambil data TMDB halaman ${i}...`);
    const movies = await fetchPopularMovies(i);
    
    for (const movie of movies) {
      // Menggunakan upsert agar jika data sudah ada (berdasarkan tmdb_id), data akan diupdate (tidak duplikat)
      const { error } = await supabase.from('movies').upsert({
        tmdb_id: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        genres: movie.genre_ids ? movie.genre_ids.map(String) : [], 
      }, { onConflict: 'tmdb_id' });

      if (error) {
        console.error(`❌ Gagal simpan "${movie.title}":`, error.message);
      } else {
        console.log(`✅ Berhasil sinkron: ${movie.title}`);
      }
    }
  }
  
  console.log("\n✨ Sinkronisasi selesai! Cek tabel 'movies' di dashboard Supabase lu.");
}

// Jalankan script
sync();
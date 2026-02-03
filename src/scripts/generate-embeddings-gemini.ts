import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Memuat konfigurasi dari file .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Inisialisasi Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbeddings() {
  console.log("🧠 Memulai proses Brain Integration (Gemini 768D)...");

  // 1. Ambil data film yang belum memiliki embedding
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, overview')
    .is('embedding', null);

  if (error) {
    console.error("❌ Gagal mengambil data film dari Supabase:", error);
    return;
  }

  if (!movies || movies.length === 0) {
    console.log("✅ Semua film sudah memiliki embedding.");
    return;
  }

  console.log(`🎬 Ditemukan ${movies.length} film untuk diproses.`);

  for (const movie of movies) {
    if (!movie.overview) {
      console.log(`⏩ Melewati "${movie.title}" karena tidak ada sinopsis.`);
      continue;
    }

    try {
      // 2. Kirim sinopsis ke Gemini untuk diubah menjadi vektor (768 dimensi)
      const result = await model.embedContent(movie.overview);
      const embedding = result.embedding.values;

      // 3. Simpan vektor embedding kembali ke database Supabase
      const { error: updateError } = await supabase
        .from('movies')
        .update({ embedding })
        .eq('id', movie.id);

      if (updateError) throw updateError;
      
      console.log(`✅ Embedding berhasil untuk: ${movie.title}`);
    } catch (err) {
      console.error(`❌ Gagal memproses "${movie.title}":`, err);
      // Jika terkena rate limit free tier, kita beri jeda sedikit
      console.log("⏳ Menunggu sejenak sebelum mencoba lagi...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("\n✨ Proses embedding selesai! Sekarang database kamu sudah pintar dan siap memberikan rekomendasi.");
}

// Menjalankan fungsi utama
generateEmbeddings();
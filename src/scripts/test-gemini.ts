import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Coba load .env.local dengan absolute path biar pasti ketemu
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`📂 Mencari .env.local di: ${envPath}`);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Gagal load file .env.local. Pastikan file ada di root project.");
} else {
  console.log("✅ File .env.local ditemukan.");
}

// 2. Ambil Key
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("\n❌ ERROR: Variable GOOGLE_GEMINI_API_KEY kosong/tidak ditemukan.");
  console.log("   Cek isi file .env.local lu.");
  process.exit(1);
}

// 3. Tampilin Key (Sensor dikit biar aman)
const maskedKey = apiKey.substring(0, 5) + "..." + apiKey.substring(apiKey.length - 5);
console.log(`🔑 API Key terbaca: ${maskedKey}`);
console.log(`   (Panjang karakter: ${apiKey.length})`);

// 4. Test Koneksi ke Google
async function testConnection() {
  console.log("\n📡 Mencoba menghubungi Google Gemini...");
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey as string);
    
    // Kita coba model yang paling basic dulu: embedding-001
    // Kalau ini jalan, berarti text-embedding-004 juga harusnya jalan
    const model = genAI.getGenerativeModel({ model: "embedding-001" });

    const text = "Tes koneksi 123";
    const result = await model.embedContent(text);
    
    console.log("✅ SUKSES! API Key valid.");
    console.log(`   Vector yang didapat: [${result.embedding.values.slice(0, 3)}...]`);
    console.log("\n👉 Kesimpulan: Masalah bukan di Key, tapi mungkin di script sebelumnya.");
    
  } catch (error: any) {
    console.error("\n❌ GAGAL KONEK KE GOOGLE.");
    console.error("   Pesan Error:", error.message);
    
    if (error.message.includes("API key not valid")) {
      console.log("\n⚠️ ANALISA: Google menolak key ini.");
      console.log("   Saran: Bikin key baru di https://aistudio.google.com/app/apikey");
    }
  }
}

testConnection();
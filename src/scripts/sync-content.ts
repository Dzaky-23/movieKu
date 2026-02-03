import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const DATA_DIR = path.join(process.cwd(), 'data');

if (!TMDB_API_KEY) {
  console.error("❌ Error: TMDB_API_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

// Genre Map Gabungan (Movie + TV)
const tmdbGenres: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics'
};

// Fetcher native tanpa library tambahan
async function fetchTMDB(endpoint: string, page: number) {
  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`;
  
  try {
    const res = await fetch(url); 
    if (!res.ok) throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    return await res.json() as any;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error}`);
  }
}

// Logic Detektif Kategori
function getCategory(item: any, type: 'movie' | 'tv'): string {
  if (type === 'movie') return 'Movie';
  
  const lang = item.original_language;
  const countries = item.origin_country || [];
  const genreIds = item.genre_ids || [];

  if (lang === 'ja' && genreIds.includes(16)) return 'Anime';
  if (lang === 'ko' && countries.includes('KR')) return 'Korean Drama';
  return 'TV Series';
}

async function syncContent() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  let allContent: any[] = [];
  
  // Kita ambil 5 halaman per kategori (~200 item total)
  const pages = 5; 

  console.log('🎬 Fetching Movies...');
  for (let i = 1; i <= pages; i++) {
    try {
      const data = await fetchTMDB('movie/top_rated', i);
      const movies = data.results.map((m: any) => ({
        tmdb_id: m.id,
        title: m.title,
        original_title: m.original_title,
        overview: m.overview,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        release_date: m.release_date,
        media_type: 'movie',
        category: 'Movie',
        genres: m.genre_ids.map((id: number) => tmdbGenres[id] || 'Unknown'),
        vote_average: m.vote_average,
        popularity: m.popularity
      }));
      allContent = [...allContent, ...movies];
    } catch (e) {
      console.error(`Error fetching movies page ${i}:`, e);
    }
  }

  console.log('📺 Fetching TV Series...');
  for (let i = 1; i <= pages; i++) {
    try {
      const data = await fetchTMDB('tv/top_rated', i);
      const tvShows = data.results.map((tv: any) => ({
        tmdb_id: tv.id,
        title: tv.name, // Mapping 'name' -> 'title'
        original_title: tv.original_name,
        overview: tv.overview,
        poster_path: tv.poster_path,
        backdrop_path: tv.backdrop_path,
        release_date: tv.first_air_date, // Mapping 'first_air_date' -> 'release_date'
        media_type: 'tv',
        category: getCategory(tv, 'tv'),
        genres: tv.genre_ids.map((id: number) => tmdbGenres[id] || 'Unknown'),
        vote_average: tv.vote_average,
        popularity: tv.popularity
      }));
      allContent = [...allContent, ...tvShows];
    } catch (e) {
      console.error(`Error fetching TV page ${i}:`, e);
    }
  }

  const outputPath = path.join(DATA_DIR, 'content_raw.json');
  fs.writeFileSync(outputPath, JSON.stringify(allContent, null, 2));
  console.log(`✅ Success! Fetched ${allContent.length} items.`);
  console.log(`📂 Saved to: ${outputPath}`);
}

syncContent().catch(console.error);
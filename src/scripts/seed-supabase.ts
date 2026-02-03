import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // WAJIB Service Role

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Config in .env.local');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const INPUT_FILE = path.join(process.cwd(), 'data', 'content_with_embeddings.json');

async function seedSupabase() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error('❌ Data not found. Run python script first!');
    return;
  }

  const content = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
  console.log(`🚀 Uploading ${content.length} items to table 'content'...`);

  const batchSize = 50;
  
  for (let i = 0; i < content.length; i += batchSize) {
    const batch = content.slice(i, i + batchSize);
    
    // Upsert ke tabel 'content'
    const { error } = await supabase
      .from('content')
      .upsert(batch, { onConflict: 'tmdb_id,media_type' });

    if (error) {
      console.error('Error uploading batch:', error);
    } else {
      console.log(`✅ Uploaded batch ${Math.floor(i / batchSize) + 1}`);
    }
  }

  console.log('🎉 Database seeding complete!');
}

seedSupabase().catch(console.error);
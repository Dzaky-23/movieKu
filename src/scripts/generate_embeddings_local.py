import json
import os
import time
from sentence_transformers import SentenceTransformer

# 1. SETUP MODEL
# Menggunakan 'all-mpnet-base-v2' (Output 768 dimensi, High Accuracy)
print("📥 Loading Local ML Model...")
model = SentenceTransformer('all-mpnet-base-v2')

# Path Setup
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INPUT_FILE = os.path.join(BASE_DIR, 'data', 'content_raw.json')
OUTPUT_FILE = os.path.join(BASE_DIR, 'data', 'content_with_embeddings.json')

def generate_local_embeddings():
    if not os.path.exists(INPUT_FILE):
        print(f"❌ File {INPUT_FILE} tidak ditemukan. Run sync-content.ts first!")
        return

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        content = json.load(f)

    print(f"🚀 Memulai embedding untuk {len(content)} item...")
    
    processed_content = []
    start_time = time.time()
    batch_size = 32 # Batching untuk efisiensi CPU
    
    for i in range(0, len(content), batch_size):
        batch = content[i:i+batch_size]
        print(f"📦 Processing {i+1} - {min(i+batch_size, len(content))}...")

        texts_to_embed = []
        valid_items = []

        for item in batch:
            if not item.get('overview'): continue
            
            # CONTEXT INJECTION
            # Format teks ini yang dibaca AI untuk memahami konten
            text = f"""
                Type: {item.get('category', 'Unknown')}
                Title: {item.get('title', '')}
                Original Title: {item.get('original_title', '')}
                Genres: {', '.join(item.get('genres', []))}
                Overview: {item.get('overview', '')}
                Release Date: {item.get('release_date', '')}
            """.strip()
            
            texts_to_embed.append(text)
            valid_items.append(item)

        if not texts_to_embed: continue

        # GENERATE VECTOR (Heavy Lifting)
        embeddings = model.encode(texts_to_embed)

        for idx, item in enumerate(valid_items):
            item['embedding'] = embeddings[idx].tolist()
            processed_content.append(item)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_content, f, indent=2)

    duration = time.time() - start_time
    print(f"\n✅ SELESAI dalam {duration:.2f} detik.")
    print(f"📂 Output: {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_local_embeddings()
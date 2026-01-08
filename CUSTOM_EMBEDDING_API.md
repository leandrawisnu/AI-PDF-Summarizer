# Custom Embedding API Setup

## Overview
Menggunakan custom embedding API yang sudah di-deploy di HuggingFace Spaces.

## API Details

**Endpoint:** `https://statelystatic-siprakerin-embedding.hf.space/embed`

**Request:**
```json
{
  "text": "Your text here"
}
```

**Response:**
```json
{
  "embedding": [0.028, 0.035, ...] // 1024 dimensions
}
```

## Benefits

✅ **No rate limits** - Your own API  
✅ **No costs** - Free to use  
✅ **Reliable** - Deployed on HuggingFace Spaces  
✅ **1024 dimensions** - Good quality embeddings  
✅ **No local model** - Lightweight deployment  

## Setup Steps

### 1. Update Database Schema

```sql
-- Connect to PostgreSQL
psql -U postgres -d ai_pdf_management

-- Run migration
UPDATE summaries SET embedding = NULL;
ALTER TABLE summaries ALTER COLUMN embedding TYPE vector(1024);
```

Or use migration file:
```bash
psql -U postgres -d ai_pdf_management -f "backend - go/migrate/004_update_embedding_to_1024.sql"
```

### 2. Install Dependencies

```bash
cd "backend - python"
pip install -r requirements.txt
```

No heavy dependencies! Just `requests` library.

### 3. Start Backends

```bash
# Terminal 1: Python
cd "backend - python"
python main.py

# Terminal 2: Go
cd "backend - go"
go run main.go
```

### 4. Test Embedding Endpoint

```bash
curl -X POST http://localhost:8000/embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}' | jq
```

Expected response:
```json
{
  "embedding": [0.028, 0.035, ...],
  "dimensions": 1024,
  "processing_time": 0.5,
  "model": "custom-embedding-api",
  "status": "success"
}
```

## Performance

- **Speed:** ~500ms per embedding (includes network latency)
- **Dimensions:** 1024 (better than 384)
- **Rate Limit:** None (your own API)
- **Cost:** Free

## Troubleshooting

### Slow Response
Normal! API is hosted on HuggingFace Spaces (free tier). First request may take longer.

### Connection Timeout
Check internet connection and API availability:
```bash
curl https://statelystatic-siprakerin-embedding.hf.space/embed \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}'
```

### Empty Embeddings
Check Python backend logs for API errors. Backend has retry logic (3 attempts).

## Migration Checklist

- [x] Update Python backend to use custom API
- [x] Update requirements.txt (removed sentence-transformers)
- [x] Update Go model to vector(1024)
- [x] Create database migration
- [ ] Run database migration
- [ ] Restart backends
- [ ] Regenerate summaries
- [ ] Test RAG chat

## Next Steps

1. **Run database migration** (change vector dimension to 1024)
2. **Restart backends**
3. **Regenerate summaries** (old ones have wrong dimensions)
4. **Test RAG chat** with pdf_ids

## Comparison

| Feature | Gemini | HuggingFace | Local Model | Custom API |
|---------|--------|-------------|-------------|------------|
| Rate Limit | 60/min | Deprecated | None | None |
| Cost | Free tier | N/A | Free | Free |
| Dimensions | 768 | 384 | 384 | **1024** |
| Speed | ~150ms | N/A | ~20ms | ~500ms |
| Setup | API key | N/A | Download 80MB | None |
| Reliability | ⚠️ Limits | ❌ Deprecated | ✅ Good | ✅ Good |

## Summary

✅ **Problem:** Gemini rate limits, HuggingFace deprecated  
✅ **Solution:** Custom embedding API (1024 dimensions)  
✅ **Result:** No rate limits, no local model, reliable!

**Status:** Ready to use! 🚀
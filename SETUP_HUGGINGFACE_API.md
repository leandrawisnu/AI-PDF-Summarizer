# Setup: HuggingFace API Embeddings

## Quick Start (5 minutes)

### 1. Update .env file

```bash
cd "backend - python"
```

Edit `.env`:
```
GEMINI_API_KEY=your_existing_key
HUGGINGFACE_TOKEN=hf_your_token_here  # Optional but recommended
```

**Get HuggingFace token (optional):**
- Go to https://huggingface.co/settings/tokens
- Create new token (Read access)
- Copy and paste to .env

**Without token:** Works fine, just lower rate limits

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

Much lighter now! No torch or large models to download.

### 3. Update database

```sql
-- Connect to PostgreSQL
psql -U postgres -d ai_pdf_management

-- Run migration
UPDATE summaries SET embedding = NULL;
ALTER TABLE summaries ALTER COLUMN embedding TYPE vector(384);
```

### 4. Start backends

```bash
# Terminal 1: Python
cd "backend - python"
python main.py

# Terminal 2: Go
cd "backend - go"
go run main.go
```

### 5. Test

```bash
# Test embedding
curl -X POST http://localhost:8000/embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "test"}' | jq

# Should return 384 dimensions
```

## What Changed?

### Before (Local Model)
- ❌ Download 80MB model
- ❌ Uses 500MB RAM
- ❌ Slow startup
- ✅ Fast inference (~20ms)
- ✅ Works offline

### After (HuggingFace API)
- ✅ No download needed
- ✅ Minimal RAM usage
- ✅ Fast startup
- ⚠️ Slower inference (~100ms)
- ⚠️ Needs internet

## Benefits

1. **No Gemini rate limits** - No more quota errors!
2. **Lighter deployment** - Smaller Docker images
3. **Faster startup** - No model loading
4. **Free forever** - HuggingFace Inference API is free

## Rate Limits

- **With token:** ~1000 requests/hour
- **Without token:** ~100 requests/hour
- **Much better than Gemini:** 60/min, 1500/day

## Troubleshooting

### First request slow?
Normal! Model needs to wake up (~500ms). Next requests faster (~100ms).

### 503 errors?
Model is loading. Backend retries automatically. Wait 5-10 seconds.

### Want faster inference?
Add HuggingFace token to .env for priority access.

## Docker Deployment

Update `docker-compose.yml`:

```yaml
backend-python:
  environment:
    - GEMINI_API_KEY=${GEMINI_API_KEY}
    - HUGGINGFACE_TOKEN=${HUGGINGFACE_TOKEN}
```

Then:
```bash
docker-compose up -d
```

## Next Steps

1. ✅ Regenerate summaries (old ones won't have embeddings)
2. ✅ Test RAG chat with pdf_ids
3. ✅ Monitor performance

See [HUGGINGFACE_API_SETUP.md](./HUGGINGFACE_API_SETUP.md) for detailed docs.
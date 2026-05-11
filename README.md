# JesAI Law & Order v2.0 — FREE Edition

> **Bangladesh Legal AI using FREE APIs only** — Groq + HuggingFace + Supabase

## Free API Stack

| Component | Service | Free Tier |
|-----------|---------|-----------|
| LLM | Groq (Llama 3.1 70B) | 20 req/min, 1.4M tokens/day |
| Embeddings | HuggingFace Inference | Free tier available |
| Database | Supabase | 500MB, 2GB bandwidth |
| Auth | Supabase Auth | Free tier |
| Rate Limit | Supabase (built-in) | Free |
| Hosting | Vercel | 100GB bandwidth |

## Quick Deploy to Vercel

```bash
# 1. Fork this repo to your GitHub
# 2. Create Supabase project at supabase.com
# 3. Enable pgvector extension in Supabase
# 4. Run migration SQL in Supabase SQL Editor
# 5. Get Groq API key at console.groq.com
# 6. Get HuggingFace token at huggingface.co/settings/tokens
# 7. Connect repo to Vercel
# 8. Add environment variables in Vercel dashboard
# 9. Deploy!
```

## Environment Variables

```env
GROQ_API_KEY=gsk_your_key
HF_API_TOKEN=hf_your_token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## Seed Database

```bash
npx tsx scripts/seed-knowledge-base.ts
```

## Features

- ✅ **Semantic Search** — HuggingFace embeddings (384-dim) with pgvector HNSW
- ✅ **Religion Branching** — Mandatory modal for family law
- ✅ **Safety Scanner** — Critical keywords trigger escalation
- ✅ **Citation Validation** — Post-process verification
- ✅ **Confidence Thresholds** — Rejects low-confidence matches
- ✅ **Free LLM** — Groq Llama 3.1 70B with Mixtral fallback

## License

AGPL-3.0
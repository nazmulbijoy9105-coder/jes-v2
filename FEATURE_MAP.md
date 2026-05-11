# JesAI v2.0 FREE — Feature-to-File Mapping

## 1. Semantic Search (Vector Embeddings + pgvector HNSW)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/lib/retrieval/hybrid-engine.ts` | 1-120 | Core retrieval engine using HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (384-dim) + Supabase pgvector HNSW |
| `supabase/migrations/001_initial_schema.sql` | 14, 46-48 | Defines `VECTOR(384)` column + HNSW index with cosine similarity |
| `supabase/migrations/001_initial_schema.sql` | 95-118 | `match_knowledge_chunks()` RPC function for vector search |
| `scripts/seed-knowledge-base.ts` | 85-95 | Generates embeddings via HuggingFace Inference API and stores in Supabase |

**How it works:**
1. User query → `generateEmbedding()` calls HuggingFace API → 384-dim vector
2. `vectorSearch()` calls Supabase `match_knowledge_chunks()` RPC
3. pgvector HNSW index does cosine similarity search in <50ms
4. Results fused with keyword search via Reciprocal Rank Fusion

---

## 2. Religion Branching (Family Law Personal Law Selection)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/app/api/chat/route.ts` | 58-65 | **Backend:** Detects `area === 'family'` + missing religion → returns `requiresReligion: true` |
| `src/components/chat/religion-modal.tsx` | 1-55 | **Frontend:** Modal with 4 religion options (Muslim/Hindu/Christian/Adibashi) |
| `src/components/chat/chat-interface.tsx` | 42-46 | **Frontend:** Receives `requiresReligion` → shows modal |
| `src/lib/retrieval/hybrid-engine.ts` | 45-47 | **Backend:** Filters vector search by religion: `.or('religion.eq.${context.religion},religion.eq.general')` |
| `src/lib/types.ts` | 3 | `Religion` type definition |
| `supabase/migrations/001_initial_schema.sql` | 5 | `religion` column with CHECK constraint |

**How it works:**
1. User asks family law question without religion set
2. API returns `requiresReligion: true` + prompt
3. Frontend shows modal with 4 personal law systems
4. User selects religion → stored in profile
5. All future family queries filter by that religion

---

## 3. Safety Scanner (Critical Keyword Escalation)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/lib/safety/scanner.ts` | 1-120 | **Complete safety system** — pre-filter + post-filter |
| `src/lib/safety/scanner.ts` | 5-28 | `CRITICAL_KEYWORDS` array: arrest, domestic violence, child marriage, etc. |
| `src/lib/safety/scanner.ts` | 30-42 | `HIGH_KEYWORDS` array: divorce, property dispute, fraud, etc. |
| `src/lib/safety/scanner.ts` | 44-55 | `MEDIUM_KEYWORDS` array: contract breach, consumer rights, etc. |
| `src/lib/safety/scanner.ts` | 57-95 | `scan()` method — pre-filter: detects keywords → assigns severity |
| `src/lib/safety/scanner.ts` | 97-120 | `postScan()` method — post-filter: blocks dangerous advice patterns |
| `src/app/api/chat/route.ts` | 50-56 | Calls `SafetyScanner.scan()` before any processing |
| `src/app/api/chat/route.ts` | 91-95 | Calls `SafetyScanner.postScan()` after LLM generation |
| `src/components/chat/safety-banner.tsx` | 1-50 | **Frontend:** Renders critical/high severity banners with emergency contacts |
| `src/components/chat/chat-interface.tsx` | 65-67 | Displays `SafetyBanner` for critical responses |
| `src/tests/safety.test.ts` | 1-20 | Unit tests for safety scanner |

**How it works:**
1. **Pre-filter:** Query scanned against 50+ critical/high/medium keywords
2. Critical hits → immediate escalation with emergency contacts (16430, Bar Council)
3. **Post-filter:** LLM output scanned for dangerous patterns ("ignore court order", "destroy evidence")
4. Both filters logged to `safety_incidents` table

---

## 4. Citation Validation (Post-Process Verification)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/lib/validation/citation-validator.ts` | 1-50 | **Complete citation validator** |
| `src/lib/validation/citation-validator.ts` | 8-20 | Checks if cited Act exists in retrieved chunks |
| `src/lib/validation/citation-validator.ts` | 22-35 | Checks if cited Section exists in that Act |
| `src/lib/validation/citation-validator.ts` | 37-42 | Cross-references against Bangladesh Code database |
| `src/app/api/chat/route.ts` | 103-105 | Calls `CitationValidator.validate()` after LLM output |
| `src/app/api/chat/route.ts` | 108-110 | Only verified citations included in final response |

**How it works:**
1. LLM generates response with Act/Section citations
2. Validator extracts citations using regex pattern
3. Checks each citation against retrieved knowledge chunks
4. Invalid citations flagged with error messages + suggestions
5. Only verified citations shown to user

---

## 5. Confidence Thresholds (Low Confidence = "I Don't Know")

| File | Lines | What It Does |
|------|-------|-------------|
| `src/lib/retrieval/hybrid-engine.ts` | 12 | `MIN_CONFIDENCE_THRESHOLD = 0.65` |
| `src/lib/retrieval/hybrid-engine.ts` | 28-30 | Filters results below threshold: `filtered = fused.filter(r => r.similarity >= 0.65)` |
| `src/lib/retrieval/hybrid-engine.ts` | 85-95 | `calculateConfidence()`: high (≥0.85), medium (≥0.70), low (≥0.50), none |
| `src/app/api/chat/route.ts` | 67-74 | If `confidence === 'none'` → returns "I don't have specific information..." |
| `src/components/chat/confidence-badge.tsx` | 1-25 | **Frontend:** Visual badge showing confidence level (High/Medium/Low/Insufficient) |
| `src/components/chat/chat-interface.tsx` | 72-74 | Displays `ConfidenceBadge` below each response |

**How it works:**
1. Hybrid retrieval returns chunks with similarity scores
2. Chunks below 0.65 similarity are filtered out
3. Overall confidence calculated from top + average scores
4. If `none` → API refuses to answer, recommends human lawyer
5. User sees confidence badge on every response

---

## 6. Free LLM (Groq — No Paid APIs)

| File | Lines | What It Does |
|------|-------|-------------|
| `src/lib/llm/orchestrator.ts` | 1-120 | **Complete LLM orchestrator using Groq only** |
| `src/lib/llm/orchestrator.ts` | 5-7 | Three Groq models: Llama 3.1 70B (primary), Mixtral 8x7B (fallback), Gemma2 9B (tertiary) |
| `src/lib/llm/orchestrator.ts` | 20-65 | `generateResponse()` — tries all 3 models in cascade |
| `src/lib/llm/orchestrator.ts` | 67-95 | `buildSystemPrompt()` — injects retrieved docs + safety context + religion context |
| `src/lib/llm/orchestrator.ts` | 97-110 | `extractCitations()` — regex extraction of Act/Section from LLM output |
| `src/app/api/chat/route.ts` | 76-79 | Calls `LLMOrchestrator.generateResponse()` |
| `package.json` | 10 | `groq-sdk` dependency (free tier) |
| `.env.local.template` | 4-5 | `GROQ_API_KEY` — only paid API key needed (free tier available) |

**How it works:**
1. Primary: Llama 3.1 70B (best legal reasoning)
2. If fails → Mixtral 8x7B (larger context)
3. If fails → Gemma2 9B (fastest)
4. All models use temperature=0.2 for accuracy
5. System prompt includes retrieved legal docs + safety flags + religion context

---

## Complete File List (39 files)

```
jesai-v2-free/
├── .env.local.template              # Environment variables (FREE APIs only)
├── .github/workflows/ci.yml         # GitHub Actions → Vercel
├── .gitignore
├── README.md
├── eslint.config.mjs
├── next.config.ts                   # Next.js config (CSP headers)
├── package.json                     # Dependencies (groq-sdk, @huggingface/inference)
├── postcss.config.mjs
├── scripts/
│   └── seed-knowledge-base.ts       # Seed DB + generate HF embeddings
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts         # MAIN API: safety → religion → retrieval → LLM → citation
│   │   │   └── cron/
│   │   │       └── reset-query-counts.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-interface.tsx   # Main chat UI
│   │   │   ├── confidence-badge.tsx # Confidence level badge
│   │   │   ├── religion-modal.tsx   # Religion selection modal
│   │   │   └── safety-banner.tsx    # Critical/high severity banner
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── dialog.tsx
│   ├── hooks/
│   │   └── use-auth.ts
│   ├── lib/
│   │   ├── llm/
│   │   │   └── orchestrator.ts      # Groq LLM orchestrator
│   │   ├── retrieval/
│   │   │   └── hybrid-engine.ts     # Semantic search (HF + pgvector)
│   │   ├── safety/
│   │   │   └── scanner.ts           # Safety scanner (pre + post filter)
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── types.ts                 # All TypeScript types
│   │   ├── utils.ts
│   │   └── validation/
│   │       └── citation-validator.ts # Citation verification
│   ├── middleware.ts
│   └── tests/
│       ├── safety.test.ts
│       └── setup.ts
├── supabase/
│   ├── functions/
│   │   ├── reset-query-counts/
│   │   │   └── index.ts
│   │   └── validate-knowledge-base/
│   │       └── index.ts
│   └── migrations/
│       └── 001_initial_schema.sql   # Database schema (VECTOR(384) + HNSW)
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                      # Vercel config + cron jobs
└── vitest.config.ts
```

---

## Deployment Checklist (Vercel Only)

1. ✅ Fork repo to GitHub
2. ✅ Create Supabase project → enable pgvector
3. ✅ Run migration SQL in Supabase SQL Editor
4. ✅ Get Groq API key (free): https://console.groq.com/keys
5. ✅ Get HuggingFace token (free): https://huggingface.co/settings/tokens
6. ✅ Connect GitHub repo to Vercel
7. ✅ Add env vars in Vercel dashboard
8. ✅ Deploy → `npx vercel --prod`
9. ✅ Run seed script: `npx tsx scripts/seed-knowledge-base.ts`
10. ✅ Done!

**Total monthly cost: $0** (all services on free tier)

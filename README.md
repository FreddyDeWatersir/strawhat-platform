# Straw Hat Platform

One Piece TCG document hub with PDF upload, structured cost extraction, and RAG-style chat over your invoices (Japan suppliers, FedEx, etc.).

**Stack:** Next.js 15 (Vercel) + Supabase (Postgres + pgvector) + Claude API + Voyage embeddings (server-side only).

**Cost:** $0 hosting on Vercel Hobby + Supabase Free. You pay for [Anthropic API](https://www.anthropic.com/pricing) and [Voyage embeddings](https://docs.voyageai.com/docs/pricing) usage (Voyage has a generous free tier).

---

## Features

- Upload **digital PDFs** (selectable text; no OCR)
- **Hybrid search** (Postgres FTS + semantic embeddings) for chat retrieval
- **Claude extraction** of supplier, date, amount, tracking, product set
- **Dashboard** with totals by currency
- **Cases** inventory: track each purchased case (12 boxes), mark boxes sold, see profit and break-even per case
- **Sources** directory: map JP/IT sourcing channels (tiered), record price observations manually, compare latest prices across providers
- **Chat** grounded in uploaded documents with filename citations

---

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) account (free)
- [Vercel](https://vercel.com) account (free)
- [Anthropic API key](https://console.anthropic.com/) with billing enabled
- [Voyage API key](https://dash.voyageai.com/) for embeddings (free tier available)

---

## 1. Supabase setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. **Database → Extensions** → enable **vector** (pgvector).
3. Open **SQL Editor** → run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql), then [`supabase/migrations/002_pgvector.sql`](supabase/migrations/002_pgvector.sql), then [`supabase/migrations/003_cases.sql`](supabase/migrations/003_cases.sql), then [`supabase/migrations/004_providers.sql`](supabase/migrations/004_providers.sql), then [`supabase/migrations/005_provider_resources.sql`](supabase/migrations/005_provider_resources.sql), then [`supabase/migrations/006_search_box_tweaks.sql`](supabase/migrations/006_search_box_tweaks.sql), then [`supabase/migrations/007_sealed_only_filters.sql`](supabase/migrations/007_sealed_only_filters.sql), then [`supabase/migrations/008_browse_fallback_plus_amazon_kakaku.sql`](supabase/migrations/008_browse_fallback_plus_amazon_kakaku.sql).
4. **Storage** → Create bucket named `pdfs` → set **Private**.
5. **Project Settings → API** — copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret → `SUPABASE_SERVICE_ROLE_KEY` (never expose in the browser)

> The app uses the **service role** on the server for uploads and search. Do not ship this key to client code.

---

## 2. Local development

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
SITE_PASSWORD=your-shared-password
ANTHROPIC_API_KEY=sk-ant-...
VOYAGE_API_KEY=pa-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in with `SITE_PASSWORD`.

---

## 3. Deploy to Vercel

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → Import repository.
3. Add the same environment variables as `.env.local`.
4. Deploy.

Share the Vercel URL and `SITE_PASSWORD` with your friend.

---

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SITE_PASSWORD` | Yes | Shared login password |
| `ANTHROPIC_API_KEY` | Yes | Claude API (server only) |
| `VOYAGE_API_KEY` | Yes | Voyage embeddings for hybrid search (server only) |
| `VOYAGE_EMBEDDING_MODEL` | No | Default: `voyage-4-lite` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (server only) |
| `ANTHROPIC_MODEL_EXTRACT` | No | Default: `claude-haiku-4-5` |
| `ANTHROPIC_MODEL_CHAT` | No | Default: `claude-sonnet-4-6` |

---

## Claude API costs (approximate)

- **Per PDF upload:** one Haiku call for structured extraction (~1–3k input tokens) + one Voyage embed call for all chunks (negligible cost on `voyage-4-lite`).
- **Per chat message:** one Voyage query embed (~20 tokens) + one Sonnet call with retrieved chunks (~2–8k input tokens).

Use Haiku for extraction and Sonnet for chat to balance cost vs quality. Monitor Anthropic usage in the [Anthropic console](https://console.anthropic.com/) and Voyage in the [Voyage dashboard](https://dash.voyageai.com/).

---

## Limits

- PDF max **20 MB** per upload
- Vercel Hobby: **60s** function timeout (sufficient for typical PDFs)
- Supabase Free: **2 active projects**, **500 MB** DB, **1 GB** storage
- Scanned/image-only PDFs will fail until OCR is added (Phase 2)

---

## Project structure

```
app/
  (auth)/login/          # Password login
  (protected)/           # Dashboard, cases, sources, documents, chat
  api/                   # Upload, chat, transactions, auth
lib/
  claude/                # Anthropic client + extraction
  pdf/                   # PDF text extraction (unpdf)
  cases/                 # Case P&L summaries
  sources/               # Provider directory queries & formatting
  rag/                   # Chunking + hybrid search
  voyage/                # Voyage embedding client
  supabase/              # Service client + types
supabase/migrations/     # SQL schema + search function
middleware.ts            # Password gate
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Storage upload failed` | Create private bucket `pdfs` in Supabase |
| `relation "documents" does not exist` | Run `001_initial.sql` in SQL Editor |
| `relation "cases" does not exist` | Run `003_cases.sql` in SQL Editor |
| `relation "providers" does not exist` | Run `004_providers.sql` in SQL Editor |
| `column providers.category_url does not exist` | Run `005_provider_resources.sql` in SQL Editor |
| `function search_document_chunks_hybrid does not exist` | Enable **vector** extension, then run `002_pgvector.sql` |
| `Missing VOYAGE_API_KEY` | Set env var on Vercel / `.env.local` |
| `Missing ANTHROPIC_API_KEY` | Set env var on Vercel / `.env.local` |
| Chat returns nothing / poor answers after upgrade | Run `npm run backfill:embeddings` for PDFs uploaded before embeddings |
| PDF upload fails with no text | PDF is scanned; need digital PDF or future OCR |
| 401 on API routes | Sign in again; check `SITE_PASSWORD` |
| Chat shows only `…` or empty reply | Redeploy after client SSE fix; check bubble for `Error:` or `(no content returned)`. Run `npm run diagnose:chat` and `npm run diagnose:chat:reproduce` (dev server must be running for the latter). |
| Chat says "I don't know" but PDFs exist | Run `npm run diagnose:chat`; confirm chunks have embeddings (`backfill:embeddings`). Hybrid search helps paraphrases and Japanese; very specific SKU/tracking queries still rely on the FTS leg. |

**Diagnostic scripts** (with `.env.local` configured):

```bash
npm run diagnose:chat          # Supabase: doc status, chunk count, FTS hit tests
npm run diagnose:chat:reproduce # Login + one chat call; prints outcome A–D
npm run backfill:embeddings  # Embed existing chunks missing vectors (after migration 002)
```

---

## Sources (sourcing directory)

After running `004_providers.sql`, `005_provider_resources.sql`, and `006_search_box_tweaks.sql`, open **Sources** in the nav:

1. Use the top **Hunt by set** panel: pick OP-15/OP-16/etc., choose Single BOX or Case (カートン), and click any provider to open a pre-built JP-keyword search in a new tab.
2. Browse pre-seeded JP retailers, proxies, exporters, and Italian reseller placeholders. Each tier card explains *when* to use it.
3. Click any provider → use **Browse OP sealed** (deep link to their One Piece TCG sealed category), **Auto-translate** (Google Translate wrapper), and **Quick search** chips (one-click open to that provider's search).
3. Read the **How to buy** panel on the detail page — payment quirks, shipping notes, JP keyword tips per provider.
4. **Add price observation** while browsing (set code, price, status, product URL).
5. **Compare prices** shows the latest observation per provider per set side-by-side, with a JPY→EUR hint.
6. **JP cheatsheet** (`/sources/cheatsheet`): tier workflow guides, JP↔EN glossary (予約, 在庫あり, BOX/カートン, etc.), and trusted external resources (Bandai calendar, Wise card, Tenso forwarder).

Phase 2 (not built yet): auto-scrape friendly JP sites + Discord alerts on restock/pre-order changes.

---

## Phase 2 ideas

- Provider watch: cron scrape + restock/pre-order alerts
- OCR / Claude vision for scanned PDFs
- Voyage reranker over hybrid results
- Multi-user auth
- Public storefront for selling boxes

# Straw Hat Platform

One Piece TCG document hub with PDF upload, structured cost extraction, and RAG-style chat over your invoices (Japan suppliers, FedEx, etc.).

**Stack:** Next.js 15 (Vercel) + Supabase (Postgres + Storage) + Claude API (server-side only).

**Cost:** $0 hosting on Vercel Hobby + Supabase Free. You pay only for [Anthropic API](https://www.anthropic.com/pricing) usage.

---

## Features

- Upload **digital PDFs** (selectable text; no OCR)
- Automatic **full-text indexing** for search
- **Claude extraction** of supplier, date, amount, tracking, product set
- **Dashboard** with totals by currency
- **Chat** grounded in uploaded documents with filename citations

---

## Prerequisites

- Node.js 20+
- [Supabase](https://supabase.com) account (free)
- [Vercel](https://vercel.com) account (free)
- [Anthropic API key](https://console.anthropic.com/) with billing enabled

---

## 1. Supabase setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **SQL Editor** → paste and run [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).
3. **Storage** → Create bucket named `pdfs` → set **Private**.
4. **Project Settings → API** — copy:
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
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role (server only) |
| `ANTHROPIC_MODEL_EXTRACT` | No | Default: `claude-haiku-4-5` |
| `ANTHROPIC_MODEL_CHAT` | No | Default: `claude-sonnet-4-6` |

---

## Claude API costs (approximate)

- **Per PDF upload:** one Haiku call for structured extraction (~1–3k input tokens depending on document size).
- **Per chat message:** one Sonnet call with retrieved chunks (~2–8k input tokens).

Use Haiku for extraction and Sonnet for chat to balance cost vs quality. Monitor usage in the [Anthropic console](https://console.anthropic.com/).

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
  (protected)/           # Dashboard, documents, chat
  api/                   # Upload, chat, transactions, auth
lib/
  claude/                # Anthropic client + extraction
  pdf/                   # PDF text extraction (unpdf)
  rag/                   # Chunking + Postgres FTS search
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
| `Missing ANTHROPIC_API_KEY` | Set env var on Vercel / `.env.local` |
| PDF upload fails with no text | PDF is scanned; need digital PDF or future OCR |
| 401 on API routes | Sign in again; check `SITE_PASSWORD` |
| Chat shows only `…` or empty reply | Redeploy after client SSE fix; check bubble for `Error:` or `(no content returned)`. Run `npm run diagnose:chat` and `npm run diagnose:chat:reproduce` (dev server must be running for the latter). |
| Chat says "I don't know" but PDFs exist | FTS may miss your query (especially Japanese). Fallback uses recent chunks only when FTS returns zero rows. Consider Phase 2 semantic search. |

**Diagnostic scripts** (with `.env.local` configured):

```bash
npm run diagnose:chat          # Supabase: doc status, chunk count, FTS hit tests
npm run diagnose:chat:reproduce # Login + one chat call; prints outcome A–D
```

---

## Phase 2 ideas

- OCR / Claude vision for scanned PDFs
- pgvector semantic search
- Multi-user auth
- Public storefront for selling boxes

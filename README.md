# ChronoSplit

**Discover your parallel self.**

An interactive multiverse photo booth. Answer a few questions, watch AI generate your **This Timeline** and **Alternate Timeline** stories live, then get a keepsake email.

## Stack

- **Next.js 15** + Vercel AI SDK (streaming)
- **Auth0** (GitHub/Google login)
- **Supabase** (Postgres)
- **Resend** (email)
- **Sentry** (observability)
- **eve.dev** agent (`eve/`)

## Quick Start

```bash
npm install
cp .env.example .env.local
# fill in keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Run `supabase/migrations/001_initial.sql` in Supabase SQL editor.

## Environment Variables

See `.env.example` for full list.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing + sign in |
| `/questions` | Questionnaire |
| `/timeline` | Streaming split-view stories |
| `/wall` | Public anonymized snippets |

## Demo Flow

QR → Login → Questions → Timeline (stream) → Email

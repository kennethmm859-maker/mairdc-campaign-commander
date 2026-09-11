# MAIRDC Campaign Commander

Production-foundation MVP for autonomous multi-brand social campaign scheduling.

## What is implemented

- Responsive command-center dashboard
- Multi-business / multi-account database schema
- Nine platform adapter slots: Facebook, Instagram, Threads, YouTube, TikTok, Snapchat, LinkedIn, X, Pinterest
- 20-slot-per-day campaign target model
- Scheduler endpoint with locking, retry backoff and publish-attempt logging
- AES-256-GCM token encryption helper
- Emergency global publishing pause
- Audit/analytics tables
- Vercel Cron configuration (15-minute scheduler tick)
- Preview mode when no database is configured

## Important behavior

`20 daily slots` means 20 campaign opportunities across the system. The scheduler must still obey platform-specific caps, user consent, content policies and account restrictions. Platform adapters intentionally fail closed until OAuth credentials and approvals are configured.

TikTok Direct Post should not be used as a blind promotional-flyer spam channel. Its Content Sharing Guidelines include restrictions on promotional branding/watermarks in shared content and impose posting caps. Use a TikTok-specific creative workflow and approval gate.

## Run locally

1. Install Node.js 22+
2. Copy `.env.example` to `.env.local`
3. `npm install`
4. `npm run dev`
5. Open `http://localhost:3000`

The UI works in preview mode without a database. Mutable production actions require `DATABASE_URL`.

## Database

Use PostgreSQL 15+.

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Generate an encryption key without sharing it in chat:

```bash
openssl rand -hex 32
```

Store that value as `TOKEN_ENCRYPTION_KEY` in the deployment environment.

## Scheduler

Vercel Cron calls `/api/scheduler/tick` every 15 minutes. Set `CRON_SECRET` in production. The endpoint processes due jobs, uses row locking to prevent duplicates, retries failed posts after 30 minutes, and permanently marks a post failed after the configured maximum attempts.

## Live network publishing

The core is ready for network adapters, but each adapter must be enabled only after its developer app, OAuth redirect URI, scopes and platform review requirements are satisfied. Do not hard-code or commit access tokens.

## Recommended activation order

1. Facebook + Instagram + Threads (Meta developer app)
2. YouTube (Google Cloud OAuth + YouTube Data API)
3. TikTok (Content Posting API + audit)
4. LinkedIn
5. Pinterest
6. X
7. Snapchat after confirming the exact approved organic publishing capability for the intended account type

## Production hardening still required before client resale

- Administrator authentication / MFA
- RBAC for staff and customers
- Object storage for uploaded media
- OAuth callback routes per provider
- Real platform adapter implementations
- Analytics pull jobs
- Per-platform creative validation
- Customer billing / tenant isolation if offered as SaaS
- Terms/privacy pages and data deletion callbacks required by providers

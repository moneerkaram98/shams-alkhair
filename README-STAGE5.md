# مدرسة شمس الخير — المرحلة الخامسة: مكتبة الفيديوهات التعليمية

Full source for **stages 1–5**. The new `/library` page is the video catalog and `/dashboard/videos` is the video management UI. **This release is source code, not a deployed production app.** Do not upload videos identifying children or women until privacy/audit approvals and end-to-end verification.

## Implemented

- Three isolated PostgreSQL tables (`MenVideo`, `WomenVideo`, `AcademyVideo`) with distinct SQL grants and recommended separate Cloudflare Stream accounts per scope.
- Upload a video direct from browser to Stream, not through Node.js application memory/compute; capped at 200 MB and one-hour maximum duration, 10 reservations per user per day.
- `requireSignedURLs:true` for **all uploads including public academy videos**; restricted viewers get a 10-minute signed iframe token only after server authorization. This protects default private URLs.
- Target audiences: public (academy only), any enrolled student in scope, students in a level, or one active group. Parent sees videos authorized for their linked student's actual enrollments.
- Teacher uploads only for assigned group and cannot publish. Independent supervisor has to approve, and cloud provider webhook must confirm processing is READY.
- Staff catalog, group/level choices pulled from authorized assignments (no manual UUID entry), delete/hide, private player, filter by category and title, status badges, error handling and upload progress.
- Webhook raw-body HMAC validation with a 5-minute freshness check and constant-time comparison. Audit records for reservation, review, deletion and women's catalog/playback.

## Prerequisites

1. Install Node 22, npm, PostgreSQL 17. Review `README-STAGE2.md`, `README-STAGE3.md`, `README-STAGE4.md` **in order**.
2. Create THREE Cloudflare Stream accounts (or fully separately administered tenants), one for each scope, with restricted Stream Read/Write tokens. Enable private signed-token playback and obtain your customer codes (e.g. `customer-abc123`). **Do not reuse an account identifier** between scopes. Set the four variables per scope in `.env.runtime` per `.env.runtime.example`.
3. Configure one webhook per account pointing to `https://YOUR_APP/api/videos/webhook?scope=men` or `women` or `academy` respectively. Keep the retrieved webhook secret outside git. Verify `Webhook-Signature` processing with sample payloads first.
4. Create a new DB migration with the schema-owner maintenance credential; not with a runtime role:

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name stage5_video_library
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraints-stage5.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/roles-stage5.sql
npm run typecheck
npm run test:contracts
npm run build
```

5. Remove `DATABASE_URL` schema-owner credentials from the deployed server. Use only the limited `DATABASE_URL_STAFF_MEN/WOMEN/ACADEMY` plus the phase2/3/4 auth dependencies. Never publish `.env.runtime`, provider tokens or webhook secrets.
6. Run `npm run dev`, login as scope-aware staff, open `/dashboard/videos`; approve from another supervisor account; view in `/library` as student/guardian. Enable the webinar app security headers and CSRF defense as required. Test with synthetic, nonidentifying videos.

## Test and deployment checklist

```bash
npm run test:phase5
npm run test:contracts
npm run test:stage5:e2e
```

Production validation not performed here: PostgreSQL migrations, Vercel build, provider billing/account provisioning, live upload, webhook callbacks, browser CORS, signed player rendering, negative SQL isolation tests and reliable removal on storage provider. Test all these with two school staff accounts, teacher in different group, parent of one child, one women's supervisor, one principal with **no** grant and an unrelated guest.

## Provider and budget

Cloudflare Stream is **not free**. Official pricing (Oct 2026 documentation) indicates $5 per 1,000 video storage minutes/month and $1 per 1,000 viewed minutes, subject to vendor updates. Using 3 separate accounts may require separate prepaid storage purchases. Source: https://developers.cloudflare.com/stream/pricing/

If budget must be strictly zero, upload only non-sensitive PUBLIC academy promo/tutorial videos through a separate manually managed YouTube channel, without claiming that Unlisted videos are private. Do **not** use YouTube Unlisted for private student/teacher/section content. Don't mix zero-budget public embedding with private access controls.

## Known limits / planned improvements

- Files larger than 200MB, pause/retry on poor internet: implement Cloudflare tus resumable upload with client and server metadata validation. Basic POST direct upload is all that is wired in this phase.
- On provider outage, a video can become hidden in DB while remote deletion is still pending. A documented **manual reconciliation** must retry removal. Scheduling for cleanup and orphan reservations should be added before production.
- There is no periodic confirmation to recover a missed webhook; implement reconciliation to poll Cloudflare Stream status before production.
- No user video quotas by playback minutes or billing dashboard; enable spend alerts and school-level limits.
- Publication permissions for recognisable children/teachers, third-party music/assets, captions/subtitles, moderation, accessibility and content retention need approval before general release.
- A 10-minute Stream token is transferable and cannot be forcibly revoked until expiry. Avoid storing signed player links and never treat them as permanent protection against screen recording.
- Rate limits use DB-count and are not concurrency-atomic. Enforce stronger quotas with a durable store for public production.

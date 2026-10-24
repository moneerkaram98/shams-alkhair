# مدرسة شمس الخير — المرحلة الرابعة: التسميع والتصحيح الآلي المساعد

This archive includes **stages 1–4**. New pages are `/recitation` (student/family) and `/dashboard/recitation` (teacher). The existing `/family`, `/dashboard/progress` and stage 1–2 features remain in place.

**Status:** developer source with parsing + structural tests passed. Postgres migrations, npm install, full TypeScript typecheck, Next build, camera recording on physical iOS/Android, cloud storage, external Quran source access and ASR processing have **NOT** been successfully tested here. Do not enter live children's or women's recordings until deployment and privacy review.

## What's implemented

- MediaRecorder in the browser over HTTPS/localhost, up to 3 minutes, 12 MB and up to five uploads/student/hour; preupload playback.
- Parent/student consent with special rule: active guardian of minor must approve; adult student must approve themself. Consent is rechecked at processing time.
- Uthmani text (`text_uthmani`) read unchanged from [Quran Foundation Content API](https://api-docs.quran.com/docs/content_apis_versioned/4.0.0/quran-verses-uthmani/), never reconstructed by an LLM. Failed verification gives HTTP 503 rather than an invented verse. UI may show a matching trusted reference recitation clip per ayah; the recitation ID must be set by an admin using `/resources/recitations`.
- Heuristic Arabic word comparison: diacritic normalization in a **separate comparison string only**, Levenshtein token alignment, omission / addition / substitution / simple adjacent reordering; colored spans highlight candidates. 0–100 agreement is **not a pedagogic mastery grade**.
- A private audio container for each section in S3-compatible storage, separate object-storage access keys per section, AES256 SSE (or configured SSE-KMS), no publicly accessible URLs. Audio served only through a protected route. Women's ASR is **disabled** until `RECITATION_ASR_WOMEN_APPROVED=true` is explicitly set after a privacy decision.
- Job API `/api/recitation/process` processes queued recordings. Back-to-back runs atomically claim jobs. Failed/stale jobs (older than 15 min) can retry a maximum of 3 attempts; human review remains possible without ASR.
- Local optional FastAPI + faster-whisper ASR service. This generic Arabic ASR model **is not Quran-trained or certified**, may misrecognize recitation/intonation. Never substitute it for tajweed/makhraj assessment or disciplinary marks.
- Staff assigns **manual** 0–100 mastery and error counts in `/api/recitation/review`; this alone publishes an academic `LearningRecord`. Existing stage3 reports use those manual records.
- Record deletion removes audio and speech transcript after successful storage deletion; if teacher already assessed it, the separate educational record remains subject to school's approved records policy. Guardian can revoke further recording consent at any time.

## Stage 4 data / deployment dependencies

1. Install Node 22, PostgreSQL 17, create separate `hifz_men`, `hifz_women`, `academy` roles from prior stages; **never deploy schema-owner `DATABASE_URL` in runtime**.
2. Set the **maintenance** `DATABASE_URL` only in your local migration environment, then run:

```bash
npm install
npx prisma validate
npx prisma generate
npx prisma migrate dev --name stage4_private_recitations
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/constraints-stage4.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/roles-stage4.sql
```

3. Keep all restricted credentials from `.env.runtime.example`. Add Quran Foundation developer credentials `QURAN_FOUNDATION_CLIENT_ID` and a valid server-side `QURAN_FOUNDATION_TOKEN` (token renewal must be wired for extended uptime), `QURAN_REFERENCE_RECITATION_ID` from *ayah-by-ayah* recitations only. Never put Quran Foundation tokens in `NEXT_PUBLIC_` variables.
4. Provision 3 **private** S3-compatible buckets and 3 distinct IAM user credentials. Put `RECITATION_BUCKET_MEN`, `RECITATION_BUCKET_WOMEN`, `RECITATION_BUCKET_ACADEMY` and distinct per-scope `RECITATION_S3_ACCESS_KEY_{MEN,WOMEN,ACADEMY}`, `RECITATION_S3_SECRET_KEY_{MEN,WOMEN,ACADEMY}`. Deny cross-bucket actions, all public access and configure encryption/key management, lifecycle + backup according to local school policy. For R2/MinIO confirm server-side encryption header compatibility; the code defaults to SSE-S3 `AES256` and expects provider support.
5. Set `RECITATION_ASR_URL` for a **private service** (`http://asr:8000/transcribe` on the shared Docker network, HTTPS to an approved remote service), `RECITATION_ASR_TOKEN` 32+ random characters and `RECITATION_JOB_SECRET` 32+ random characters. Ensure legal/privacy approval before sending any audio outside your own server; keep `RECITATION_ASR_WOMEN_APPROVED=false` until special approval.
6. Optional CPU ASR, shared with the Docker app only:

```bash
# put application and ASR secrets in protected .env.runtime and shell respectively
# model downloads on first launch; use a private, network-segmented host
# run from repository root
docker compose -f compose.app.yml --profile asr up --build -d
```

7. Schedule a **private POST** request from a trusted scheduler, e.g. hourly, rather than a public GET Vercel Cron:

```bash
curl -fsS -X POST 'https://YOUR-REAL-APP-DOMAIN/api/recitation/process' \
 -H "Authorization: Bearer $RECITATION_JOB_SECRET"
```

Keep both the scheduler secret and source recordings out of logs. If your app is on Vercel, the ASR worker must be on a private/approved network-reachable HTTPS service; `http://asr` only works when the app and worker share Docker networking. Current route processes at most two recordings per scope/call to reduce request duration; make a durable job queue before high-volume use.

## Verification

```bash
npm run test:contracts   # Stage 1–4 static + pure algorithm tests
npm run test:phase4      # new 12 tests
node /mnt/data/ts-syntax-check.cjs .  # optional tool present in builder environment only
npm run db:validate      # requires downloaded npm packages & DATABASE_URL
npm run db:generate
npm run typecheck
npm run build
npm run dev
npm run test:stage4:e2e  # login/worker unauthenticated negative-case smoke
```

Create at least: one minor student linked to an active guardian, one adult student with login, two teachers assigned to separate groups, and one principal without women's grant. Verify approved guardian uploads, revoked guardian consent refuses, other guardian 403, cross-group teacher 403, cross-schema SQL credentials denied, principal women's recording denied without grant, duplicate review 409, no publicly accessible audio, and correct cleanup on DELETE. Use synthetic recordings only for testing.

## Critical production blockers

- Node dependencies and Prisma migrations/Next build have not run in this environment; do not claim the deployed static demo equals the backend.
- Run genuine audio accuracy evaluation with qualified Quran teachers and target-speaker dialects, especially for children. General ASR is not accurate enough for automatic tajweed grading; never auto-publish a failing score.
- The UI colors words in the **verse passage**; it is not yet a fully faithful paginated 604-page Medina Mushaf renderer. For exact Mushaf page word placement, integrate licensed QCF fonts and the relevant page mapping resources.
- Audio deletion is user-controlled. **Scheduled retention expiration, automatic purging and student export** need a separate audited records-management policy before production; do not retain private recordings indefinitely.
- Add production security test suite, MFA for staff, persistent rate limits, event logging with PII redaction, encryption key rotation, staff audit review, backup restoration, content security policy, and a legal review of children's data and Quran Foundation audio terms. No real user data until validated.

Read `docs/PHASE4-API.md`, `docs/PHASE4-ERD.md`. Existing stage 3 documentation remains relevant.

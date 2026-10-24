# Phase 5 API: classroom video library

All JSON endpoints deny cross-origin unsafe methods and use same-site session cookies. Staff routes require logged-in roles. No video payload is stored in Postgres; only metadata and provider UID.

| Endpoint | Method | Role | Purpose |
|---|---|---|---|
| `/api/videos?scope=academy` | GET | public approved videos; scoped parents/students/staff for private | Catalog (no Stream UID) |
| `/api/videos?scope=men&manage=1` | GET | supervisor or scoped teacher | Videos pending/published in assigned scope |
| `/api/videos/targets?scope=men` | GET | teacher/supervisor | Authorized groups and levels for upload UI |
| `/api/videos/upload-init` | POST | teacher assigned to requested group / supervisor with scope | Reserve signed private upload URL; accepted file under 200MB; max 10/day |
| `/api/videos/watch?scope=academy&id=<uuid>` | GET | authorized viewer only | Short-lived Stream iframe token (600 seconds) |
| `/api/videos/review` | POST | independent supervisor | Approve or reject, only READY can be approved |
| `/api/videos/remove` | POST | scope supervisor/admin | Hide immediately and attempt provider deletion |
| `/api/videos/webhook?scope=academy` | POST | provider with signed webhook | Authenticate HMAC + timestamp; mark encoding READY/ERROR |

## Upload initiation

```json
{
 "scope":"academy", "title":"الدرس الأول: نور البيان", "description":"مقدمة", "category":"NOOR_BAYAN",
 "visibility":"ENROLLED", "fileSize":5242880, "fileType":"video/mp4", "maxDurationMinutes":10
}
```

Response: `{ "id":"...uuid", "uploadURL":"https://upload.videodelivery.net/...", "expiresInSeconds":1800 }`. Post a `multipart/form-data` `file` part directly to that URL. Cloudflare Stream uploads finish asynchronously; success of upload is NOT approval. Transcoding webhook must arrive, then a **different supervisor** approves.

## Scope/audience checks

- Teacher upload must target one of their active assigned groups; teacher cannot upload whole-section or public content.
- Academy public videos are explicitly approved (children's identifiable information must NOT appear without a verified publication consent process).
- Men/women videos may never be public, enforced by API + CHECK constraints.
- Parent/student viewing is based on ACTIVE linked students and enrollments inside the same PostgreSQL schema; teacher playback is limited to their assigned group(s); super admin women's access requires an expiring supervisor-approved grant.
- SQL runtime roles only access the corresponding section's metadata. Cloudflare Stream media is private by default with separate provider accounts/tokens per scope.
- Never expose Cloudflare API tokens in the browser or client bundle.

## Webhook

Cloudflare signs the raw webhook body with `Webhook-Signature: time=<unix>,sig1=<hex sha256>`, HMAC_SHA256 over `${time}.${rawBody}`. The code verifies signature in constant time and rejects timestamps more than 5 minutes old. Configure **independent** secrets and webhook destinations for each account.

Cloudflare Stream docs: https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/ ; https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/ ; https://developers.cloudflare.com/stream/manage-video-library/using-webhooks/

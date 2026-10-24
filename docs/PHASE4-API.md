# Stage 4 private API reference

All student-specific GET APIs require an authenticated session cookie (`shams_session`) and an active linked guardian, student identity, or authorized school staff role. Women's staff access additionally obeys the expiring special-grant policy for the school principal. Every mutation requires same-origin browser requests. All responses are non-cacheable.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/recitation/passage?scope=men&studentId=UUID&surahNumber=1&ayahFrom=1&ayahTo=3` | parent/student or authorized staff | Verified Uthmani passage and optional approved reference audio |
| POST | `/api/recitation/consent` | linked parent for minor / adult student | `{"scope":"men","studentId":"UUID","consent":true,"privacyVersion":"2026-10"}` |
| GET | `/api/recitation/attempts?scope=men&studentId=UUID` | family or authorized staff | Last 35 recitation attempts |
| POST | `/api/recitation/attempts` | family + active consent | `multipart/form-data`: scope, studentId, surahNumber, ayahFrom, ayahTo, optional groupId, audio. Content type accepted: webm/ogg/mp4/wav/mpeg with valid header; max 12 MB. Returns `QUEUED`. |
| DELETE | `/api/recitation/attempts` | linked family | `{"scope":"men","attemptId":"UUID"}`. Deletes private audio and transcript; school academic review may remain as a separate record. |
| GET | `/api/recitation/audio?scope=men&id=UUID` | family or assigned staff | Proxied, private audio; no public/bucket URL exposed |
| POST | `/api/recitation/process` | server-side scheduler only | `Authorization: Bearer RECITATION_JOB_SECRET`; processes max 2 per scope per call, checks consent and writes preliminary differences |
| POST | `/api/recitation/review` | assigned teacher or authorized supervisor | `{"scope":"men","attemptId":"UUID","groupId":"UUID","mastery":90,"memoryErrors":2,"tajweedErrors":1,"makharijErrors":0,"teacherComment":"…"}`; commits teacher's manual grade to LearningRecord |

**Error rules:** `401` no authentication, `403` unauthorized or missing consent, `409` attempted duplicate review or in-flight deletion, `413` payload too large, `415` unsupported media, `429` more than five uploads per student per hour, `503` unavailable Quran source/storage. `FAILED` attempts remain playable for a teacher to review manually when ASR fails.

This is an implementation contract, not a statement that the deployed preview has backend connectivity.

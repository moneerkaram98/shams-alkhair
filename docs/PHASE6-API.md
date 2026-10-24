# Phase 6 API reference (restricted deployment)

All JSON POST mutations require an authenticated `shams_session` cookie, a same-origin `Origin` header, section RBAC, and validated JSON. All responses are `no-store`. Production clients should also add rate limiting and observability. No public API grants access to children's records.

## `/api/stage6`

- GET query `scope=men|women|academy` and `kind=overview|schedule|invoices|certificates|exams|reviews|awards|progress`. Except `overview` and `schedule`, requires `studentId` (UUID). Student-specific reads require linked student/parent or assigned teacher or scoped supervisor. Women's reads add audit events.
- POST JSON `{scope,action,...}`. Use these actions and fields:
  - `invoice.create`: `studentId,title,amountPiasters,discountPiasters,dueAt` (`YYYY-MM-DD`). Finance/reception or supervisors only.
  - `payment.record`: `invoiceId,amountPiasters,method` one of `CASH,BANK_TRANSFER,WALLET_MANUAL`, optional `reference`. **Manual ledger only**; no gateway charge occurs. Serializable DB transaction checks outstanding balance.
  - `invoice.void`: `invoiceId,reason`. Only for unpaid invoices.
  - `certificate.issue`: `studentId,kind,courseTitle,sanad` as ordered list of names for ijaza. Initial state is private/unverifiable publicly.
  - `certificate.consent`: `certificateId`. Student or linked guardian consents to public yes/no verification, no name published.
  - `certificate.approve`: `certificateId`. Requires **different** approving supervisor and prior guardian/student consent.
  - `certificate.revoke`: `certificateId,reason`. An authorized supervisor revokes.
  - `exam.record`: `studentId,groupId,kind,title,score,total,notes`. Teacher can assess ONLY their assigned student/group.
  - `review.assign`: `studentId,groupId,surah,fromAyah,toAyah,mastery` schedules a review by heuristic.
  - `review.complete`: `reviewId,groupId,mastery` marks completion once and schedules next review.
  - `award.create`: `studentId,points,reason`. Scoped supervisor grants points.
  - `schedule.create`: `groupId,teacherId,weekday,fromMinute,toMinute,roomCode`. Requires an assigned teacher. The SQL exclusion constraints prevent overlap on room, teacher, and group within that schema.
  - `schedule.cancel`: `scheduleId,reason` soft-cancels the weekly schedule with audit.

## `/api/verify-certificate`

GET `?code=M_<32-char-url-safe-random>` or W_/A_. Returns `{valid:true, serial,kind}` **only** for nonrevoked, approved, family-consented certificates. Otherwise `{valid:false}`. No names, faces, sanad, or personal details are ever returned. Public page `/verify`.

## `/api/stage6/export`

GET `?scope=...` requires finance/supervisor. CSV Excel-readable with BOM, quoted strings, and spreadsheet formula injection defense. Limited to 1000 invoices per export; does not include student names. Replace with server-side paginated exports for production.

## User pages

- `/dashboard/advanced` school staff advanced dashboards.
- `/family/achievements` parent and linked student dashboards.
- `/certificate/print?scope=...&studentId=...&id=...` authenticated browser print-to-PDF certificate; contains private recipient's name and sanad when permitted.
- `/verify` public low-disclosure verifier.

**Limits:** No provider-backed payment, signature/fraud-resistant rendered PDF from server, transcript QR audit, question bank or computer-marked tests yet. The public verifier uses random codes and needs rate limiting. API docs do not prove deployment readiness.

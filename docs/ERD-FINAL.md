# Shams Alkhair — ERD v1.0 (target domain model)

**Status:** architecture approved; **Phase 1 Prisma implementation is a deliberately scoped subset.**
The diagrams below are the planned target ERD. Do not assume tables for phases 2–6 exist in the Phase 1 database.

## 1 — Reference and access

```mermaid
erDiagram
 BRANCH ||--o{ CLASS_GROUP : hosts
 DEPARTMENT ||--o{ PROGRAM : contains
 PROGRAM ||--o{ LEVEL : defines
 PROGRAM ||--o{ CLASS_GROUP : organizes
 LEVEL ||--o{ CLASS_GROUP : categorizes
 USER ||--o{ ROLE_ASSIGNMENT : holds
 ACCESS_SCOPE ||--o{ ROLE_ASSIGNMENT : restricts
 ACCESS_SCOPE ||--o{ CLASS_GROUP : partitions
 USER ||--o{ SENSITIVE_ACCESS_GRANT : requests
 ACCESS_SCOPE ||--o{ SENSITIVE_ACCESS_GRANT : targets
 USER ||--o{ AUDIT_EVENT : creates
 USER { uuid id PK; string email UK; string password_hash }
 ROLE_ASSIGNMENT { uuid id PK; uuid user_id FK; uuid scope_id FK; string role }
 ACCESS_SCOPE { uuid id PK; string code UK }
 SENSITIVE_ACCESS_GRANT { uuid id PK; uuid requester_id FK; uuid approver_id FK; uuid scope_id FK; datetime expires_at }
 AUDIT_EVENT { uuid id PK; uuid actor_id; string action; string scope_code; datetime occurred_at }
```

## 2 — Admissions, level test and teaching

The **application**, **student**, **guardian**, **enrolment**, **class** and **lesson** domain entities are *physically repeated* in `hifz_men` and `hifz_women`; `academy` contains its own domain set. The diagram shows the logical relationship once to avoid repeating the same structure three times.

```mermaid
erDiagram
 APPLICATION ||--o{ PLACEMENT_BOOKING : schedules
 PLACEMENT_SLOT ||--o{ PLACEMENT_BOOKING : accommodates
 PLACEMENT_BOOKING ||--o| PLACEMENT_RESULT : produces
 APPLICATION ||--o| STUDENT : becomes_after_approval
 STUDENT ||--o{ GUARDIAN_LINK : child
 USER ||--o{ GUARDIAN_LINK : guardian
 STUDENT ||--o{ ENROLLMENT : joins
 CLASS_GROUP ||--o{ ENROLLMENT : includes
 CLASS_GROUP ||--o{ TEACHER_ASSIGNMENT : has
 USER ||--o{ TEACHER_ASSIGNMENT : teaches
 CLASS_GROUP ||--o{ GROUP_SCHEDULE : planned
 GROUP_SCHEDULE ||--o{ LESSON_SESSION : generates
 LESSON_SESSION ||--o{ ATTENDANCE : records
 STUDENT ||--o{ ATTENDANCE : attends
 APPLICATION { uuid id PK; string reference UK; string access_token_hash UK; string status; date birth_date }
 PLACEMENT_SLOT { uuid id PK; datetime starts_at; int capacity }
 PLACEMENT_BOOKING { uuid id PK; uuid application_id FK; uuid slot_id FK }
 PLACEMENT_RESULT { uuid id PK; uuid booking_id FK; string recommended_level }
 STUDENT { uuid id PK; uuid application_id FK; string status }
 GUARDIAN_LINK { uuid id PK; uuid student_id FK; uuid guardian_user_id FK }
 ENROLLMENT { uuid id PK; uuid student_id FK; uuid class_group_id FK; date joined_at }
 CLASS_GROUP { uuid id PK; uuid branch_id FK; uuid level_id FK }
 GROUP_SCHEDULE { uuid id PK; uuid class_group_id FK; int weekday }
 LESSON_SESSION { uuid id PK; uuid group_schedule_id FK; datetime starts_at }
 ATTENDANCE { uuid id PK; uuid student_id FK; uuid session_id FK; string status }
```

## 3 — Teaching, reports, certifications and finance

```mermaid
erDiagram
 STUDENT ||--o{ LEARNING_RECORD : progresses
 STUDENT ||--o{ RECITATION_ATTEMPT : submits
 RECITATION_ATTEMPT ||--o{ RECITATION_ERROR : detects
 RECITATION_ATTEMPT ||--o{ RECITATION_REVIEW : reviewed
 STUDENT ||--o{ STUDENT_REPORT : receives
 STUDENT_REPORT ||--o{ DELIVERY : delivered
 STUDENT ||--o{ CERTIFICATE : earns
 CERTIFICATE ||--o{ SANAD_ENTRY : contains
 STUDENT ||--o{ INVOICE : billed
 INVOICE ||--o{ PAYMENT_ALLOCATION : settled
 PAYMENT ||--o{ PAYMENT_ALLOCATION : allocates
 STUDENT ||--o{ QR_CREDENTIAL : assigned
 STUDENT ||--o{ MEDIA_ASSET : owns
 STUDENT ||--o{ NOTIFICATION : receives
 USER ||--o{ MESSAGE : sends
 STUDENT { uuid id PK }
 RECITATION_ATTEMPT { uuid id PK; uuid student_id FK; string audio_storage_key; float confidence }
 RECITATION_REVIEW { uuid id PK; uuid attempt_id FK; uuid reviewer_user_id FK }
 CERTIFICATE { uuid id PK; uuid student_id FK; string verification_code UK }
 SANAD_ENTRY { uuid id PK; uuid certificate_id FK; int sequence_number }
 PAYMENT_ALLOCATION { uuid id PK; uuid payment_id FK; uuid invoice_id FK; decimal amount }
 QR_CREDENTIAL { uuid id PK; uuid student_id FK; string public_token_hash UK }
 MEDIA_ASSET { uuid id PK; string private_storage_key }
```

## Placement constraints and scope rules

1. Admission can precede a STUDENT record; approval creates or links a STUDENT exactly once.
2. Initial Phase 1 booking is `applicationId @unique` (one booking only). For rescheduling later, replace with booking history plus an active-booking partial uniqueness constraint.
3. Unique `(student_id, lesson_session_id)` on ATTENDANCE; changes go to AUDIT_EVENT.
4. A teacher can only see students enrolled in groups assigned to their *active* scoped teaching role.
5. Any female-memorization photo/audio/document is stored under private `hifz_women` object prefix, authenticated via separately scoped permissions, not a public URL.
6. An administrator's exceptional female-section access requires *a supervisor-approved time-bounded grant* and recorded access in an immutable journal. Approval cannot be self-issued.
7. SANAD_ENTRY has `UNIQUE(certificate_id, sequence_number)`.
8. Certificate verification publishes only consented, necessary details, with redacted personal information by default.
9. `BRANCH` exists from Phase 1 for future growth, with one initial branch.

## Scope partition decisions

| Schema | Intended records |
|---|---|
| `core` | technical identities, roles, approved access grants, audit, public reference catalogs; **not women student profiles** |
| `hifz_men` | all male memorization admissions, learners, guardians, sessions, performance, photos, records, finance |
| `hifz_women` | all female memorization admissions, learners, guardians, sessions, performance, photos, records, finance |
| `academy` | nursery, tajweed, ijazat domain records, with per-student/child permissions |

`Prisma multi-schema` is namespacing, not a security boundary alone. Enforce distinct runtime DB roles, explicit authorizations, and private object-storage permissions. Stronger isolation requirements could later require separate databases.

## Scope of Phase 1 Prisma schema

**Implemented now:** CONTACT_INQUIRY, BRANCH, DEPARTMENT, PROGRAM, LEVEL, APP_USER, ACCESS_SCOPE, ROLE_ASSIGNMENT, SENSITIVE_ACCESS_GRANT, AUDIT_EVENT; per domain APPLICATION, PLACEMENT_SLOT, PLACEMENT_BOOKING, PLACEMENT_RESULT.

**Not implemented yet:** STUDENT, GUARDIAN_LINK, CLASS_GROUP, ENROLLMENT, teaching assignments, lesson sessions, QR attendance, recitation, reporting, certificates, payments, media. These are target relationships for subsequent migrations.

## Stage 1 public contact workflow

`CONTACT_INQUIRY` lives in `core`, contains only intentionally submitted inquiry data, and is writable by an insert-only runtime contact role. Private admission records remain in their three domain schemas. Applicants can retrieve only their application status and appointment after proving possession of reference plus high-entropy token.

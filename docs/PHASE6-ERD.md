# Phase 6 data relationships — physical three-schema isolation

The following eight models are duplicated separately under **hifz_men**, **hifz_women** and **academy**. No common student table is introduced. This diagram applies *once per schema*.

```mermaid
erDiagram
  STUDENT ||--o{ INVOICE : owes
  INVOICE ||--o{ PAYMENT : paid_in_parts
  STUDENT ||--o{ CERTIFICATE : awarded
  CERTIFICATE ||--o{ SANAD_ENTRY : chained
  STUDENT ||--o{ EXAM : assessed
  STUDENT ||--o{ REVIEW_TASK : scheduled
  STUDENT ||--o{ AWARD : motivated
  CLASS_GROUP ||--o{ WEEKLY_SCHEDULE : meets
  STUDENT {
    uuid id PK
    string fullName
  }
  INVOICE {
    uuid id PK
    uuid studentId FK
    string number UK
    int amountPiasters
    int discountPiasters
  }
  PAYMENT {
    uuid id PK
    uuid invoiceId FK
    int amountPiasters
    string receiptNo UK
  }
  CERTIFICATE {
    uuid id PK
    uuid studentId FK
    string serial UK
    string verifyCode UK
    bool publicVerification
    date verificationConsentAt
  }
  SANAD_ENTRY {
    uuid id PK
    uuid certificateId FK
    int position
    string scholarName
  }
  EXAM {
    uuid id PK
    uuid studentId FK
    uuid groupId
    int score
    int total
  }
  REVIEW_TASK {
    uuid id PK
    uuid studentId FK
    uuid groupId
    int intervalDays
    date dueAt
  }
  AWARD {
    uuid id PK
    uuid studentId FK
    int points
  }
  WEEKLY_SCHEDULE {
    uuid id PK
    uuid groupId FK
    int weekday
    int fromMinute
    int toMinute
    string roomCode
    uuid teacherId
  }
```

The operational ERD is implemented in `prisma/schema.prisma`. SQL `db/constraints-stage6.sql` adds non-overlapping weekly ranges for each section (group, teacher, room) using GiST exclusion constraints. **Cross-schema physical-room conflicts are not yet blocked**, so each section must use independently labeled rooms until a central reservation service is implemented. In the future a room-availability service should store only occupied time ranges in `core`, never women's student/teacher details.

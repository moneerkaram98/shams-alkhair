# ERD stage 4 (extends stage 1–3)

Three independent schemas store the same logical pair of tables: `hifz_men`, `hifz_women`, `academy`. No data is moved into `core` except append-only security audit metadata.

```mermaid
erDiagram
  MenStudent ||--o{ MenRecitationConsent : authorizes
  MenStudent ||--o{ MenRecitationAttempt : records
  WomenStudent ||--o{ WomenRecitationConsent : authorizes
  WomenStudent ||--o{ WomenRecitationAttempt : records
  AcademyStudent ||--o{ AcademyRecitationConsent : authorizes
  AcademyStudent ||--o{ AcademyRecitationAttempt : records
  MenRecitationAttempt {
    uuid id PK
    uuid studentId FK
    uuid uploadedBy
    string storageKey UK
    int surahNumber
    int ayahFrom
    int ayahTo
    string state
    int provisionalMatch
    json alignment
    int teacherMastery
    string teacherComment
  }
  WomenRecitationAttempt {
    uuid id PK
    uuid studentId FK
    string storageKey UK
    string state
  }
  AcademyRecitationAttempt {
    uuid id PK
    uuid studentId FK
    string storageKey UK
    string state
  }
```

- For minors, a linked guardian grants or revokes consent. Adults grant themselves consent. The signed-in student cannot authorize recordings as a minor.
- Uploaded recordings are stored in separate private object-storage buckets with separate access keys for each scope. The DB only stores the key and metadata.
- The processing worker checks consent again just before ASR, atomically claims queued jobs and stores provisional diffs. It NEVER writes `LearningRecord` academic grades.
- Teacher review validates assigned group / supervision, then writes `LearningRecord` using **manual** teacher values. Audit entries track upload, read, review and deletion.

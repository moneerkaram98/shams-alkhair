# Phase 3 ERD additions

The diagram applies separately within `hifz_men`, `hifz_women` and `academy`. This is **not** a merged shared schema.

```mermaid
erDiagram
  STUDENT ||--o{ LEARNING_RECORD : learns
  CLASS_GROUP ||--o{ LEARNING_RECORD : assessed_in
  STUDENT ||--o{ STUDENT_REPORT : receives
  STUDENT_REPORT ||--o{ REPORT_DELIVERY : dispatched
  STUDENT ||--o{ REPORT_PREFERENCE : subscribed
  STUDENT ||--o{ FAMILY_MESSAGE : converses
  STUDENT ||--o{ FAMILY_NOTIFICATION : receives
  APP_USER ||--o{ GUARDIAN_LINK : linked_to_student
  STUDENT ||--o{ GUARDIAN_LINK : has
  CLASS_GROUP ||--o{ TEACHER_ASSIGNMENT : staffed_by
  STUDENT ||--o{ ENROLLMENT : joined
  CLASS_GROUP ||--o{ ENROLLMENT : includes
  LESSON_SESSION ||--o{ ATTENDANCE : records
  STUDENT ||--o{ ATTENDANCE : marked
```

- Scope-controlled model names: `MenLearningRecord`, `WomenLearningRecord`, `AcademyLearningRecord`, likewise for reports, preferences, deliveries, messages, notifications.
- `LearningRecord`: `studentId`, `groupId`, `teacherId`, `activity`, `surahNumber`, verse range, mastery, errors, note and assessment date.
- `StudentReport`: period and start date unique per student; snapshot immutable after `PUBLISHED` through guarded application logic. Add SQL defensive trigger before production if regulatory audit immutability is needed.
- `ReportPreference` keyed by student + guardian; email starts disabled. Teacher approval default required.
- `ReportDelivery` unique by report, guardian and method. Resend idempotency key is delivery UUID.
- Student and guardian PII are not embedded into emails or stored in shared notification tables.

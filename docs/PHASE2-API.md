# Phase 2 API (requires authenticated HttpOnly session cookie)

| Verb | Path | Body/query | Authorization |
|---|---|---|---|
| POST | `/api/auth/login` | `{email,password}` | Public (rate-limited at edge for production) |
| POST | `/api/auth/logout` | cookie | Logged-in |
| GET | `/api/auth/me` | cookie | Logged-in |
| GET/POST | `/api/staff/students` | `scope`; `{scope,fullName,birthDate}` | Staff; create admin/supervisor/reception |
| GET/POST | `/api/staff/groups` | `scope`; `{scope,nameAr,capacity}` | Staff; create admin/supervisor/reception |
| POST | `/api/staff/assign` | `{scope,groupId,userId}` | Admin/supervisor/reception |
| POST | `/api/staff/enroll` | `{scope,studentId,groupId}` | Admin/supervisor/reception |
| POST | `/api/staff/guardians` | `{scope,studentId,userId,relationship}` | Admin/supervisor/reception |
| GET/POST | `/api/staff/sessions` | `scope,groupId`; `{scope,groupId,startsAt,endsAt}` | Staff; create admin/supervisor/reception |
| POST | `/api/staff/sessions/close` | `{scope,sessionId}` | Scoped staff for assigned group, only after session end; mark unrecorded students absent |
| POST | `/api/staff/qr` | `{scope,studentIds:[uuid...]}` | Admin/supervisor/reception; max 40; reissues/rotates |
| GET | `/api/staff/attendance` | `scope,sessionId` | Scoped staff; teacher assigned to session group |
| POST | `/api/staff/attendance` | `{scope,sessionId,token}` | Scoped staff; teacher assigned; QR scan |
| POST | `/api/staff/attendance/manual` | `{scope,sessionId,studentId,status,reason}` | Scoped staff, manual recording |
| PATCH | `/api/staff/attendance` | `{scope,sessionId,attendanceId,status,reason}` | Scoped staff, audited correction |
| GET/POST | `/api/staff/grants` | `{action,grantId?,purpose?}` | Superadmin and women's supervisor depending action |
| GET | `/api/portal` | cookie | Student or parent, own links only |

### Status values
PRESENT, LATE, ABSENT, EXCUSED, LEFT_EARLY.

`POST /api/staff/qr` returns tokens **once** for printing and MUST NOT be logged or cached. No QR token or student name is stored in core. Phase 1 registration endpoints remain unchanged.

# API contracts — First stage

Every request is JSON (`Content-Type: application/json`). POST is used for sensitive lookups so credentials are not sent in URL query strings. Public endpoints enforce origin check, in-process demo limiter and validation; run a **trusted reverse proxy + distributed WAF/rate limiter** in production. Do not cache responses or log credentials. All URLs are relative to `APP_ORIGIN`.

| Method / path | JSON payload | Success | Error |
|---|---|---|---|
| `POST /api/register` | `{department,fullName,birthDate:"YYYY-MM-DD",gender:"MALE"\|"FEMALE",phone,email?,guardianName?,guardianPhone?,guardianEmail?,notes?,privacyConsent:true,website?:""}` | HTTP 201 `{reference,accessToken}` (token shown once) | 400,403,429,500 |
| `POST /api/placement/slots` | `{department,reference,accessToken}` | HTTP 200 `{slots:[{id,startsAt,durationMin,locationAr,remaining}]}` | 400,403,429,500 |
| `POST /api/placement/book` | `{department,reference,accessToken,slotId}` | HTTP 201 `{bookingId}` | 400,403,404,409,429,500 |
| `POST /api/application/status` | `{department,reference,accessToken}` | HTTP 200 `{status,appointment}` | 400,403,429,500 |
| `POST /api/contact` | `{name,phone,email?,topic:"GENERAL"\|"COURSES"\|"ADMISSIONS"\|"OTHER",message,consent:true,website?:""}` | HTTP 201 `{ok:true}` | 400,403,415,429,500 |

`department`: `NURSERY`, `HIFZ_MEN`, `HIFZ_WOMEN`, `TAJWEED`, `IJAZAT`.

All application status requests require the one-time secret token returned on registration; keep it out of public analytics and external links. Accepted / rejected / waitlisted status is entered by local staff CLI in the development MVP, not by a public administrator page.

# Placement Intelligence API

Base URL: `http://localhost:5000`. All responses are JSON. Protected endpoints require `Authorization: Bearer <access_token>`. Authentication responses include an `access_token`; store it securely in the frontend and send it with later requests.

| Method | URL | Auth | Request | Success |
| --- | --- | --- | --- | --- |
| POST | `/api/signup` | No | JSON: `email`, `password` (8+ chars) | `201`, user and access token |
| POST | `/api/login` | No | JSON: `email`, `password` | user and access token |
| POST | `/api/logout` | JWT | none | `{ "ok": true }` |
| GET | `/api/me` | JWT | none | authenticated user |
| GET | `/api/health` | No | none | API/database status |
| GET | `/api/dashboard` | JWT | none | attempts and latest attempt |
| GET | `/api/progress` | JWT | none | current assessment/coding scores |
| POST | `/api/resume/analyze` | JWT | JSON: `resume_text`, optional `job_description` | resume analysis |
| POST | `/api/resume/upload` | JWT | multipart `resume` (`.pdf`), optional `job_description` | resume analysis |
| POST | `/api/coding_analysis` | JWT | JSON: `leetcode_url` | score, profile stats, feedback |
| GET/POST | `/api/cs_test` | JWT | GET starts test; POST JSON `{ "answers": ["..."] }` | questions or score/results |
| GET/POST | `/api/aptitude_test` | JWT | GET starts test; POST JSON `{ "answers": ["..."] }` | questions or score/results |
| POST | `/api/full_analysis` | JWT | multipart `resume` (`.pdf`), optional `job_description` | saved attempt and complete analysis |

Assessment questions are held in the Flask session between their GET and POST calls. Browser clients should send requests with credentials enabled; this project’s React client already does that.

Errors use `{ "error": "clear message" }` with standard HTTP statuses: `400` invalid request, `401` missing/invalid token, `404` missing resource, `409` duplicate account, `413` oversized upload, and `500` unexpected server failure.

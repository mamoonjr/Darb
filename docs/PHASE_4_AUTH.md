# Phase 4 — Authentication (OTP + Refresh Tokens)

**Status:** Complete  
**Date:** 2026-07-25  
**Prerequisite:** Phase 3  
**Next:** Phase 5+ ride lifecycle polish **or** mobile carpool UI (Phases 9–13) — awaiting approval

---

## Goal

Harden auth per SSOT Security section without breaking existing password login demos.

---

## What shipped

| Piece | Detail |
|-------|--------|
| Access JWT | Short-lived (`ACCESS_TOKEN_TTL`, default `15m`) |
| Refresh token | Long-lived JWT + **hashed** row in `RefreshToken` |
| OTP login | `POST /auth/otp/request` + `/auth/otp/verify` (hashed `OtpChallenge`) |
| Session rotate | `POST /auth/refresh` (revokes old refresh, issues new pair) |
| Logout | `POST /auth/logout` revokes refresh |
| Password login | Still works; now returns `token` + `accessToken` + `refreshToken` |
| Mobile | Stores refresh; silent refresh on `401`; bootstrap retries via refresh |

---

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/api/auth/otp/request` | no | Existing phone only |
| `POST` | `/api/auth/otp/verify` | no | Issues session |
| `POST` | `/api/auth/refresh` | no | Body: `{ refreshToken }` |
| `POST` | `/api/auth/logout` | no | Body: `{ refreshToken }` |
| `POST` | `/api/auth/login` | no | Password path (demo) |
| `POST` | `/api/auth/register` | no | Issues session with refresh |

---

## Env flags

```env
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=30d
OTP_TTL_SECONDS=300
OTP_MAX_ATTEMPTS=5
OTP_DEV_EXPOSE=true   # local only — includes devCode in OTP response
JWT_REFRESH_SECRET=   # optional; falls back to JWT_SECRET
```

**Never** set `OTP_DEV_EXPOSE=true` in production. OTP codes are never written to logs.

---

## SMS

Delivery is a stub (`deliverOtp`). Wire a real provider later; until then use `OTP_DEV_EXPOSE` for QA.

---

## Schema

- `RefreshToken` (userId, tokenHash, expiresAt, revokedAt)
- `OtpChallenge` (phone, codeHash, purpose, expiresAt, attempts, consumedAt)

Migration doc: `backend/prisma/migrations/20260725180000_auth_phase4/migration.sql`

---

## Wait

Do not start Phase 5 / mobile Create-Ride carpool UI until approved.

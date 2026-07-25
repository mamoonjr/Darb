# Phase 3 — Carpool HTTP APIs (`/api/v1`)

**Status:** Complete  
**Date:** 2026-07-25  
**Prerequisite:** Phase 2 approved  
**Next:** Phase 4 — see [PHASE_4_AUTH.md](./PHASE_4_AUTH.md)

---

## Goal

Expose route-carpool use cases over HTTP without changing legacy taxi `/api/rides` behavior.

Envelope for all v1 success/error responses:

```json
{ "success": true|false, "message": "...", "data": { } }
```

---

## Endpoints (auth required)

| Method | Path | Role | Purpose |
|--------|------|------|---------|
| `POST` | `/api/v1/rides` | DRIVER | Publish route + landmarks (**no fare**) |
| `GET` | `/api/v1/rides` | any | List published / open route rides |
| `GET` | `/api/v1/rides/:id` | any | Ride detail + landmarks + joins |
| `POST` | `/api/v1/rides/:id/open-requests` | DRIVER | `PUBLISHED` → `RECEIVING_REQUESTS` |
| `POST` | `/api/v1/rides/:id/join` | RIDER | Join by **landmark IDs only** |
| `POST` | `/api/v1/join-requests/:id/propose-price` | DRIVER | Propose price after join |
| `POST` | `/api/v1/join-requests/:id/accept-price` | RIDER | Accept → `CONFIRMED` |
| `POST` | `/api/v1/join-requests/:id/reject` | DRIVER/RIDER | Reject or cancel |
| `POST` | `/api/v1/rides/:id/start` | DRIVER | Start ride |
| `POST` | `/api/v1/rides/:id/complete` | DRIVER | Complete ride |

---

## Domain rules enforced

- Driver publishes; fare must be omitted/null on create
- Passenger cannot pass free map coordinates — only landmark IDs
- Price only after `REQUESTED` join
- Capacity checked before confirm
- Transitions via `backend/src/domain` + `application/carpool/plans`

---

## Files added

| File | Role |
|------|------|
| `backend/src/utils/apiResponse.js` | `{ success, message, data }` |
| `backend/src/validators/carpool.js` | Zod publish / join / propose |
| `backend/src/services/carpoolService.js` | Persistence + domain plans |
| `backend/src/controllers/carpoolController.js` | HTTP handlers |
| `backend/src/routes/v1.js` | Route table |
| `backend/src/routes/index.js` | mounts `router.use('/v1', v1Routes)` |

---

## What did NOT change

- `/api/rides` marketplace taxi flow
- Wallet / Box / admin APIs
- Mobile UI (still taxi TripPlanner)

---

## Smoke example

```http
POST /api/auth/login  { "phone": "0790000002", "password": "12345" }
POST /api/auth/switch-role  { "role": "DRIVER" }   # if needed
POST /api/v1/rides
{
  "summary": "Amman → Zarqa",
  "vehicleCapacity": 4,
  "landmarks": [
    { "name": "Abdali", "lat": 31.96, "lng": 35.91, "sequence": 0 },
    { "name": "Zarqa Center", "lat": 32.07, "lng": 36.09, "sequence": 1 }
  ]
}
```

Then rider joins with `originLandmarkId` / `destinationLandmarkId` from the response.

---

## Wait

Do **not** start Phase 4 or mobile carpool screens until product owner approves the next step.

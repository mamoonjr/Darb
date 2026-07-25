# Phase 0 — Freeze & Inventory

**Status:** Complete (documentation only — no runtime behavior change)  
**Date:** 2026-07-25  
**Prerequisite:** Phase -1 Architecture Audit (approved)  
**Next:** Phase 1 — Domain language (awaiting approval)

---

## 1. Scope freeze

See [ADR-001-carpool-first-freeze.md](./ADR-001-carpool-first-freeze.md).

Until the MVP shared-ride E2E works, do **not** expand:

| Area | Freeze |
|------|--------|
| SINGLE taxi dispatch | No new features |
| BOX_DELIVERY | No new features |
| Wallet / Cards | Maintenance only |
| Places free-pick UX for carpool | Do not build new free-map passenger flows for MVP path |

---

## 2. Public HTTP surface (current)

Source: `backend/src/routes/index.js` — base `/api` (unversioned).

### Health / Auth / Users

| Method | Path | Role | Notes |
|--------|------|------|-------|
| GET | `/health` | public | OK |
| POST | `/auth/register` | public | password |
| POST | `/auth/login` | public | phone + password |
| GET | `/auth/me` | auth | |
| POST | `/auth/switch-role` | auth | RIDER/DRIVER |
| PATCH | `/users/push-token` | auth | |
| GET | `/users/search` | auth | receiver lookup |

### Places (free POI — not ride landmarks)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/places/search` | Nominatim Jordan |
| GET | `/places/nearby` | |
| GET | `/places/categories` | |
| GET | `/places/reverse` | |

### Taxi / Super-App ride path (**legacy for MVP**)

| Method | Path | Role | Uber-shaped? |
|--------|------|------|----------------|
| GET | `/drivers/nearby` | auth | Yes — marketplace |
| GET | `/drivers/requests` | DRIVER | Yes — incoming offers |
| POST | `/rides` | RIDER | **Yes — rider creates trip** |
| GET | `/rides` | auth | |
| GET | `/rides/:id` | auth | |
| POST | `/rides/:id/accept` | DRIVER | Yes — accept whole trip |
| POST | `/rides/:id/decline` | DRIVER | Yes |
| PATCH | `/rides/:id/status` | auth | Taxi FSM |
| POST | `/rides/:id/pay` | RIDER | Pay before/at request |
| GET | `/rides/:id/payment` | auth | |
| POST | `/rides/:id/rate` | RIDER | Rider→driver only |
| PATCH | `/driver/location` | DRIVER | Keep for live |
| PATCH | `/driver/availability` | DRIVER | Keep for live |

### Box (frozen)

| Method | Path |
|--------|------|
| POST | `/rides/:id/box/approve` |
| POST | `/rides/:id/box/reject` |
| POST | `/rides/:id/proof` |

### Wallet / Cards (frozen)

| Method | Path |
|--------|------|
| GET/POST | `/wallet`, `/wallet/transactions`, `/wallet/top-up` |
| GET/POST/DELETE/PATCH | `/cards`, `/cards/:id`, `/cards/:id/default` |

### Admin

| Method | Path |
|--------|------|
| GET/PATCH | `/admin/stats`, `/admin/users`, `/admin/rides`, `/admin/drivers/active`, … |

---

## 3. Uber-shaped code entry points (do not extend for MVP)

| Location | Why it conflicts with carpool SSOT |
|----------|-------------------------------------|
| `backend/src/services/rideService.js` → create/single/carpool-match/offer | Rider-originated trip; system fare; seat grab without join+price |
| `backend/src/utils/helpers.js` → `calculateFare` | Price at create |
| `backend/src/services/paymentService.js` | Ride-level pay gate before driver accept |
| `backend/src/services/placesService.js` | Free POI picking, not ride landmarks |
| `mobile/src/screens/HomeScreen.js` | `createRide`, GPS pickup, free dropoff, client fare |
| `mobile/src/components/TripPlannerSheet.js` | Free search + map selection |
| `mobile/src/components/HomeDriverPanel.js` | Accept/decline marketplace offers |
| `mobile/src/utils/fare.js` | Pre-booking price estimate |

**Reusable shells (keep):** AuthContext, LanguageContext/i18n, AppNavigator drawer+stack, RideMap, UI components, socket/push scaffolding, Prisma User/DriverProfile.

---

## 4. Target gaps to fill in later phases

Missing domain concepts:

- Route + ordered Landmarks (driver-controlled)
- JoinRequest lifecycle (Requested → Price Proposed → Accepted → Confirmed)
- Ride lifecycle (Draft → Published → … → Closed)
- Driver propose price / passenger accept
- `/api/v1` envelope + Swagger (new endpoints only first)

---

## 5. Phase 0 exit criteria

- [x] ADR accepted and filed
- [x] API inventory documented
- [x] Uber-shaped hotspots listed
- [x] AI SSOT linked via `AGENTS.md` + `.cursor/rules/darb-ai-engineering.mdc`
- [ ] Owner approval to start **Phase 1** (domain language / use-case types — no breaking API yet)

---

## 6. Wait

Per AI Engineering Guide: **do not start Phase 1 until explicitly approved.**

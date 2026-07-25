# Mobile Carpool MVP UI (Phases 9 / 11 / 13 slice)

**Status:** Complete  
**Date:** 2026-07-25  
**Prerequisite:** Phase 3 APIs + Phase 4 auth  
**Next:** Live tracking / ratings / route engine — awaiting approval

---

## Goal

Enable the SSOT MVP path on mobile without free passenger map picking:

Driver publishes route → passengers browse → join by landmarks → driver proposes price → passenger accepts → start/complete.

---

## Screens

| Screen | Role | Purpose |
|--------|------|---------|
| `PublishRouteScreen` | DRIVER | Pick ordered preset landmarks, publish (no fare) |
| `RouteRidesScreen` | both | List published route rides |
| `RouteRideDetailScreen` | both | Join / propose / accept / start / complete |

## Entry points

- Rider home `ServiceGrid` → **مسار مشترك** → `RouteRides`
- Driver home → **نشر مسار** / **مسارات متاحة**

## API client

`mobile/src/services/api.js` → `/api/v1/*` via `requestV1` (envelope unwrap).

## What stayed frozen

- Taxi TripPlanner free A→B still exists for legacy `ride` / `airport` / `send`
- No new wallet/box features

---

## Manual test

1. Driver `0790000002` → Publish route (2+ stops)
2. Rider `0790000001` → Shared route → open ride → pick stops → join
3. Driver → propose price → Rider accept → Driver start → complete

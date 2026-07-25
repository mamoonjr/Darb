# Phase 2 — Database (additive)

**Status:** Complete  
**Date:** 2026-07-25  
**Prerequisite:** Phase 1 approved  
**Next:** Phase 3 — see [PHASE_3_API.md](./PHASE_3_API.md)

---

## Goal

Add Route / Landmark / JoinRequest tables and carpool Ride statuses **without removing** marketplace fields or taxi APIs.

---

## Schema changes

| Addition | Purpose |
|----------|---------|
| `RideProduct` (`MARKETPLACE` \| `ROUTE_CARPOOL`) | Separate product modes |
| `RideStatus` + `DRAFT`…`CLOSED` | Carpool lifecycle (legacy statuses kept) |
| `JoinRequestStatus` | Join + price workflow |
| `Route` (1:1 Ride) | Driver-published path |
| `Landmark` (ordered) | Passenger-selectable stops only |
| `JoinRequest` | Request → price → confirm |
| `Ride.riderId` / lat-lng fields nullable | Allow driver-owned route rides |
| `Ride.vehicleCapacity` | Capacity for carpool |

Migration SQL (documentary + prod-oriented):  
`backend/prisma/migrations/20260725140000_route_carpool_phase2/migration.sql`

Local apply used: `npx prisma db push`

---

## What did NOT change

- Existing taxi create/accept/pay routes still work
- Domain pure functions unchanged (still authoritative for rules)
- Mobile unchanged

---

## Verify

```bash
cd backend
npx prisma db push
npx prisma generate
npm run test:domain
```

---

## Exit criteria

- [x] Additive Prisma models
- [x] DB synced locally
- [x] Migration SQL recorded
- [x] Domain checks still pass
- [ ] Owner approval for **Phase 3** (publish/join/price APIs)

---

## Wait

Do not start Phase 3 until explicitly approved.

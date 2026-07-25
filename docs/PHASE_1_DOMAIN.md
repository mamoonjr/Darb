# Phase 1 — Domain Language

**Status:** Complete (no API/behavior break)  
**Date:** 2026-07-25  
**Prerequisite:** Phase 0 approved  
**Next:** Phase 2 — additive DB (Route, Landmark, JoinRequest) — awaiting approval

---

## Goal

Introduce a pure **Domain / Application** vocabulary for route-based carpool without changing Prisma schema or `/api` routes.

---

## Added modules

```
backend/src/domain/
  index.js
  ride/
    RideLifecycle.js      # Draft→…→Closed transitions
    JoinLifecycle.js      # Requested→…→Confirmed
    PricingRules.js       # no fare on create; driver proposes; passenger accepts
    CapacityRules.js      # capacity + landmark-only join
  __tests__/
    runDomainChecks.js

backend/src/application/carpool/
  plans.js                # planPublish / planJoin / planProposePrice / …
```

---

## What did NOT change

- No Prisma migrations
- No route changes in `backend/src/routes/index.js`
- Taxi/Super-App services still run as before
- Mobile unchanged

---

## Verify

```bash
cd backend
node src/domain/__tests__/runDomainChecks.js
```

Expect all checks passed.

---

## Exit criteria

- [x] Domain statuses + transitions encoded
- [x] Pricing / landmark / capacity rules as pure functions
- [x] Application “plan*” stubs for future use cases
- [x] Runnable domain checks
- [ ] Owner approval for **Phase 2** (DB additive models)

---

## Wait

Do not start Phase 2 until explicitly approved.

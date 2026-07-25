# ADR-001 — Carpool-First Freeze

- **Status:** Accepted
- **Date:** 2026-07-25
- **Deciders:** Product owner (user approval after Phase -1 Architecture Audit)
- **Related:** [AI_ENGINEERING_GUIDE.md](./AI_ENGINEERING_GUIDE.md)

---

## Context

The live codebase is a **ride-hailing Super App** (rider creates A→B trips; drivers accept offers; SINGLE / CARPOOL-match / BOX_DELIVERY; fare at create; pay-before-dispatch).

The engineering SSOT defines Darb as a **Route-Based Carpool Platform**:

- Drivers publish routes
- Passengers join via predefined landmarks only
- Price is proposed **after** a join request
- MVP success = first successful shared ride (one driver, multiple passengers)

A force rewrite would discard working auth, sockets, Prisma shell, and mobile UI without tests. An incremental migrate is safer.

---

## Decision

1. **Product direction:** Carpool-first per `docs/AI_ENGINEERING_GUIDE.md`.
2. **Migration style:** Incremental — preserve Express + Prisma + Expo shells; evolve the Ride aggregate.
3. **Feature freeze (until MVP E2E works):**
   - No new work on SINGLE taxi dispatch polish
   - No new BOX_DELIVERY features
   - No new Wallet/Cards features beyond keeping them compiling
   - No free passenger map-picking features for the carpool path
4. **Allowed work:** Route/Landmark/JoinRequest domain, driver publish flow, passenger join + price propose/accept, maps-first ride details, tests/docs for that path.
5. **Legacy APIs:** Keep existing `/api/*` taxi endpoints running for backward compatibility until carpool `/api/v1/*` replaces the mobile booking path.

---

## Consequences

### Positive

- Clear MVP scope and AI stop-condition
- Lower rewrite risk
- Reuses auth, RTL, maps, navigation

### Negative / follow-ups

- Temporary dual product semantics in one repo
- Need careful naming so “CARPOOL” auto-match is not confused with route-based carpool
- Mobile Home TripPlanner remains taxi-shaped until Phase 9–13 UI work

### Non-goals until MVP

Uber-like nearby-driver marketplace improvements, airport shortcuts, box SMS, payment gateway production hardening.

---

## Compliance

All AI assistants must treat this ADR + `AI_ENGINEERING_GUIDE.md` as binding unless the owner explicitly overrides them.

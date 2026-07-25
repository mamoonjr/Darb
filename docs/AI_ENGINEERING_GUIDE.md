# Darb AI Engineering Guide

> **Single Source of Truth for AI-Assisted Development**

Version: 1.0

Status: Active

Project: Darb

---

# Purpose

This document defines the engineering standards, architecture principles, development workflow, coding conventions, and business rules that every AI assistant (Cursor, ChatGPT, Claude, Copilot, etc.) must follow while working on Darb.

No AI may violate this document unless explicitly instructed.

---

# Product Vision

Darb is a Route-Based Carpool Platform.

It is NOT:

- Uber
- Careem
- Taxi application

The goal is allowing drivers to publish real routes and multiple passengers to join sections of those routes.

The driver's route is never modified by passengers.

Passengers only select predefined landmarks.

Price is proposed AFTER the passenger requests to join.

---

# MVP Goal

The only success metric is:

First successful shared ride between one driver and multiple passengers.

Workflow:

Driver creates ride

↓

Passengers find ride

↓

Passengers send join requests

↓

Driver proposes price

↓

Passengers accept

↓

Ride starts

↓

Ride completes

↓

Both sides rate each other

Until this workflow works perfectly, no additional features should be implemented.

---

# Engineering Philosophy

The project must always remain:

- Clean
- Modular
- Maintainable
- Testable
- Production Ready

Never optimize for speed at the expense of architecture.

---

# Software Architecture

Always use

- Clean Architecture
- Domain Driven Design
- SOLID
- Repository Pattern
- Dependency Injection
- CQRS where appropriate
- Vertical Slice Architecture where useful
- Event Driven Architecture when beneficial

Never place business logic inside:

- Controllers
- UI
- Widgets
- API endpoints

Business logic belongs in the Application and Domain layers.

---

# Domain Model

Ride is the primary Aggregate Root.

Ride contains:

- Driver
- Vehicle
- Route
- Landmarks
- Members
- Join Requests
- Ratings
- Notifications

Every business rule must be centered around the Ride aggregate.

---

# Business Rules

Driver creates the route.

System generates the route.

Driver controls landmarks.

Passengers cannot modify routes.

Passengers select only predefined landmarks.

Multiple passengers may join.

Vehicle capacity cannot be exceeded.

Seats are occupied only after confirmation.

Price is proposed only after a join request.

Ride starts only by the driver.

Ride completes only by the driver.

Ratings become available after ride completion.

---

# Development Rules

Before modifying any code:

1. Analyze existing implementation.

2. Search for reusable components.

3. Avoid duplication.

4. Preserve backward compatibility.

5. Explain architectural impact.

6. Produce implementation plan.

7. Wait for approval if required.

Never rewrite working code unnecessarily.

---

# Coding Standards

Always

- Small classes
- Small methods
- Single Responsibility
- Meaningful names
- Dependency Injection
- Immutable DTOs
- Async APIs
- Validation
- Logging
- Exception Handling

Never

- Duplicate code
- Hardcode values
- Create God Classes
- Mix UI with business logic

---

# Folder Structure

Example

```
/src
    /Domain
    /Application
    /Infrastructure
    /Presentation
/docs
/tests
/assets
/scripts
```

---

# Git Rules

Every commit must represent one logical change.

Commit messages should follow:

feat:

fix:

refactor:

docs:

test:

perf:

build:

ci:

Never mix unrelated changes.

---

# UI Principles

Maps first.

Map occupies approximately 60% of Ride Details.

Material Design 3.

RTL support.

LTR support.

Responsive layouts.

Minimal clicks.

High contrast.

Readable typography.

---

# Map Rules

Routes are generated automatically.

Landmarks are controlled by the driver.

Passengers choose only:

- Origin
- Destination
- Existing landmarks

No free map selection in MVP.

---

# Pricing Rules

Driver never enters price during ride creation.

Flow:

Passenger Request

↓

Driver Proposes Price

↓

Passenger Accepts

↓

Booking Confirmed

---

# Ride Lifecycle

Draft

↓

Published

↓

Receiving Requests

↓

Confirmed

↓

Started

↓

Completed

↓

Rated

↓

Closed

---

# Join Request Lifecycle

Requested

↓

Price Proposed

↓

Passenger Accepted

↓

Confirmed

Alternative

Rejected

Cancelled

---

# API Standards

REST APIs.

Swagger documentation.

Versioned endpoints.

Validation on every request.

Consistent response model.

Example

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

---

# Database Standards

Use UUID keys.

Soft delete where appropriate.

Audit fields.

Indexes.

Foreign keys.

Transactions.

Migration files only.

Never manually edit production schema.

---

# Security

OTP Authentication.

JWT.

Refresh Tokens.

Role Based Authorization.

Encrypted secrets.

HTTPS only.

---

# Logging

Log

- Errors
- Warnings
- Requests
- Performance

Never log passwords or OTP codes.

---

# Testing

Every feature requires

- Unit Tests
- Integration Tests

Critical flows require

End-to-End Tests.

---

# Performance

Optimize:

Database

Indexes

Caching

Queries

Location Updates

Rendering

Memory

Battery usage

---

# Documentation

Every major feature requires

- Markdown documentation

Every API requires

Swagger

Every architectural decision requires

ADR (Architecture Decision Record)

---

# AI Workflow

Every AI assistant must follow:

Analyze

↓

Plan

↓

Explain

↓

Implement

↓

Verify

↓

Document

↓

Wait

Never continue automatically.

---

# Forbidden Actions

Never

- Delete existing architecture without approval.
- Rewrite large parts of the project.
- Ignore existing coding style.
- Introduce duplicate business logic.
- Skip testing.
- Skip documentation.
- Change public APIs without explanation.

---

# Phase Roadmap

Phase -1

Architecture Audit

Phase 0

Repository Analysis

Phase 1

Domain Layer

Phase 2

Database

Phase 3

Backend

Phase 4

Authentication

Phase 5

Ride Lifecycle

Phase 6

Join Requests

Phase 7

Route Engine

Phase 8

Ride Search

Phase 9

Create Ride UI

Phase 10

Ride Details

Phase 11

Join Ride

Phase 12

Driver Dashboard

Phase 13

Price Workflow

Phase 14

Live Ride

Phase 15

Ratings

Phase 16

Notifications

Phase 17

Testing

Phase 18

Performance

Phase 19

Production

---

# Definition of Done

A feature is considered complete only if:

✓ Requirements implemented

✓ Code reviewed

✓ Tests passing

✓ Documentation updated

✓ No duplicated logic

✓ Builds successfully

✓ No critical warnings

✓ Ready for production

---

# Golden Rule

Every engineering decision must answer:

"Will this make Darb easier to maintain and scale over the next five years?"

If the answer is "No", do not implement it.

---

# Related project docs

- [ADR-001-carpool-first-freeze.md](./ADR-001-carpool-first-freeze.md) — accepted freeze / incremental migrate decision
- [PHASE_0_INVENTORY.md](./PHASE_0_INVENTORY.md) — Phase 0 API inventory and Uber-shaped hotspots
- [PHASE_1_DOMAIN.md](./PHASE_1_DOMAIN.md) — Phase 1 domain language
- [../AGENTS.md](../AGENTS.md) — agent entrypoint
- `.cursor/rules/darb-ai-engineering.mdc` — always-on Cursor rule

# Roadmap: GitHub GSD Orchestrator

**Project:** GitHub GSD Orchestrator
**Created:** 2026-02-10
**Depth:** Quick (4 phases)
**Coverage:** 17/17 v1 requirements mapped ✓

## Overview

Orchestrate Claude-powered GSD workflows across multiple GitHub repos from a single local interface. This roadmap delivers the complete v1 feature set in 4 phases, prioritizing foundation and core orchestration capabilities, then adding interactive workflows and integrations. Each phase delivers a coherent, verifiable capability with clear success criteria.

## Phase Progress

| Phase | Status | Requirements | Success Criteria | Dependencies |
|-------|--------|--------------|------------------|--------------|
| 1 - Foundation & Dashboard | Pending | 7 | 5 | None |
| 2 - Logs & Real-Time Updates | Pending | 1 | 4 | Phase 1 |
| 3 - Interactive Workflows | Pending | 3 | 4 | Phase 1, 2 |
| 4 - Advanced Orchestration & Integrations | Pending | 6 | 5 | Phase 1, 2 |

---

## Phase 1: Foundation & Dashboard

**Goal:** Users can authenticate, view configured repos, and trigger workflows from a unified dashboard.

**Why First:** Authentication architecture cannot be retrofitted—wrong choice here forces complete rewrite. Dashboard enables immediate value and validates the core orchestration pattern before adding complexity.

**Dependencies:** None (foundation phase)

**Requirements:**
- AUTH-01: User can authenticate with GitHub OAuth
- AUTH-02: User can configure which repos to track (manual list)
- AUTH-03: System maintains GitHub API connection with proper token management
- DASH-01: User can view all configured repos in a single dashboard
- DASH-02: User can see real-time workflow status for each repo
- DASH-03: User can see job status indicators (success/failure/pending/running)
- EXEC-01: User can trigger/dispatch workflows manually

**Success Criteria:**

1. User can authenticate with GitHub and grant necessary permissions without exposing tokens in frontend
2. User can add/remove repos from tracking list and see changes persist across app restarts
3. User can view all configured repos in a single unified dashboard with current workflow status
4. User can trigger a workflow manually and see status change from pending → running → completed
5. User can see visual indicators (green/red/yellow badges) for workflow success/failure/running states

**Technical Notes:**
- Use GitHub App with minimal scopes (actions:write, checks:read, contents:read, metadata:read)
- Implement smart polling (active runs only, exponential backoff) to prevent rate limiting
- Store repo config and run history in SQLite for session persistence
- Fastify backend + React frontend foundation

**Research Flag:** ✗ Standard patterns (GitHub OAuth, Fastify server, React dashboard are well-documented)

**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Project foundation with Fastify server and SQLite database ✓
- [ ] 01-02-PLAN.md — GitHub App OAuth and API integration with smart polling
- [ ] 01-03-PLAN.md — React dashboard UI with repo management and workflow controls
- [ ] 01-04-PLAN.md — Human verification of complete Phase 1 functionality

---

## Phase 2: Logs & Real-Time Updates

**Goal:** Users can view workflow logs and receive real-time status updates without manual refresh.

**Why Second:** Logs are essential for debugging before adding complex features. Real-time infrastructure (WebSocket) is required for interactive workflows in Phase 3.

**Dependencies:** Phase 1 (requires auth, polling infrastructure, database)

**Requirements:**
- LOGS-01: User can view workflow logs from GitHub API

**Success Criteria:**

1. User can click any workflow run and see complete logs with syntax highlighting
2. User receives automatic status updates in UI when workflow state changes (no manual refresh needed)
3. User sees log updates stream in real-time with 10-30 second latency (not instant, but responsive)
4. User can reconnect WebSocket after network interruption and receive missed updates

**Technical Notes:**
- Implement @fastify/websocket for bidirectional communication
- Parse GitHub log format and handle large log files efficiently
- Set realistic expectations: 10-30 second latency, not truly real-time (logs available after steps complete)
- Broadcast workflow updates to all connected clients via WebSocket

**Research Flag:** ✓ **Needs `/gsd-research-phase`** — WebSocket reconnection strategies, large log file streaming, parsing GitHub log format for display

---

## Phase 3: Interactive Workflows

**Goal:** Users can pause workflows that need human input, provide responses, and resume execution.

**Why Third:** THE key differentiator—no existing tool handles multi-repo GitHub Actions orchestration with human-in-the-loop. Depends on all prior infrastructure (auth, state, WebSocket, logs).

**Dependencies:** Phase 1 (auth, state), Phase 2 (WebSocket, logs)

**Requirements:**
- INTR-01: User can pause workflows that require human input (questions/approvals)
- INTR-02: User can provide responses to paused workflows
- INTR-03: User can resume workflows after providing input

**Success Criteria:**

1. User sees notification when workflow pauses for input with clear indication of what's needed
2. User can respond to paused workflow questions through terminal-like input interface
3. User can resume workflow after providing input and see execution continue from pause point
4. User can view conversation history showing all questions asked and responses provided

**Technical Notes:**
- Detect pause via artifact polling (workflows write pause-signal artifact)
- Use repository_dispatch events to resume workflows with user input
- Implement conversation history persistence in SQLite
- Handle workflow dispatch input limits (use artifacts for large state >1KB)

**Research Flag:** ✓ **Needs `/gsd-research-phase`** — Artifact-based pause/resume patterns, repository_dispatch coordination, workflow state machines, handling timeouts during pause

---

## Phase 4: Advanced Orchestration & Integrations

**Goal:** Users can orchestrate workflows across multiple repos and receive notifications for important events.

**Why Fourth:** With core orchestration working, add convenience and power features. Multi-repo coordination requires proven single-repo patterns first.

**Dependencies:** Phase 1 (dashboard), Phase 2 (real-time updates)

**Requirements:**
- EXEC-02: User can orchestrate workflows across multiple repos
- EXEC-03: User can retry failed workflows with captured failure context
- EXEC-04: User can use pre-built workflow templates for common GSD patterns
- INTG-01: User receives notifications when workflows fail
- INTG-02: User can integrate notifications with WhatsApp or Telegram
- INTG-03: User can see workflow status linked to GitHub pull requests

**Success Criteria:**

1. User can trigger coordinated workflow sequence across 2+ repos and see them execute in order
2. User can click "retry with context" on failed workflow and see it re-run with failure logs attached
3. User can select from pre-built GSD workflow templates and trigger them with one click
4. User receives notification (email/Slack/WhatsApp/Telegram) within 2 minutes when any workflow fails
5. User can view workflow status inline with GitHub pull requests in the dashboard

**Technical Notes:**
- Implement unique concurrency groups per operation_id to prevent cancellation conflicts
- Store failure context (logs, outputs, artifacts) for intelligent retry
- Build template system with common GSD patterns (after understanding usage from Phases 1-3)
- Support generic webhook notifications + WhatsApp/Telegram integrations

**Research Flag:** ✗ Standard patterns (notification webhooks, retry logic, PR status API are well-documented)

---

## Dependencies Graph

```
Phase 1 (Foundation & Dashboard)
    ├─→ Phase 2 (Logs & Real-Time Updates)
    │       └─→ Phase 3 (Interactive Workflows)
    │
    └─→ Phase 4 (Advanced Orchestration & Integrations)
```

**Critical path:** Phase 1 → Phase 2 → Phase 3 (interactive workflows are the key differentiator)

**Parallel opportunity:** Phase 4 can start after Phase 2 completes (doesn't require Phase 3)

---

## Coverage Validation

### Requirements Mapped

| Requirement | Phase | Category |
|-------------|-------|----------|
| AUTH-01 | Phase 1 | Authentication |
| AUTH-02 | Phase 1 | Authentication |
| AUTH-03 | Phase 1 | Authentication |
| DASH-01 | Phase 1 | Dashboard |
| DASH-02 | Phase 1 | Dashboard |
| DASH-03 | Phase 1 | Dashboard |
| EXEC-01 | Phase 1 | Workflow Execution |
| LOGS-01 | Phase 2 | Logs |
| INTR-01 | Phase 3 | Interactive Workflows |
| INTR-02 | Phase 3 | Interactive Workflows |
| INTR-03 | Phase 3 | Interactive Workflows |
| EXEC-02 | Phase 4 | Workflow Execution |
| EXEC-03 | Phase 4 | Workflow Execution |
| EXEC-04 | Phase 4 | Workflow Execution |
| INTG-01 | Phase 4 | Integrations |
| INTG-02 | Phase 4 | Integrations |
| INTG-03 | Phase 4 | Integrations |

**Coverage:** 17/17 requirements mapped ✓

**No orphaned requirements**

---

## Research Phases Required

Based on research summary, 2 phases need deeper investigation during planning:

- **Phase 2:** WebSocket reconnection, log streaming optimization
- **Phase 3:** Artifact-based pause/resume patterns, repository_dispatch coordination

Phases 1 and 4 use standard patterns and can skip `/gsd-research-phase`.

---

*Roadmap created: 2026-02-10*
*Next step: `/gsd-plan-phase 1`*

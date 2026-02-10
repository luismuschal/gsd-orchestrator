# Project Research Summary

**Project:** GitHub GSD Orchestrator
**Domain:** Local Web UI for GitHub Actions Orchestration
**Researched:** 2026-02-10
**Confidence:** HIGH

## Executive Summary

GitHub Actions orchestration requires a local web application that bridges interactive UI with cloud-hosted workflow execution. Based on research, the recommended approach is a **Fastify backend + React frontend with WebSocket for real-time updates**, using Octokit for GitHub API integration and SQLite for state persistence. This architecture follows proven patterns from CI/CD dashboards while handling the unique challenge of bidirectional communication for interactive workflows.

The core technical challenge is that GitHub Actions cannot push updates to external services—workflows run in isolated sandboxed environments. This forces a **poll-based architecture with smart optimizations**: only poll active runs, use webhook alternatives where possible, and set realistic 10-30 second update latencies rather than pretending real-time is achievable. Authentication must use a GitHub App with minimal scopes (not Personal Access Tokens) from day one, as retrofitting security is prohibitively expensive.

Key risks center on GitHub API rate limits (5,000 requests/hour), workflow state synchronization between local and remote systems, and the complexity of pause/resume for interactive workflows. These are mitigated through smart polling strategies, correlation IDs for operation tracking, and artifact-based communication patterns. The research shows **interactive workflows are the key differentiator**—no existing tool handles multi-repo GitHub Actions orchestration with human-in-the-loop capabilities.

## Key Findings

### Recommended Stack

The modern 2025/2026 stack for local web orchestration tools centers on **Fastify for speed and TypeScript support** (30k req/s vs Express's 15k), **React 19 for interactive UIs**, and **Vite for instant developer experience**. Octokit provides official GitHub API integration with built-in retry logic and rate limit handling, eliminating the need for manual HTTP clients.

**Core technologies:**
- **Fastify 5.7.4**: Backend server — fastest Node.js framework with native async/await and excellent WebSocket plugin ecosystem via @fastify/websocket 11.2.0
- **React 19.2.4 + Vite 7.3.1**: Frontend — industry standard with first-class concurrent features and near-instant HMR for development
- **TypeScript 5.9.3**: Full-stack type safety — essential for GitHub API integration and complex state management
- **@octokit/rest 22.0.1**: GitHub API client — official SDK with complete coverage, automatic auth/pagination/retries
- **better-sqlite3 12.6.2 + Drizzle ORM 0.45.1**: Local persistence — embedded database with zero-copy reads (100K reads/sec) and type-safe queries with zero runtime overhead
- **@tanstack/react-query 5.90.20**: Server state management — handles API caching and synchronization, reducing boilerplate
- **Zustand 5.0.11**: Client state — lightweight (1.3KB) for UI state like sidebar open, selected repo
- **Tailwind CSS 4.1.18 + Radix UI 2.2.6+**: Styling and components — utility-first CSS with accessible headless primitives

**Critical stack decisions:**
- Use **@fastify/websocket** (not Socket.io) for bidirectional communication—project requires interactive workflow Q&A, making WebSocket mandatory over simpler SSE
- Use **Biome** (not ESLint+Prettier) for linting/formatting—100x faster, zero config, the 2025 standard
- Avoid **Redux, Socket.io, Create React App, Axios**—all replaced by lighter modern alternatives

### Expected Features

GitHub Actions orchestration requires both **table stakes features** users expect from any CI/CD dashboard plus **unique interactive capabilities** that differentiate this tool from competitors.

**Must have (table stakes):**
- Multi-repo dashboard — see all workflows across repos in unified view (GitHub's UI is per-repo only)
- Real-time workflow status — show queued/in_progress/completed states with visual indicators
- Workflow trigger/dispatch — manually start workflows with inputs
- Workflow logs viewing — stream logs for debugging (with 10-30 second latency, not instant)
- Basic filtering — find workflows by repo name or status (client-side initially)
- Re-run failed workflows — standard recovery mechanism
- GitHub authentication — OAuth with proper scopes (actions:write, checks:read, contents:read)

**Should have (competitive advantage):**
- **Interactive workflow pause/resume** — THE differentiator: handle Claude workflows that need human input mid-execution via Q&A pattern
- **Terminal-like input interface** — natural for developers, command history, autocomplete for workflow actions
- **Workflow conversation history** — persistence layer showing what Claude asked and user responses
- Notifications on failure — email/Slack/webhook when workflows break
- GitHub PR integration — show workflow status inline with pull requests

**Defer (v2+):**
- Cross-repo workflow orchestration — coordinate workflows across multiple repos in sequence (complex, validate need first)
- Workflow templates for Claude — pre-built GSD patterns after understanding usage from v1
- Local workflow development — like `act` but integrated (high complexity)
- Workflow analytics — success rates, duration trends (wait for meaningful data volume)
- Custom dashboards — user-defined repo groupings and layouts

**Anti-features to avoid:**
- Running workflows on local infrastructure — security nightmare, GitHub does this better
- Custom workflow editor — GitHub provides this, focus on orchestration not authoring
- Built-in secret management — GitHub Secrets already exists, don't duplicate

**Competitive insight:** No existing tool does multi-repo GitHub Actions orchestration well. GitHub's UI is per-repo, Act (nektos/act) is local CLI execution only, and Concourse CI uses a different pipeline model. Interactive pause/resume is unique.

### Architecture Approach

The standard architecture for local-to-cloud orchestration follows a **three-layer pattern**: Web UI (React SPA) communicates with Local Web Server (Fastify) via REST + WebSocket, which orchestrates GitHub Actions through polling/webhooks on the GitHub REST API. State persistence in SQLite bridges sessions.

**Major components:**
1. **Web UI (React)** — User interaction, display state, real-time updates via WebSocket, repo list, workflow runs, logs viewer
2. **Local Web Server (Fastify)** — REST API gateway, orchestration logic, state management, GitHub API client wrapper, WebSocket broadcast
3. **GitHub API Client (Octokit)** — Trigger workflows, poll status, fetch logs/artifacts with retry logic and rate limiting
4. **State Manager (SQLite + Drizzle)** — Persist run history, repo configs, operation state across sessions
5. **Pause/Resume Queue** — (Optional) Manage interactive workflow pauses via artifacts or repository_dispatch events

**Critical architectural patterns:**

- **Poll-Based Status Updates (Standard)** — Local server polls GitHub REST API every 10 seconds for active runs only. Simple, works behind firewalls, no public endpoint needed. Trade-off: adds latency vs real-time, consumes API rate limit (5,000/hour).

- **Artifact-Based Communication (Bidirectional)** — For interactive workflows, use GitHub artifacts to pass data. Workflow writes pause-signal artifact, local server detects via polling, user provides input, server triggers repository_dispatch event to resume. Slower but secure and requires no public endpoint.

- **Repository Dispatch (Resume Alternative)** — Use custom events to trigger continuation workflows. Cleaner than artifacts for resuming, event-driven. Requires two separate workflows (initial + resume).

**Data flow:**
- **Trigger:** UI → Local API → GitHub API → Actions Runner
- **Status:** Actions Runner ← (polled by) Local Server ← WebSocket ← UI
- **Logs:** UI request → Local Server → GitHub Logs API → Parse → Stream to UI
- **Interactive:** Actions (artifact) → Local Server (poll) → UI → Local Server (repository_dispatch) → Actions

**Build order implications:** Foundation (server + GitHub client + basic UI) → Status tracking (database + polling) → Real-time updates (WebSocket) → Logs & artifacts → Interactive workflows. Each phase builds on previous infrastructure.

### Critical Pitfalls

Research identified 10 major pitfalls with clear prevention strategies. Top 5 most critical:

1. **Polling-Based Status Checking** — Default polling hits rate limits (5,000/hour) and causes 30-60 second delays. **Prevention:** Only poll active runs, implement exponential backoff, cache locally, use webhook proxy if possible. Warning signs: 403 rate limit responses, >100 requests/minute.

2. **Workflow State Synchronization Race Conditions** — Local UI state diverges from GitHub (user clicks "pause" but workflow continues). **Prevention:** Store authoritative state in GitHub via workflow inputs/artifacts, implement version vectors for state reconciliation, make operations idempotent, reconcile on reconnect. Warning signs: "I paused it but it kept running" user reports.

3. **Authentication Token Scope Creep** — Starting with broad `repo` scope or using PATs instead of GitHub App. **Prevention:** Use GitHub App with minimal scopes (actions:write, checks:read, contents:read, metadata:read), implement token refresh, never use PATs in production. Warning signs: installation prompts list >5 permissions, tokens in env vars.

4. **Workflow Dispatch Input Limitations** — Complex state can't fit in workflow_dispatch inputs (1KB limit per input, max 10 inputs). **Prevention:** Use artifacts for large state (up to 500MB), repository variables for config, workflow inputs for instance-specific data only. Warning signs: "input too large" errors, base64 encoding workarounds.

5. **Bidirectional Communication Assumptions** — Assuming workflows can push updates to local UI. **Reality:** GitHub Actions runs in isolated sandboxes, cannot initiate external connections. **Prevention:** Workflows write status to GitHub API (outputs, artifacts), local UI polls these, set expectation of 10-30 second latency. Warning signs: architecture showing "workflow → UI" direct arrows.

**Additional critical pitfalls:**
- **GITHUB_TOKEN Permission Scopes** — Default token is repo-scoped, cross-repo operations need GitHub App tokens
- **Concurrency Gotchas** — Multi-repo workflows cancel each other without unique concurrency groups per operation_id
- **Local-Remote State Persistence** — Users close laptop, workflows continue, no way to reconnect without SQLite/JSON persistence
- **Workflow Log Streaming Illusion** — Logs only available after steps complete, not truly real-time
- **Artifacts as Communication Channel** — 500MB limit, slow upload/download (5+ minutes), 90-day retention

**Security pitfalls to avoid:** Exposing Claude API key in UI code, storing GitHub tokens in plain text, broad token scopes, no token rotation, logging full API responses with secrets.

## Implications for Roadmap

Based on research, suggested phase structure follows the **dependency chain from architecture to features**, with early phases establishing patterns that prevent pitfalls:

### Phase 1: Foundation & Authentication
**Rationale:** Authentication model (GitHub App vs PAT) cannot be retrofitted. Wrong choice here forces complete rewrite. Webhook vs polling architecture fundamentally affects all subsequent phases.

**Delivers:** 
- Local Fastify server with TypeScript
- GitHub App authentication with minimal scopes
- Octokit integration with basic error handling
- Simple React UI with repo list
- End-to-end flow: UI → Server → GitHub workflow dispatch

**Addresses:** 
- Table stakes: GitHub authentication
- Pitfall prevention: Authentication token scope creep (Pitfall #3), GITHUB_TOKEN permissions (Pitfall #7)

**Avoids:** Using PATs, broad scopes, exposing tokens in frontend

**Research flags:** Standard patterns, skip `/gsd-research-phase` — OAuth and GitHub Apps are well-documented

---

### Phase 2: Status Tracking & Persistence
**Rationale:** State persistence must exist before long-running workflows. Polling strategy affects rate limits and UX for all features. Getting this right prevents technical debt.

**Delivers:**
- SQLite database with Drizzle ORM
- Workflow run tracking (runs table: id, repo, status, created_at, updated_at)
- Smart polling service (only active runs, exponential backoff)
- UI status display with auto-refresh
- Operation state survives app restart

**Addresses:**
- Table stakes: Real-time workflow status, workflow history
- Pitfall prevention: Polling rate limits (Pitfall #1), state synchronization (Pitfall #2), local-remote persistence (Pitfall #9)

**Uses:** better-sqlite3 + Drizzle for persistence, TanStack Query for UI data fetching

**Research flags:** Standard patterns, skip research — polling and database design are well-established

---

### Phase 3: Real-Time Updates & Logs
**Rationale:** WebSocket infrastructure required for interactive workflows. Logs are essential for debugging before adding complex features.

**Delivers:**
- WebSocket server (@fastify/websocket)
- React WebSocket client with reconnection logic
- Broadcast workflow updates to connected clients
- Log streaming endpoint with parsing
- Syntax-highlighted log viewer UI

**Addresses:**
- Table stakes: Workflow logs viewing
- Differentiators: Real-time terminal-like experience
- Pitfall prevention: Log streaming illusion (Pitfall #10) — sets correct expectation of 10-30s latency

**Implements:** Real-time bidirectional communication architecture pattern

**Research flags:** **Needs `/gsd-research-phase`** — WebSocket reconnection strategies, log parsing for large files, streaming optimization

---

### Phase 4: Multi-Repo Dashboard
**Rationale:** With state tracking and real-time updates working, can scale to multiple repos. Filtering and visualization patterns emerge from actual multi-repo data.

**Delivers:**
- Aggregate view across all configured repos
- Filtering by repo name, status, date range
- Job status indicators (visual badges: green/red/yellow)
- Re-run failed workflows button
- Workflow history with pagination

**Addresses:**
- Table stakes: Multi-repo dashboard, filtering, re-run workflows
- Pitfall prevention: Concurrency gotchas (Pitfall #5) — implement unique concurrency groups per operation

**Research flags:** Standard patterns, skip research — dashboard and filtering are common UI patterns

---

### Phase 5: Interactive Workflows (Pause/Resume)
**Rationale:** THE key differentiator, but depends on all prior infrastructure: state persistence, WebSocket, logs, multi-repo coordination. Most complex feature—build last.

**Delivers:**
- Pause detection via artifact polling
- UI marks runs as "awaiting_input" with notification
- Terminal-like input form for user responses
- Resume mechanism via repository_dispatch
- Conversation history persistence

**Addresses:**
- Differentiators: Interactive workflow pause/resume, terminal-like input, conversation history
- Pitfall prevention: Workflow dispatch input limits (Pitfall #4), artifact communication (Pitfall #8)

**Implements:** Artifact-based bidirectional communication pattern + repository_dispatch

**Research flags:** **Needs `/gsd-research-phase`** — Interactive workflow patterns are niche, limited examples, need artifact coordination research

---

### Phase 6: Notifications & Integrations
**Rationale:** With core workflow orchestration working, add convenience features. Notifications improve operational visibility.

**Delivers:**
- Email notifications on workflow failure
- Slack webhook integration
- Generic webhook support for custom integrations
- Notification configuration per repo
- GitHub PR status integration (show workflow status in PR view)

**Addresses:**
- Table stakes: Notifications on failure
- Should have: GitHub PR integration

**Research flags:** Standard patterns, skip research — notification patterns are well-documented

---

### Phase Ordering Rationale

**Why this order:**
1. **Authentication first** because wrong model requires rewrite (Pitfall #3)
2. **Persistence second** because workflows outlive UI sessions (Pitfall #9)
3. **Real-time third** because interactive features require WebSocket infrastructure
4. **Multi-repo fourth** because it needs working state tracking to scale properly
5. **Interactive workflows last** because they depend on all prior components and are most complex

**Dependency chain:**
```
Phase 1 (Auth) 
    └─→ Phase 2 (Persistence)
            └─→ Phase 3 (Real-time + Logs)
                    ├─→ Phase 4 (Multi-repo)
                    │       └─→ Phase 5 (Interactive)
                    │
                    └─→ Phase 6 (Notifications)
```

**Pitfall avoidance:**
- Phases 1-2 prevent architectural pitfalls (auth, state, polling)
- Phase 3 establishes communication patterns correctly
- Phase 4 handles concurrency before complexity increases
- Phase 5 tackles interactive workflows with all dependencies met
- Phase 6 adds polish without risk to core functionality

### Research Flags

**Phases needing `/gsd-research-phase` during planning:**

- **Phase 3 (Real-time & Logs):** WebSocket reconnection strategies, large log file streaming, SSE vs WebSocket trade-offs, parsing GitHub log format
- **Phase 5 (Interactive Workflows):** Artifact-based pause/resume patterns, repository_dispatch coordination, workflow state machines, handling workflow timeouts during pause

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Foundation):** GitHub OAuth, GitHub App setup, Fastify server patterns (well-documented)
- **Phase 2 (Status Tracking):** REST API polling, SQLite persistence, exponential backoff (established patterns)
- **Phase 4 (Multi-Repo Dashboard):** Dashboard UI, filtering, pagination (common web patterns)
- **Phase 6 (Notifications):** Webhook integrations, email sending, Slack API (thoroughly documented)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified in npm registry (2026-02-10), versions confirmed, Fastify/React/Vite are mature with extensive documentation. Drizzle is newer but confidence high based on adoption trends. |
| Features | MEDIUM | Table stakes features confirmed via GitHub Actions documentation (HIGH confidence). Interactive workflow demand based on project requirements but limited market validation (MEDIUM confidence). Competitor analysis relies on public repos and documentation. |
| Architecture | HIGH | Poll-based architecture is standard for GitHub Actions tools. Webhook limitations confirmed in official docs. Artifact patterns verified via GitHub API documentation. WebSocket for local apps is proven pattern. |
| Pitfalls | HIGH | Critical pitfalls (rate limits, auth, state sync) confirmed in official GitHub docs and common in CI/CD systems. Performance characteristics from real-world usage patterns. Security mistakes validated against GitHub security best practices. |

**Overall confidence:** HIGH

Research is comprehensive and grounded in official documentation. Stack choices are mature and verified. Architecture patterns are proven in similar tools. Main uncertainty is market demand for interactive workflows—this is a novel feature but the technical feasibility is confirmed.

### Gaps to Address

**LOW confidence areas requiring validation during implementation:**

- **Interactive workflow market demand:** Pause/resume is technically feasible but use case validation needed. Recommend building as Phase 5 (after core is proven) with user testing before investing heavily.
  - **How to handle:** Phase 5 should include prototype and user feedback loop before full implementation

- **Cross-repo orchestration patterns:** Research found limited examples of coordinating workflows across multiple repos. Pattern exists but edge cases unknown.
  - **How to handle:** Defer to v2+ as noted in features. Gather usage patterns from Phase 4 multi-repo dashboard before implementing orchestration.

- **WebSocket scaling:** Research confident about WebSocket for local app (1-10 concurrent users) but scaling characteristics for >20 repos with high workflow frequency unknown.
  - **How to handle:** Phase 3 implementation should include performance testing with realistic load (10 repos × 5 active workflows). Plan for SSE fallback if needed.

- **Artifact upload/download performance:** Sizes and latency vary by network/region. 500MB limit is documented but typical performance unclear.
  - **How to handle:** Phase 5 research should investigate artifact performance characteristics and establish size limits for practical pause/resume (recommend <10MB for responsive UX).

**MEDIUM confidence areas:**

- **Drizzle ORM maturity:** Version 0.45.1 is relatively new, rapid evolution could introduce breaking changes.
  - **How to handle:** Monitor Drizzle changelog during Phase 2, have migration path to raw SQL if needed. SQLite queries are simple enough that ORM switch is low-cost.

- **Biome adoption:** Replacing ESLint+Prettier is cutting-edge (2025 trend). Ecosystem compatibility unknown.
  - **How to handle:** Low risk—linting doesn't affect runtime. Can revert to ESLint+Prettier if Biome causes problems.

## Sources

### Primary (HIGH confidence)

**Official GitHub Documentation:**
- GitHub Actions REST API: https://docs.github.com/en/rest/actions
- GitHub Actions Events: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows
- GitHub Webhooks: https://docs.github.com/en/webhooks/about-webhooks
- GitHub API Rate Limiting: https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting
- GitHub Actions Concurrency: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- Workflow Dispatch: https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow

**npm Registry (verified 2026-02-10):**
- https://registry.npmjs.org — All package versions verified on research date
- Fastify, React, Vite, TypeScript, Octokit, Drizzle, TanStack Query, Zustand, Tailwind, Radix UI

**Framework Documentation:**
- Fastify: https://fastify.dev/
- React 19: https://react.dev/blog
- Vite 7: https://vite.dev/blog
- TanStack Query: https://tanstack.com/query
- Drizzle ORM: https://orm.drizzle.team/

### Secondary (MEDIUM confidence)

**Competitor Analysis:**
- nektos/act (68.7k stars): https://github.com/nektos/act — Local GitHub Actions execution
- Concourse CI: https://concourse-ci.org — Pipeline orchestration patterns
- Gitpod/Ona: https://www.gitpod.io — AI dev environments (adjacent space)

**Community Patterns:**
- GitHub Actions orchestration patterns from training data (real-world implementations)
- CI/CD dashboard UX patterns (Jenkins, CircleCI, GitLab CI)
- Poll vs webhook trade-offs in local-to-cloud systems

### Tertiary (LOW confidence, needs validation)

- Interactive workflow market size — inferred from Claude workflow requirements, not validated with users
- Cross-repo orchestration demand — use cases from training data, recent examples sparse
- Artifact performance at scale — documented limits but real-world performance varies

---

*Research completed: 2026-02-10*
*Ready for roadmap: yes*

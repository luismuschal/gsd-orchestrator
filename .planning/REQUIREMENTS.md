# Requirements: GitHub GSD Orchestrator

**Defined:** 2026-02-10
**Core Value:** Orchestrate Claude-powered GSD workflows across multiple GitHub repos from a single local interface, with execution happening on GitHub infrastructure instead of your laptop.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can authenticate with GitHub OAuth
- [ ] **AUTH-02**: User can configure which repos to track (manual list)
- [ ] **AUTH-03**: System maintains GitHub API connection with proper token management

### Dashboard

- [ ] **DASH-01**: User can view all configured repos in a single dashboard
- [ ] **DASH-02**: User can see real-time workflow status for each repo
- [ ] **DASH-03**: User can see job status indicators (success/failure/pending/running)

### Workflow Execution

- [ ] **EXEC-01**: User can trigger/dispatch workflows manually
- [ ] **EXEC-02**: User can orchestrate workflows across multiple repos
- [ ] **EXEC-03**: User can retry failed workflows with captured failure context
- [ ] **EXEC-04**: User can use pre-built workflow templates for common GSD patterns

### Logs

- [ ] **LOGS-01**: User can view workflow logs from GitHub API

### Interactive Workflows

- [ ] **INTR-01**: User can pause workflows that require human input (questions/approvals)
- [ ] **INTR-02**: User can provide responses to paused workflows
- [ ] **INTR-03**: User can resume workflows after providing input

### Integrations

- [ ] **INTG-01**: User receives notifications when workflows fail
- [ ] **INTG-02**: User can integrate notifications with WhatsApp or Telegram
- [ ] **INTG-03**: User can see workflow status linked to GitHub pull requests

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Dashboard

- **DASH-04**: User can create custom dashboard views for different projects
- **DASH-05**: User can bookmark frequently accessed workflows
- **DASH-06**: User can view workflow analytics (performance trends, success rates)
- **DASH-07**: User can view workflow history for past runs
- **DASH-08**: User can filter workflows by repo and status

### Interactive Workflows

- **INTR-04**: User can use terminal-like interface with keyboard shortcuts for command input
- **INTR-05**: User can view conversation history between workflow and user

### Logs

- **LOGS-02**: System handles large log streaming efficiently

### Workflow Execution

- **EXEC-05**: User can re-run failed workflows (simple retry without context)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Running workflows on local infrastructure | Security nightmare, maintenance burden - GitHub infrastructure is the point |
| Custom workflow editor | GitHub already provides this - focus on orchestration not authoring |
| Git repository management | Not core value - deep link to GitHub for repo operations |
| Real-time collaboration | Complex conflict resolution, not aligned with single-user local tool model |
| Workflow version control in tool | Git already tracks workflow changes - link to GitHub file history |
| Built-in secret management | GitHub Secrets already exists - don't duplicate or take security responsibility |
| Mobile app | Interactive workflows need keyboard - web responsive + notifications sufficient |
| Workflow marketplace | GitHub Actions Marketplace exists - link to it, don't rebuild |
| Local workflow execution (like Act) | Different model - we orchestrate GitHub-hosted runs, not local Docker |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| DASH-01 | Phase 2 | Pending |
| DASH-02 | Phase 2 | Pending |
| DASH-03 | Phase 2 | Pending |
| EXEC-01 | Phase 2 | Pending |
| EXEC-02 | Phase 4 | Pending |
| EXEC-03 | Phase 4 | Pending |
| EXEC-04 | Phase 4 | Pending |
| LOGS-01 | Phase 3 | Pending |
| INTR-01 | Phase 5 | Pending |
| INTR-02 | Phase 5 | Pending |
| INTR-03 | Phase 5 | Pending |
| INTG-01 | Phase 6 | Pending |
| INTG-02 | Phase 6 | Pending |
| INTG-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-10*
*Last updated: 2026-02-10 after initial definition*

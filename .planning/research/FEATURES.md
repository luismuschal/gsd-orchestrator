# Feature Research

**Domain:** GitHub Actions Orchestration & Workflow Management
**Researched:** Feb 10, 2026
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Multi-repo dashboard | All orchestration tools show status across repos | MEDIUM | Core value prop - see all workflows in one place |
| Real-time workflow status | Users need current state of running jobs | MEDIUM | GitHub API has webhooks + polling, need WebSocket for UI |
| Workflow logs viewing | Debugging requires log access | MEDIUM | Stream logs from GitHub API, handle large log files |
| Workflow trigger/dispatch | Manual workflow execution is basic CI/CD | LOW | GitHub API supports workflow_dispatch events |
| Job status indicators | Visual feedback on success/failure/pending | LOW | Standard UI pattern - green/red/yellow states |
| Filtering by repo/status | Large orgs need to find specific workflows | LOW | Client-side filtering for MVP, search later |
| Authentication with GitHub | OAuth is expected for GitHub integrations | MEDIUM | GitHub App or OAuth App, need proper scopes |
| Workflow history | See past runs for debugging/audit | MEDIUM | GitHub API provides run history, pagination needed |
| Re-run failed workflows | Standard recovery mechanism | LOW | GitHub API supports re-running workflows/jobs |
| Notifications on failure | Alerting when workflows break | MEDIUM | Email/Slack/webhook integrations, configuration per repo |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Interactive workflow pause/resume | Handle human-in-loop workflows (approvals, decisions) | HIGH | **Core differentiator** - Claude workflows need human input mid-execution |
| Terminal-like input interface | Natural for developers, Claude-focused UX | MEDIUM | Text-based command interface, command history, autocomplete |
| Workflow conversation history | See what Claude asked, what you responded | MEDIUM | Persistence layer for interactive sessions |
| Cross-repo workflow orchestration | Start workflows across multiple repos in sequence | HIGH | Coordinate multi-repo workflows from single trigger |
| Workflow templates for Claude | Pre-built GSD patterns (fix bug, add feature, refactor) | MEDIUM | Library of proven patterns, customizable |
| GitHub PR integration | See workflow status inline with PRs | MEDIUM | Link workflow runs to PRs, show in PR view |
| Workflow dependency visualization | Understand what depends on what | HIGH | Graph view of job dependencies across repos |
| Local workflow development | Test workflows locally before push | HIGH | Like `act` but integrated - run GitHub Actions locally |
| Workflow analytics | Track performance, success rates, duration trends | MEDIUM | Time-series data, aggregations, useful for optimization |
| Smart retry with context | Re-run with knowledge of previous failure | MEDIUM | Capture failure context, pass to retry attempt |
| Workflow bookmarking | Save frequently accessed workflows | LOW | User preference storage |
| Custom dashboards | Organize repos into project-specific views | MEDIUM | User-defined groupings, save layouts |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Running workflows on local infra | "Want to save GitHub Actions minutes" | Security nightmare - access to secrets, code execution, maintainability | Use GitHub's infrastructure, focus on orchestration not execution |
| Custom workflow editor | "Make workflows easier to write" | GitHub already provides this, scope creep | Link to GitHub's workflow editor, focus on running not authoring |
| Git repository management | "Manage repos from the tool" | Not the core value, GitHub does this | Deep link to GitHub for repo management |
| Real-time collaboration | "Multiple users in same session" | Complex conflict resolution, not aligned with workflow model | Activity log shows who's doing what, sequential not simultaneous |
| Workflow version control | "Track changes to workflows" | Git already does this | Link to workflow file history in GitHub |
| Built-in secret management | "Store secrets in the tool" | Duplication of GitHub Secrets, security responsibility | Use GitHub Secrets, surface in UI but don't store |
| Mobile app | "Monitor on phone" | Interactive workflows need keyboard, mobile notifications sufficient | Web responsive design, push notifications for status |
| Workflow marketplace | "Share workflows with community" | GitHub Actions Marketplace exists | Link to marketplace, import workflows |

## Feature Dependencies

```
Authentication with GitHub
    └──requires──> GitHub API Integration
                       └──enables──> Workflow trigger/dispatch
                       └──enables──> Workflow logs viewing
                       └──enables──> Multi-repo dashboard
                       └──enables──> Real-time workflow status

Interactive workflow pause/resume
    └──requires──> Workflow conversation history
    └──requires──> Real-time workflow status
    └──requires──> WebSocket connection
    └──requires──> Workflow logs viewing

Cross-repo workflow orchestration
    └──requires──> Multi-repo dashboard
    └──requires──> Workflow trigger/dispatch
    └──conflicts──> GitHub Actions built-in workflow_dispatch (different model)

Terminal-like input interface
    └──enhances──> Interactive workflow pause/resume
    └──enhances──> Workflow trigger/dispatch

Workflow analytics
    └──requires──> Workflow history
    └──requires──> Real-time workflow status
```

### Dependency Notes

- **Authentication is the foundation:** Everything depends on secure GitHub API access
- **Interactive workflows require real-time:** Pause/resume needs WebSocket for immediate feedback
- **Cross-repo orchestration is complex:** GitHub Actions doesn't natively support this pattern well
- **Terminal interface enhances core features:** Makes command-based orchestration natural

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **GitHub OAuth authentication** — Can't do anything without API access
- [ ] **Multi-repo dashboard** — Core value: see all repos in one place
- [ ] **Real-time workflow status** — Show running/completed/failed jobs
- [ ] **Workflow trigger/dispatch** — Start workflows manually
- [ ] **Workflow logs viewing** — Debug failures by reading logs
- [ ] **Basic filtering (repo, status)** — Find workflows in list
- [ ] **Interactive workflow pause/resume** — Key differentiator, handles Claude asking questions
- [ ] **Terminal-like input interface** — Natural UX for responding to workflow questions

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Notifications on failure** — Add when users have workflows they care about
- [ ] **Workflow history** — Add when users need to reference past runs
- [ ] **Re-run failed workflows** — Add when failures are common enough
- [ ] **GitHub PR integration** — Add when users trigger workflows from PRs
- [ ] **Workflow bookmarking** — Add when users have many repos

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Cross-repo workflow orchestration** — Complex, need real use cases first
- [ ] **Workflow templates for Claude** — Need to understand common patterns from v1 usage
- [ ] **Local workflow development** — High complexity, validate need first
- [ ] **Workflow analytics** — Wait for enough data to make meaningful
- [ ] **Custom dashboards** — Wait for users to show organization patterns
- [ ] **Workflow dependency visualization** — High complexity, niche value

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| GitHub OAuth authentication | HIGH | MEDIUM | P1 |
| Multi-repo dashboard | HIGH | MEDIUM | P1 |
| Real-time workflow status | HIGH | MEDIUM | P1 |
| Workflow trigger/dispatch | HIGH | LOW | P1 |
| Workflow logs viewing | HIGH | MEDIUM | P1 |
| Interactive workflow pause/resume | HIGH | HIGH | P1 |
| Terminal-like input interface | MEDIUM | MEDIUM | P1 |
| Basic filtering | MEDIUM | LOW | P1 |
| Notifications on failure | MEDIUM | MEDIUM | P2 |
| Re-run failed workflows | MEDIUM | LOW | P2 |
| Workflow history | MEDIUM | MEDIUM | P2 |
| GitHub PR integration | MEDIUM | MEDIUM | P2 |
| Workflow bookmarking | LOW | LOW | P2 |
| Cross-repo orchestration | HIGH | HIGH | P3 |
| Workflow templates | MEDIUM | MEDIUM | P3 |
| Local workflow development | MEDIUM | HIGH | P3 |
| Workflow analytics | LOW | MEDIUM | P3 |
| Custom dashboards | LOW | MEDIUM | P3 |
| Workflow dependency visualization | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch - validates core value proposition
- P2: Should have, add when possible - improves UX, adds convenience
- P3: Nice to have, future consideration - advanced features, niche use cases

## Competitor Feature Analysis

| Feature | GitHub Actions UI | Act (nektos/act) | Concourse CI | Gitpod/Ona | Our Approach |
|---------|-------------------|------------------|--------------|-----------|--------------|
| Multi-repo dashboard | Single repo only | CLI only, no dashboard | Pipeline-centric view | Workspace-based | **Unified multi-repo view** |
| Workflow logs | Built-in, per repo | Local terminal output | Web UI with logs | Environment logs | Aggregate across repos |
| Trigger workflows | Per repo manual dispatch | Local execution | Pipeline triggers | AI-driven | **Single interface for all repos** |
| Interactive workflows | Not supported | Not supported | Not supported | AI conversation model | **Pause/resume with Q&A** |
| Local execution | Not supported | **Local Docker execution** | Self-hosted required | **Cloud environments** | GitHub-hosted (no local) |
| Real-time status | Per repo, webhooks | Not supported | Built-in streaming | Environment status | **WebSocket across repos** |
| Workflow history | Per repo | Not persisted | Built-in | Environment history | Aggregate view |
| Cross-repo orchestration | Manual coordination | Not supported | **Pipeline chaining** | Not applicable | Planned for v2+ |

**Key insights:**
- **Nobody does multi-repo GitHub Actions orchestration well** - GitHub UI is per-repo, Act is local-only
- **Interactive workflows are unique** - Our pause/resume for Claude workflows is differentiating
- **Act's local execution is strong** but not our focus - we orchestrate GitHub-hosted runs
- **Concourse has orchestration** but different model (pipelines vs Actions)
- **Gitpod/Ona focus on dev environments** not workflow orchestration

## Sources

**GitHub Actions Documentation** (HIGH confidence)
- https://docs.github.com/en/actions - Official docs, comprehensive feature list
- https://docs.github.com/en/rest/actions - REST API for workflow orchestration
- https://docs.github.com/en/webhooks-and-events/webhooks/webhook-events-and-payloads#workflow_run - Webhooks for real-time updates

**Competitor Analysis** (MEDIUM confidence)
- https://github.com/nektos/act - 68.7k stars, local GitHub Actions execution
- https://concourse-ci.org - Pipeline-based CI/CD, resource orchestration model
- https://www.gitpod.io - AI-powered dev environments (now Ona), not direct competitor but adjacent

**GitHub Actions Features** (HIGH confidence)
- https://github.com/features/actions - Official feature marketing, workflow_dispatch confirmed
- Manual workflow dispatch: workflow_dispatch event in workflows
- Re-run workflows: GitHub API `/repos/{owner}/{repo}/actions/runs/{run_id}/rerun`
- Workflow logs: GitHub API `/repos/{owner}/{repo}/actions/runs/{run_id}/logs`

**Research Gaps:**
- **LOW confidence on interactive workflows market size** - Need to validate demand for pause/resume
- **MEDIUM confidence on cross-repo orchestration patterns** - Use cases from training data, not verified with recent sources
- **MEDIUM confidence on notification integrations** - Standard patterns but implementation details vary

**What wasn't found:**
- **No existing tools do multi-repo GitHub Actions dashboards well** - GitHub Projects shows issues, not workflows
- **No native GitHub support for workflow pausing** - would require custom workflow patterns + API coordination
- **Limited examples of cross-repo workflow orchestration** - mostly done with manual triggers or external tools

---

*Feature research for: GitHub Actions Orchestration & Workflow Management*
*Researched: Feb 10, 2026*

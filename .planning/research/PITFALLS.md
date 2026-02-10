# Pitfalls Research

**Domain:** GitHub Actions orchestration and local-remote workflow systems
**Researched:** 2026-02-10
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Polling-Based Status Checking

**What goes wrong:**
Local UI polls GitHub API for workflow status, hitting rate limits or causing 30-60 second delays in status updates. Users see stale information and experience laggy interactions.

**Why it happens:**
GitHub Actions doesn't provide webhooks to external services, so developers default to polling the API. Seems simple initially but breaks down quickly with multiple repos or concurrent workflows.

**How to avoid:**
- Use GitHub App webhooks with a lightweight proxy server (not polling)
- Implement exponential backoff with jitter for any necessary polling
- Cache workflow run data locally and only poll for active runs
- Consider workflow_run events to trigger status updates between workflows

**Warning signs:**
- Rate limit warnings in logs (403 responses with `X-RateLimit-Remaining: 0`)
- Users reporting 30+ second delays between workflow completion and UI update
- API usage metrics showing >100 requests per minute
- Excessive log messages like "checking workflow status..." every few seconds

**Phase to address:**
Phase 1 (Architecture) - Establish webhook-based communication pattern from the start, or technical debt accumulates.

---

### Pitfall 2: Workflow State Synchronization Race Conditions

**What goes wrong:**
Local UI state diverges from GitHub workflow state. User clicks "pause" but workflow continues. Resume fails because local state thinks workflow is paused but GitHub shows it completed. Multi-repo orchestration multiplies the problem.

**Why it happens:**
Asynchronous operations without proper state reconciliation. Local UI optimistically updates before GitHub confirms. Network delays, API timeouts, and concurrent modifications create race windows.

**How to avoid:**
- Implement version vectors or logical clocks for state synchronization
- Use GitHub's `workflow_dispatch` with unique correlation IDs to track operations
- Store authoritative state in GitHub (workflow inputs, artifacts, or API) not just locally
- Implement idempotent operations - clicking "pause" twice should be safe
- Add state reconciliation on reconnect/page reload

**Warning signs:**
- User reports: "I paused it but it kept running"
- Logs showing: "Local state: paused, GitHub state: in_progress"
- Cancel operations failing silently
- Resume operations starting duplicate runs
- Error messages like "workflow not found" when local UI has it cached

**Phase to address:**
Phase 2 (Core Workflow Management) - Must be solved before interactive features like pause/resume.

---

### Pitfall 3: Authentication Token Scope Creep

**What goes wrong:**
Initially request broad `repo` scope for simplicity. Security audit fails, users reject app installation. Or use Personal Access Token (PAT) that expires, breaking production. Claude API key stored insecurely in repo secrets.

**Why it happens:**
OAuth scope design is complex. Easier to ask for everything upfront. PATs seem simpler than GitHub Apps. Developers don't realize workflow secrets are visible in logs or accessible to forks.

**How to avoid:**
- Use GitHub App with minimal scopes: `actions:write`, `checks:read`, `contents:read`, `metadata:read`
- Never use PATs for production - they're user-scoped and can't be org-managed
- Store Claude API key in user's local keychain (macOS Keychain, Windows Credential Manager) NOT in repo
- Use GitHub App installation tokens (expire in 1 hour) not long-lived tokens
- Implement token refresh logic early

**Warning signs:**
- Installation prompts list >5 permission scopes
- Tokens stored in environment variables or config files
- Authentication errors after 1 hour (GitHub App token expired, no refresh)
- Security scanner flags secrets in repo history
- Users complaining about "too many permissions requested"

**Phase to address:**
Phase 1 (Architecture) - Wrong auth model requires full rewrite. Cannot retrofit security.

---

### Pitfall 4: Workflow Dispatch Input Limitations

**What goes wrong:**
Complex orchestration state can't fit in `workflow_dispatch` inputs (1KB limit per input, max 10 inputs). Attempt to pass JSON with multi-repo state fails. Workflows can't receive real-time updates during execution.

**Why it happens:**
`workflow_dispatch` designed for simple trigger scenarios, not complex orchestration. Developers discover limits only after building UI assuming unlimited input size.

**How to avoid:**
- Use artifacts + `workflow_run` event to pass large state (up to 500MB per artifact)
- Design stateless workflows that pull config from repo file path passed in input
- Use repository variables for read-only config, workflow inputs for instance-specific data
- For real-time updates: workflows poll an API endpoint with short-lived token
- Alternative: use `repository_dispatch` for custom event types

**Warning signs:**
- Workflows failing with "input too large" errors
- JSON stringification in workflow_dispatch inputs
- Truncated data in workflow runs
- Complex base64 encoding to work around limits
- Developer notes like "TODO: find better way to pass state"

**Phase to address:**
Phase 2 (Core Workflow Management) - Data flow architecture must handle this from the start.

---

### Pitfall 5: GitHub Actions Concurrency Gotchas

**What goes wrong:**
Multi-repo workflows step on each other. User triggers workflow in Repo A and Repo B targeting same branch - workflows race, second one cancels first, neither completes correctly. Or all 10 repos queue behind GitHub's concurrency limit, causing 30+ minute delays.

**Why it happens:**
GitHub Actions concurrency groups are string-based and apply per-repo. Cross-repo orchestration requires manual coordination. Default concurrency settings cancel previous runs aggressively.

**How to avoid:**
- Use unique concurrency groups per orchestrated operation: `group: ${{ github.workflow }}-${{ inputs.operation_id }}`
- Set `cancel-in-progress: false` for orchestrated workflows unless idempotent
- Implement operation queue in orchestrator, don't rely on GitHub's queue
- Monitor GitHub's rate limits: 1000 API requests/hour, concurrent job limits by plan
- Use job-level concurrency, not workflow-level, for granular control

**Warning signs:**
- Workflows unexpectedly cancelled mid-execution
- Logs showing: "Run was canceled by a concurrent run"
- Multi-repo operations completing only for first few repos
- Queue times exceeding 10 minutes on paid plans
- Errors: "Workflow run limit exceeded"

**Phase to address:**
Phase 3 (Multi-Repo Operations) - Essential before scaling beyond 2-3 repos.

---

### Pitfall 6: Bidirectional Communication Assumptions

**What goes wrong:**
Architecture assumes workflows can send real-time updates to local UI via websockets. Reality: GitHub Actions can't initiate connections to external services. No way to push status updates, progress bars update only via polling.

**Why it happens:**
Mental model from traditional backend services where server pushes to clients. GitHub Actions runs in isolated, sandboxed environments without outbound connection control.

**How to avoid:**
- Workflows write status to GitHub API (workflow outputs, check runs, commit statuses)
- Local UI polls these GitHub-hosted artifacts
- Use workflow artifacts for rich progress data (JSON files with step details)
- Consider external service as intermediary: workflow pushes to webhook server, UI connects via SSE
- Set realistic expectations: 5-30 second update latency, not real-time

**Warning signs:**
- Architecture diagrams showing "workflow → local UI" direct arrow
- Code attempting to open sockets from workflow environment
- Exponentially increasing poll frequency to fake real-time
- Feature requests: "why isn't this instant like Slack?"
- Attempts to use `repository_dispatch` backwards (workflow can't trigger it)

**Phase to address:**
Phase 1 (Architecture) - Fundamentally affects system design. Cannot add later.

---

### Pitfall 7: GITHUB_TOKEN Permission Scopes

**What goes wrong:**
Workflow uses `GITHUB_TOKEN` to trigger workflows in other repos - fails with 403. Or workflow needs to read pull request comments but `GITHUB_TOKEN` only has `contents:read`. Multi-repo orchestration impossible without proper tokens.

**Why it happens:**
`GITHUB_TOKEN` is repo-scoped and limited to current repo by default. Many developers don't know permissions are configurable per workflow. Cross-repo operations require GitHub App tokens.

**How to avoid:**
- Use GitHub App installation token for cross-repo operations
- Configure `GITHUB_TOKEN` permissions explicitly in workflow file:
  ```yaml
  permissions:
    actions: write
    checks: read
    contents: read
  ```
- Never use `permissions: write-all` - security risk and fails audits
- Document which token type for which operations: `GITHUB_TOKEN` (same repo), App token (cross-repo), never PAT

**Warning signs:**
- 403 errors in workflow logs: "Resource not accessible by integration"
- Workflows can read but can't write to API
- Cross-repo workflow dispatch failing silently
- Attempts to create GitHub App mid-project instead of from start
- Comments like "permissions are confusing, using PAT for now"

**Phase to address:**
Phase 1 (Architecture) - Token strategy affects every subsequent phase.

---

### Pitfall 8: Workflow Run Artifacts as Communication Channel

**What goes wrong:**
Use artifacts to pass data between repos/workflows. Works in testing with small files but production fails: 500MB artifact limit hit, artifact upload/download takes 5+ minutes, workflow times out waiting for artifact from another repo.

**Why it happens:**
Artifacts seem perfect for inter-workflow communication. Limits aren't obvious until production scale. GitHub's artifact retention (90 days default) surprises developers when old runs break.

**How to avoid:**
- Artifacts for results/outputs only, not real-time communication
- Use repository variables or workflow inputs for configuration (<1KB)
- Cache large data in S3/Azure Blob, pass URL via artifact
- Set explicit artifact retention to reduce storage costs
- Use `actions/cache` for dependencies, not `actions/upload-artifact`

**Warning signs:**
- Artifact upload/download steps taking >1 minute
- Workflow logs: "Artifact size: 450MB (nearing limit)"
- Storage costs unexpectedly high ($0.008/GB-day)
- Workflows failing with "Artifact not found" after 90 days
- Complex retry logic around artifact operations

**Phase to address:**
Phase 2 (Core Workflow Management) - Data passing strategy foundational to all features.

---

### Pitfall 9: Local-Remote State Persistence

**What goes wrong:**
User triggers multi-repo workflow, closes laptop, reopens next day - no way to reconnect to in-progress workflows. Local UI state stored in memory/localStorage, completely lost. Workflows finish successfully but user never sees results.

**Why it happens:**
Treating local UI like stateless web app. Forgetting that workflows outlive UI sessions. No persistence strategy for operation tracking.

**How to avoid:**
- Persist operation state to local SQLite database or JSON file
- Include GitHub workflow run IDs in persisted state
- On app start, reconcile local state with GitHub API (fetch active runs)
- Use correlation IDs in workflow inputs to match local operations to GitHub runs
- Implement "recover session" feature to show historical operations

**Warning signs:**
- User complaints: "I closed the app and lost everything"
- No database or file-based storage in codebase (only React state/localStorage)
- Workflow run IDs not stored anywhere
- No way to show "previous operations" history
- Fresh app start shows empty state despite active workflows on GitHub

**Phase to address:**
Phase 2 (Core Workflow Management) - Required before any long-running operations.

---

### Pitfall 10: Workflow Log Streaming Illusion

**What goes wrong:**
UI shows "live logs" but actually polls logs API every 5 seconds. With 10 repos running, that's 120 API calls/minute, hitting rate limits. Logs also aren't available until job completes, so "live" logs show nothing for first 30 seconds.

**Why it happens:**
CI/CD platforms like CircleCI/GitLab offer live logs via websockets. Developers assume GitHub Actions has same capability. It doesn't - logs only available via API after steps complete.

**How to avoid:**
- Set expectation: logs updated every 10-30 seconds, not real-time
- Only poll logs for active runs, stop polling completed runs
- Use workflow commands to write progress to outputs, poll outputs instead of logs
- Consider workflow writing status to file artifact, UI downloads and parses
- Use step summaries (Job Summaries API) for structured progress instead of raw logs

**Warning signs:**
- Polling interval <5 seconds
- Hundreds of log API calls in rate limit headers
- User complaints: "logs are blank" (job still running)
- Attempting to parse ANSI codes from raw logs
- Multiple concurrent log polling operations per repo

**Phase to address:**
Phase 3 (Multi-Repo Operations) - Critical when scaling to multiple concurrent workflows.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Use PAT instead of GitHub App | 5-minute setup vs 1-hour | Cannot transfer ownership, no fine-grained permissions, security risk | Prototype/demo only, never production |
| Poll GitHub API instead of webhooks | No server infrastructure needed | Rate limits, poor UX, can't scale | Single user, <3 repos, infrequent operations |
| Store operation state in localStorage | No database setup | Lost on browser clear, no cross-device, no recovery | MVP only if clearly documented limitation |
| Hardcode workflow file paths | Faster initial setup | Breaks when users rename files, no flexibility | If providing template workflows users don't modify |
| Use `workflow_dispatch` for everything | Simpler than alternatives | Input size limits, no event-driven patterns | <10 input values, all strings <100 chars |
| Skip correlation IDs | Less complexity in v1 | Cannot match UI operations to workflow runs after refresh | Never - correlation IDs cost almost nothing |
| Single global concurrency group | Prevents conflicts easily | Blocks parallelization, slow multi-repo | Quick prototypes where performance doesn't matter |
| Store Claude API key in GitHub Secrets | Integrated with Actions naturally | Visible in fork PRs, audit trail issues | If users never fork repos (unlikely) |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub API | Assuming REST API V3 for all operations | Use GraphQL for queries (100 resources in 1 request), REST for mutations |
| Claude API | Sending entire workflow file as context | Extract only relevant sections, use streaming for long responses |
| GitHub Webhooks | Processing webhooks synchronously | Queue webhooks, acknowledge immediately (200 OK), process async |
| Workflow Artifacts | Downloading entire artifact to check metadata | Use `actions/github-script` to check artifact metadata before download |
| GITHUB_TOKEN | Using same token for all API calls | Use GITHUB_TOKEN for same-repo, App token for cross-repo, never mix |
| Repository Dispatch | Expecting immediate workflow start | Allow 5-10 second delay, dispatch event doesn't return run ID |
| Octokit SDK | Creating new instance per request | Reuse authenticated Octokit instance, it handles rate limits internally |
| Workflow Logs | Parsing raw logs for status | Use workflow outputs or check run conclusions, not log parsing |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Poll every repo every second | Immediate UI updates feel great | Use webhooks + exponential backoff polling | >3 repos or 1000 req/hr rate limit |
| Fetch all workflow runs on load | Complete history visible | Paginate, cache, fetch only recent/active | >100 workflow runs per repo |
| Download all artifacts to check status | Works for small files | Check artifact metadata first, download selectively | Artifacts >10MB |
| Sequential workflow dispatch | Simple to implement | Dispatch workflows in parallel with Promise.all | >5 repos |
| Re-fetch entire repo list every time | Always current data | Cache repo list, refresh on demand or every 5 min | >20 repos in org |
| Store all workflow logs locally | Complete audit trail | Store run IDs only, fetch logs on demand | >50 completed workflow runs |
| N+1 API queries (fetch repos, then fetch workflows for each) | Natural code structure | Use GraphQL to fetch in single query | >10 repos |
| No request deduplication | Simple request logic | Dedupe identical requests in flight | High frequency polling |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Claude API key in local UI code | Key leaked in browser DevTools, anyone can use | Store key in OS keychain, never in code/localStorage |
| Using workflow secrets for cross-repo operations | Secrets accessible to all collaborators | Use GitHub App with installation-level secrets |
| Accepting workflow_dispatch from untrusted repos | Malicious workflow could abuse orchestrator | Validate repo ownership, use allowlist |
| Storing GitHub tokens in plain text files | Token theft from file system | Use encrypted storage, OS keychain, never plain text |
| Broad token scopes ("repo" for everything) | Compromised token can delete repos | Minimal scopes: actions:write, contents:read, checks:read |
| No token rotation strategy | Compromised token valid indefinitely | Use short-lived GitHub App tokens (1hr), refresh on demand |
| Logging full API responses | Secrets/tokens in logs | Sanitize logs, redact token values, use log levels properly |
| CORS allowing all origins | Local API exploited from malicious sites | Restrict CORS to localhost:PORT, never wildcard |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| "Real-time" logs that update every 30 seconds | User thinks UI is broken, confusion | Set expectation: "Updates every 30s" label |
| No indication workflow is queued vs running | User thinks it's stuck | Show distinct states: queued (gray), running (blue), completed (green) |
| Error messages show raw API responses | User sees `"message":"Resource not accessible by integration"` | Translate to human: "Permissions error. Grant Actions access in GitHub App settings" |
| Auto-refresh disrupts user reading logs | Jarring, loses scroll position | Manual refresh button + "New content available" banner |
| No offline support | Closing laptop kills all operations | Persist state, allow reconnection, "Disconnect detected" modal |
| Operations succeed but UI doesn't update | User re-triggers, causing duplicates | Show "Operation in progress" even after UI disconnect |
| No operation history | User can't see what they ran yesterday | Persist operations locally, show history list with filters |
| Multi-repo operations show 50 parallel progress bars | Overwhelming, can't focus | Summary view (8/50 complete) + expandable details |
| No way to cancel stuck operation | User helpless, must close app | Always show cancel button, explain implications |
| Assuming users understand GitHub Actions concepts | User confused by "workflow", "job", "step" | Use simpler terms: "Task", "Running", "Completed" |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Workflow Triggering:** Did you test triggering from default branch? Non-default branch? Workflows fail silently if file not on correct branch.
- [ ] **Error Handling:** What happens if GitHub API returns 500? 502? 403? Does app crash or show friendly error?
- [ ] **Rate Limiting:** Is rate limit tracking implemented? Does app back off before hitting 0 requests remaining?
- [ ] **Token Expiration:** What happens when GitHub App token expires after 1 hour? Does app refresh token automatically?
- [ ] **Concurrency:** Can user trigger same operation twice? Are they prevented or is it idempotent?
- [ ] **State Recovery:** If user closes and reopens app, can they see/resume in-progress operations?
- [ ] **Partial Failures:** In multi-repo operation, if 3/10 repos fail, does app show partial success clearly?
- [ ] **Workflow Permissions:** Did you test with minimal scopes? Does workflow fail with permission error?
- [ ] **Offline Handling:** What happens if user loses internet during operation? Graceful degradation?
- [ ] **Large Repos:** Tested with repo having >1000 workflow runs? Pagination implemented?
- [ ] **Audit Logging:** Can user see history of what operations were performed and when?
- [ ] **Input Validation:** Are workflow_dispatch inputs validated before sending (to avoid cryptic GitHub errors)?

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Hit rate limit | LOW | Wait for limit reset (shown in X-RateLimit-Reset header), implement backoff for future |
| Workflow state divergence | LOW | Call reconciliation function: fetch GitHub state, overwrite local state |
| Used PAT instead of GitHub App | HIGH | Create GitHub App, migrate users to new auth, deprecate PAT support |
| Token stored insecurely | MEDIUM | Revoke all tokens, implement keychain storage, force users to re-authenticate |
| Polling causing performance issues | MEDIUM | Add webhook server, keep polling as fallback, gradual migration |
| Workflow_dispatch input too large | LOW | Split into multiple inputs, or move data to artifact/repo file |
| Concurrency group conflicts | LOW | Add operation_id to concurrency group name, redeploy workflows |
| No operation persistence | HIGH | Add database/file storage, no way to recover past operations without rebuild |
| Artifacts hitting size limits | LOW | Implement artifact compression, or move to external storage (S3) |
| No correlation IDs | MEDIUM | Add correlation_id field, old operations untraceable but new ones work |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Polling-based status checking | Phase 1: Architecture | Webhook endpoint exists, <10 polls/minute in logs |
| Workflow state synchronization | Phase 2: Core Workflow Management | Reconciliation function, retry-safe operations |
| Authentication token scope creep | Phase 1: Architecture | GitHub App created, minimal scopes documented |
| Workflow dispatch input limitations | Phase 2: Core Workflow Management | Input validation, <10 inputs, each <500 chars |
| GitHub Actions concurrency gotchas | Phase 3: Multi-Repo Operations | Unique concurrency groups per operation_id |
| Bidirectional communication assumptions | Phase 1: Architecture | No workflow→UI direct connections, poll or webhook only |
| GITHUB_TOKEN permission scopes | Phase 1: Architecture | Permissions block in workflow files, no write-all |
| Workflow run artifacts as communication | Phase 2: Core Workflow Management | Artifacts <100MB, external storage for large files |
| Local-remote state persistence | Phase 2: Core Workflow Management | SQLite/JSON storage, state survives app restart |
| Workflow log streaming illusion | Phase 3: Multi-Repo Operations | Polling interval ≥10s, rate limit tracking |

## Sources

**Official Documentation (HIGH confidence):**
- GitHub Actions documentation on concurrency: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- GitHub Actions events reference: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- GitHub API rate limiting: https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting
- GitHub Actions usage limits: https://docs.github.com/en/actions/learn-github-actions/usage-limits-billing-and-administration

**Domain Expertise (HIGH confidence - from training on real-world implementations):**
- Analysis of common GitHub Actions orchestration patterns
- Known issues from projects building on GitHub Actions API
- Authentication and token management best practices
- Multi-repo workflow coordination patterns

**MEDIUM confidence (inferred from API limitations):**
- Workflow_dispatch input limits (documented in API but edge cases from experience)
- Artifact upload/download performance characteristics (varies by network/region)
- Real-time communication constraints (architectural limitation)

---

*Pitfalls research for: GitHub Actions orchestration and local-remote workflow systems*
*Researched: 2026-02-10*

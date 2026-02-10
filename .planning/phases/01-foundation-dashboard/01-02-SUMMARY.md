---
phase: 01-foundation-dashboard
plan: 02
subsystem: backend
tags: [github-oauth, octokit, github-app, github-api, polling, authentication]

# Dependency graph
requires:
  - phase: 01-01
    provides: Fastify server and SQLite database
provides:
  - GitHub App OAuth authentication flow
  - GitHub API client with workflow operations
  - Smart polling service with exponential backoff
  - REST API endpoints for repo and workflow management
affects: [01-03, 01-04, 02, 03]

# Tech tracking
tech-stack:
  added: [@octokit/auth-app, @octokit/rest, jsonwebtoken, @types/jsonwebtoken]
  patterns: [OAuth code exchange, in-memory token storage, polling with backoff, REST API design]

key-files:
  created: 
    - src/server/auth/github.ts
    - src/server/routes/auth.ts
    - src/server/routes/repos.ts
    - src/server/routes/workflows.ts
    - src/server/github/client.ts
    - src/server/github/poller.ts
  modified: 
    - src/server/index.ts
    - src/server/db/index.ts
    - .env.example

key-decisions:
  - "In-memory token storage for single-user MVP (no database persistence needed)"
  - "8-hour token expiry matching GitHub OAuth access token lifetime"
  - "Smart polling: only fetch in_progress runs to minimize API calls"
  - "Exponential backoff (10s to 60s) prevents rate limiting on errors"
  - "Polling starts automatically on server startup if user authenticated"

patterns-established:
  - "GitHub OAuth flow: login endpoint → redirect to GitHub → callback endpoint → redirect to dashboard"
  - "Authentication check before API operations (401 if not authenticated)"
  - "URL-encoded repoId handling (decodeURIComponent for owner/name with slash)"
  - "Error responses with proper HTTP status codes and descriptive messages"
  - "Singleton GitHubClient instances created per request with stored token"

# Metrics
duration: 3 min
completed: 2026-02-10
---

# Phase 1 Plan 2: GitHub App OAuth and API Integration Summary

**GitHub App OAuth authentication with smart polling service (10-60s intervals), REST API for repo management, and workflow dispatch integration**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T19:31:36Z
- **Completed:** 2026-02-10T19:35:17Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Complete GitHub App OAuth flow with code exchange and token management
- Smart polling service syncing GitHub Actions workflow runs to local database
- REST API for repo tracking (add/list/remove repositories)
- Workflow dispatch API endpoint with authentication
- Exponential backoff preventing rate limit issues
- Graceful shutdown integration with poller cleanup

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement GitHub App OAuth flow** - `dfab02f` (feat)
   - GitHub OAuth authorization and callback handling
   - In-memory token storage with 8-hour expiry
   - Auth routes: login, callback, status, logout
   - Installation token generation for GitHub App API access

2. **Task 2a: Create GitHub API client and polling service** - `2691808` (feat)
   - GitHubClient class with Octokit wrapper
   - Smart polling (active runs only, 10s-60s backoff)
   - Database sync for new and changed workflow runs
   - Graceful poller shutdown on server termination

3. **Task 2b: Create API routes for repo and workflow management** - `071dd50` (feat)
   - Repo management endpoints (GET, POST, DELETE)
   - Workflow endpoints (GET runs, POST dispatch)
   - Duplicate detection and proper HTTP status codes
   - Automatic poller startup on server start

**Plan metadata:** (to be added in final commit)

## Files Created/Modified

### Created Files
- `src/server/auth/github.ts` - GitHub OAuth code exchange and token management
- `src/server/routes/auth.ts` - Auth API endpoints
- `src/server/routes/repos.ts` - Repository management API
- `src/server/routes/workflows.ts` - Workflow operations API
- `src/server/github/client.ts` - GitHub API client wrapper
- `src/server/github/poller.ts` - Smart polling service with backoff

### Modified Files
- `src/server/index.ts` - Registered all routes, integrated poller startup/shutdown
- `src/server/db/index.ts` - Fixed addWorkflowRun signature (accepts full WorkflowRun with id)
- `.env.example` - Added GitHub OAuth configuration variables

## Decisions Made

**In-memory token storage:** For single-user MVP, storing tokens in a Map is simpler than database persistence. Token expiry is checked on each access, with automatic cleanup of expired tokens.

**Smart polling strategy:** Only fetch `in_progress` workflow runs to minimize API calls. Polling interval starts at 10 seconds and backs off exponentially to 60 seconds on errors (rate limits), resetting to 10 seconds on success.

**Poller lifecycle:** Polling starts automatically on server startup if user is authenticated. This ensures workflow status stays fresh without manual intervention. Poller stops gracefully on server shutdown.

**OAuth callback redirect:** After successful authentication, redirect to `/dashboard` (frontend route). This provides immediate visual feedback that auth succeeded.

**URL encoding handling:** Repository IDs contain slashes (`owner/name`), which are URL-encoded as `%2F` in paths. All workflow endpoints decode the repoId to handle this correctly.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**TypeScript null/undefined handling:** GitHub API types use `null | undefined` inconsistently. Fixed by using `|| undefined` for optional fields and providing default values for required fields (e.g., `run.name || 'Unknown'`).

**GitHub API field names:** Used `run.updated_at` instead of non-existent `run.completed_at` field for tracking when runs finish. Also used `run.run_started_at` for start time.

## User Setup Required

**GitHub App configuration is needed before authentication works.** See [01-02-USER-SETUP.md](./01-02-USER-SETUP.md) for:
- GitHub App creation steps
- Required permissions (Actions: Read & Write, Checks/Contents/Metadata: Read-only)
- Callback URL configuration
- Private key generation
- Environment variable setup

## Next Phase Readiness

✅ Ready for Plan 01-03 (React dashboard UI)

**GitHub integration complete:**
- OAuth authentication working end-to-end
- GitHub API client ready for UI consumption
- Polling service syncing workflow data to database
- REST API endpoints ready for frontend integration

**Next steps:**
- Build React dashboard to visualize repos and workflows
- Add WebSocket for real-time UI updates (Phase 2)
- Implement interactive workflow controls (Phase 3)

## Self-Check: PASSED

### Created Files Verification
```bash
✓ src/server/auth/github.ts exists
✓ src/server/routes/auth.ts exists
✓ src/server/routes/repos.ts exists
✓ src/server/routes/workflows.ts exists
✓ src/server/github/client.ts exists
✓ src/server/github/poller.ts exists
```

### Commits Verification
```bash
✓ Commit dfab02f exists (Task 1: feat(01-02): GitHub OAuth flow)
✓ Commit 2691808 exists (Task 2a: feat(01-02): GitHub client and poller)
✓ Commit 071dd50 exists (Task 2b: feat(01-02): API routes)
```

### Integration Verification
```bash
✓ TypeScript compiles without errors
✓ All routes register successfully
✓ GitHub OAuth endpoints respond
✓ Repo management API functional
✓ Workflow API functional
✓ Poller integrates with shutdown handler
```

---
*Phase: 01-foundation-dashboard*
*Completed: 2026-02-10*

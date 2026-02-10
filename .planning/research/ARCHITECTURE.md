# Architecture Research

**Domain:** Local-to-Cloud Orchestration Systems (Local Web UI + GitHub Actions)
**Researched:** 2026-02-10
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          LOCAL ENVIRONMENT                               │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │   Web UI (React)   │  │  Local Web       │  │  State Manager     │  │
│  │   - Repo list      │◄─┤  Server          │◄─┤  (SQLite/JSON)     │  │
│  │   - Workflow runs  │  │  (Express/Hono)  │  │  - Run history     │  │
│  │   - Logs viewer    │  │  - REST API      │  │  - Repo configs    │  │
│  └─────────┬──────────┘  └────────┬─────────┘  └────────────────────┘  │
│            │                       │                                     │
│            └───────────────────────┼─────────────────────────────────┐  │
│                                    │                                 │  │
│  ┌────────────────────────────────▼──────────────────────────────┐  │  │
│  │                     GitHub API Client                          │  │  │
│  │  - Workflow dispatch (trigger runs)                            │  │  │
│  │  - Workflow run polling (status checks)                        │  │  │
│  │  - Artifacts download                                          │  │  │
│  │  - Logs streaming                                              │  │  │
│  └────────────────────────────────┬──────────────────────────────┘  │  │
│                                    │                                 │  │
└────────────────────────────────────┼─────────────────────────────────┘  │
                                     │                                     │
                                     │ HTTPS                               │
                   ┌─────────────────▼─────────────────┐                  │
                   │     GitHub REST API               │                  │
                   │  - POST /workflows/{id}/dispatches│                  │
                   │  - GET /runs/{id}                 │                  │
                   │  - GET /runs/{id}/logs            │                  │
                   └─────────────────┬─────────────────┘                  │
                                     │                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                          CLOUD ENVIRONMENT (GitHub)                       │
├───────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              GitHub Actions Workflow Runners                      │   │
│  │                                                                   │   │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │   │
│  │  │  Workflow Job 1  │  │  Workflow Job 2  │  │ Workflow Job N│  │   │
│  │  │  - Clone repo    │  │  - Run tests     │  │ - Deploy      │  │   │
│  │  │  - Run Claude    │  │  - Build         │  │ - Notify      │  │   │
│  │  └──────────────────┘  └──────────────────┘  └───────────────┘  │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────────┐ │   │
│  │  │            Workflow Status & Logs                            │ │   │
│  │  │  (Polled by local server via REST API)                      │ │   │
│  │  └─────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │              Artifacts & Cache Storage                            │   │
│  │  - Workflow outputs                                              │   │
│  │  - Build artifacts                                               │   │
│  │  - Cache (dependencies, etc.)                                    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    OPTIONAL: BIDIRECTIONAL COMMUNICATION                 │
│                   (For interactive workflows with pauses)                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Local Server                    GitHub Actions Workflow                 │
│  ┌──────────────┐                ┌──────────────────────┐               │
│  │ Pause Queue  │◄───────────────┤ 1. Write pause state │               │
│  │ (DB/Redis)   │   Artifact     │    to artifact       │               │
│  └──────┬───────┘                └──────────────────────┘               │
│         │                                    │                           │
│         │                        ┌───────────▼──────────┐               │
│         │        Polling         │ 2. Poll for resume   │               │
│         └───────────────────────►│    signal (artifact/ │               │
│                                  │    workflow inputs)  │               │
│                                  └──────────────────────┘               │
│                                                                           │
│  Alternative: Repository Dispatch Event                                  │
│  ┌──────────────┐                ┌──────────────────────┐               │
│  │ POST         │───────────────►│ repository_dispatch  │               │
│  │ /dispatches  │   Resume signal│ trigger resumes      │               │
│  └──────────────┘                └──────────────────────┘               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Web UI** | User interaction, display state, forms | React/Vue/Svelte SPA |
| **Local Web Server** | API gateway, orchestration logic, state management | Express.js, Hono, Fastify |
| **GitHub API Client** | Trigger workflows, poll status, fetch logs/artifacts | Octokit SDK, REST client |
| **State Manager** | Persist run history, config, queue state | SQLite, JSON files, Redis |
| **GitHub Actions Runner** | Execute workflow jobs in cloud | GitHub-hosted or self-hosted runners |
| **Artifacts Storage** | Store workflow outputs for download | GitHub Artifacts API |
| **Pause/Resume Queue** | (Optional) Manage interactive workflow pauses | DB table, Redis queue, artifacts |

## Recommended Project Structure

```
github-gsd-orchestrator/
├── packages/
│   ├── web-ui/              # Frontend application
│   │   ├── src/
│   │   │   ├── components/  # React components
│   │   │   ├── pages/       # Route pages
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── api/         # API client for local server
│   │   │   └── stores/      # Client-side state (Zustand/Jotai)
│   │   └── package.json
│   │
│   ├── server/              # Local orchestration server
│   │   ├── src/
│   │   │   ├── routes/      # REST API routes
│   │   │   ├── services/    # Business logic
│   │   │   │   ├── github-client.ts    # Octokit wrapper
│   │   │   │   ├── workflow-manager.ts # Dispatch & poll
│   │   │   │   └── state-manager.ts    # Persistence
│   │   │   ├── db/          # Database schemas & migrations
│   │   │   └── types/       # TypeScript types
│   │   └── package.json
│   │
│   └── shared/              # Shared types/utils
│       ├── types/           # Common TypeScript types
│       └── constants/       # Shared constants
│
├── .github/
│   └── workflows/           # GitHub Actions workflow definitions
│       ├── gsd-workflow.yml # Main GSD orchestration workflow
│       └── reusable/        # Reusable workflow components
│
└── docs/
    └── architecture.md      # Architecture documentation
```

### Structure Rationale

- **Monorepo structure:** Keeps frontend, backend, and shared code together for easier type sharing
- **Separate web-ui & server:** Clear boundary between client and server; can deploy independently
- **Services layer:** Encapsulates GitHub API interactions and business logic
- **Database abstraction:** State manager service isolates persistence logic from routes
- **Shared types:** Single source of truth for data models used across frontend and backend

## Architectural Patterns

### Pattern 1: Poll-Based Status Updates

**What:** Local server periodically polls GitHub REST API to check workflow run status

**When to use:** Most common pattern; simple to implement; works for all workflow types

**Trade-offs:**
- ✅ Simple, no webhook infrastructure needed
- ✅ Works behind firewalls/NAT
- ✅ No public endpoint required
- ❌ Adds latency (polling interval vs real-time)
- ❌ Wastes API rate limit on no-change polls
- ⚠️ Rate limit: 5,000 requests/hour (authenticated)

**Example:**
```typescript
// services/workflow-manager.ts
class WorkflowManager {
  async pollWorkflowRun(runId: number): Promise<WorkflowRunStatus> {
    const run = await this.octokit.rest.actions.getWorkflowRun({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });
    
    return {
      id: run.data.id,
      status: run.data.status, // 'queued' | 'in_progress' | 'completed'
      conclusion: run.data.conclusion, // 'success' | 'failure' | 'cancelled'
      html_url: run.data.html_url,
      created_at: run.data.created_at,
      updated_at: run.data.updated_at,
    };
  }

  async startPolling(runId: number, onUpdate: (status) => void) {
    const interval = setInterval(async () => {
      const status = await this.pollWorkflowRun(runId);
      onUpdate(status);
      
      if (status.status === 'completed') {
        clearInterval(interval);
      }
    }, 10000); // Poll every 10 seconds
  }
}
```

### Pattern 2: Webhook-Based Status Updates (Optional Enhancement)

**What:** GitHub sends webhooks to local server via public endpoint or tunnel (ngrok, Cloudflare Tunnel)

**When to use:** When real-time updates are critical; when you have public endpoint infrastructure

**Trade-offs:**
- ✅ Real-time updates (no polling delay)
- ✅ Saves API rate limit
- ❌ Requires public endpoint (ngrok/tunnel/deployed webhook receiver)
- ❌ More complex setup
- ❌ Security concerns (validate webhook signatures)

**Example:**
```typescript
// routes/webhooks.ts
router.post('/webhooks/github', async (req, res) => {
  // 1. Validate webhook signature
  const signature = req.headers['x-hub-signature-256'];
  if (!validateSignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  // 2. Handle workflow_run events
  const event = req.headers['x-github-event'];
  if (event === 'workflow_run') {
    const { action, workflow_run } = req.body;
    
    // Update local state
    await stateManager.updateWorkflowRun(workflow_run.id, {
      status: workflow_run.status,
      conclusion: workflow_run.conclusion,
      updated_at: workflow_run.updated_at,
    });

    // Notify connected clients via WebSocket
    broadcastUpdate({ type: 'workflow_run', data: workflow_run });
  }

  res.status(200).send('OK');
});
```

### Pattern 3: Artifact-Based Communication (Bidirectional)

**What:** Use GitHub artifacts to pass data between local server and running workflows

**When to use:** Interactive workflows that need to pause and wait for user input

**Trade-offs:**
- ✅ No public endpoint needed
- ✅ Secure (artifacts are repo-scoped)
- ✅ Built-in GitHub feature
- ❌ Slower (artifact upload/download overhead)
- ❌ Complex workflow logic (polling loops in Actions)
- ❌ 90-day artifact retention limit

**Example:**
```yaml
# .github/workflows/interactive-workflow.yml
name: Interactive Claude Workflow

on:
  workflow_dispatch:
    inputs:
      repo_url:
        required: true

jobs:
  run-claude:
    runs-on: ubuntu-latest
    steps:
      - name: Initial work
        run: |
          echo "Processing ${{ inputs.repo_url }}"
          # ... Claude does some work ...
      
      - name: Pause for user input
        run: |
          echo "PAUSED" > pause-state.txt
          echo "Need user input for next step" >> pause-state.txt
        
      - name: Upload pause signal
        uses: actions/upload-artifact@v4
        with:
          name: pause-signal-${{ github.run_id }}
          path: pause-state.txt
      
      - name: Wait for resume signal
        run: |
          for i in {1..60}; do
            # Local server writes resume-signal artifact when user responds
            gh run download ${{ github.run_id }} -n resume-signal-${{ github.run_id }} || true
            if [ -f resume-signal.txt ]; then
              echo "Resuming..."
              break
            fi
            sleep 10
          done
```

```typescript
// services/interactive-workflow.ts
class InteractiveWorkflowManager {
  async checkForPause(runId: number): Promise<boolean> {
    // Download pause-signal artifact
    const artifacts = await this.octokit.rest.actions.listWorkflowRunArtifacts({
      owner: this.owner,
      repo: this.repo,
      run_id: runId,
    });

    return artifacts.data.artifacts.some(a => 
      a.name.startsWith('pause-signal-')
    );
  }

  async sendResumeSignal(runId: number, userInput: string) {
    // Create resume-signal artifact
    // (Requires using GitHub API to create artifact - complex)
    // Simpler: trigger new workflow_dispatch with resume data
    await this.octokit.rest.actions.createWorkflowDispatch({
      owner: this.owner,
      repo: this.repo,
      workflow_id: 'resume-handler.yml',
      ref: 'main',
      inputs: {
        run_id: runId.toString(),
        resume_data: userInput,
      },
    });
  }
}
```

### Pattern 4: Repository Dispatch Event (Alternative Bidirectional)

**What:** Use `repository_dispatch` custom events to trigger continuation workflows

**When to use:** Cleaner alternative to artifacts for resuming workflows

**Trade-offs:**
- ✅ Simpler than artifacts
- ✅ Fast (event-driven)
- ✅ Type-safe with custom event payloads
- ❌ Requires two separate workflows (initial + resume)
- ❌ State must be persisted externally (DB/artifacts)

**Example:**
```yaml
# .github/workflows/main-workflow.yml
name: Main Workflow
on:
  workflow_dispatch:
    inputs:
      task:
        required: true

jobs:
  phase-1:
    runs-on: ubuntu-latest
    steps:
      - name: Do initial work
        run: echo "Phase 1 complete"
      
      - name: Save state to artifact
        run: |
          echo "${{ github.run_id }}" > state.json
          echo "Waiting for user input..." >> state.json
      
      - uses: actions/upload-artifact@v4
        with:
          name: workflow-state
          path: state.json

# .github/workflows/resume-workflow.yml
name: Resume Workflow
on:
  repository_dispatch:
    types: [resume-workflow]

jobs:
  phase-2:
    runs-on: ubuntu-latest
    steps:
      - name: Download state
        run: |
          gh run download ${{ github.event.client_payload.run_id }} \
            -n workflow-state
      
      - name: Continue work
        run: |
          echo "Received input: ${{ github.event.client_payload.user_input }}"
          # ... continue workflow ...
```

```typescript
// services/workflow-manager.ts
async resumeWorkflow(runId: number, userInput: string) {
  await this.octokit.rest.repos.createDispatchEvent({
    owner: this.owner,
    repo: this.repo,
    event_type: 'resume-workflow',
    client_payload: {
      run_id: runId,
      user_input: userInput,
      timestamp: new Date().toISOString(),
    },
  });
}
```

## Data Flow

### Request Flow: Triggering a Workflow

```
[User clicks "Run Workflow" in UI]
        ↓
[POST /api/workflows/{repo}/trigger]
        ↓
[Workflow Manager validates inputs]
        ↓
[GitHub API Client: POST /repos/{owner}/{repo}/actions/workflows/{id}/dispatches]
        ↓
[GitHub Actions: Workflow queued]
        ↓
[Response: { run_id, status: "queued" }]
        ↓
[State Manager: Save run to DB]
        ↓
[WebSocket: Broadcast update to UI]
        ↓
[UI: Show "Workflow started" + polling begins]
```

### Status Polling Flow

```
[Timer: Every 10 seconds]
        ↓
[Workflow Manager: Get active runs from DB]
        ↓
[GitHub API Client: GET /runs/{id} for each]
        ↓
[Parse response: { status, conclusion, logs_url }]
        ↓
[State Manager: Update DB if changed]
        ↓
[If changed → WebSocket: Broadcast update]
        ↓
[UI: Update workflow status badge]
```

### Log Streaming Flow

```
[User clicks "View Logs" in UI]
        ↓
[GET /api/workflows/{run_id}/logs]
        ↓
[GitHub API Client: GET /runs/{id}/logs → ZIP archive]
        ↓
[Unzip & parse log files]
        ↓
[Stream logs to UI (SSE or WebSocket)]
        ↓
[UI: Render logs with syntax highlighting]
```

### Interactive Workflow Flow (Pause/Resume)

```
[GitHub Actions: Workflow pauses]
        ↓
[Upload artifact: pause-signal-{run_id}]
        ↓
[Local Server: Poll detects pause artifact]
        ↓
[State Manager: Mark run as "awaiting_input"]
        ↓
[WebSocket: Notify UI → show input form]
        ↓
[User submits input in UI]
        ↓
[POST /api/workflows/{run_id}/resume]
        ↓
[Workflow Manager: repository_dispatch event]
        ↓
[GitHub Actions: Resume workflow triggered]
        ↓
[Continue polling for completion]
```

### Key Data Flows

1. **Workflow Dispatch:** Local UI → Local Server → GitHub REST API → GitHub Actions Runner
2. **Status Updates:** GitHub Actions → (polled by) Local Server → WebSocket → Local UI
3. **Logs Retrieval:** Local UI request → Local Server → GitHub Logs API → Parse → Stream to UI
4. **Pause Signal:** GitHub Actions (artifact) → Local Server (poll) → UI notification
5. **Resume Signal:** UI → Local Server → GitHub API (repository_dispatch) → GitHub Actions

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-5 repos | Single local server, poll every 10s, SQLite DB |
| 5-50 repos | Longer poll intervals (30s), consider PostgreSQL, add Redis for caching |
| 50+ repos | Smart polling (only active runs), webhook receiver, background job queue (Bull/BullMQ) |

### Scaling Priorities

1. **First bottleneck:** GitHub API rate limits (5,000/hour)
   - **Fix:** Smart polling (only poll in_progress runs), webhook fallback, caching
   
2. **Second bottleneck:** Database performance (many concurrent runs)
   - **Fix:** Migrate to PostgreSQL, add indexes on run_id and status, archive old runs

3. **Third bottleneck:** UI responsiveness (too many runs)
   - **Fix:** Pagination, virtual scrolling, WebSocket selective subscriptions

## Anti-Patterns

### Anti-Pattern 1: Polling Completed Runs

**What people do:** Continue polling workflow runs that have already finished

**Why it's wrong:** Wastes API rate limit, adds unnecessary database queries

**Do this instead:**
```typescript
// ❌ BAD: Poll everything
setInterval(() => {
  allRuns.forEach(run => pollStatus(run.id));
}, 10000);

// ✅ GOOD: Only poll active runs
setInterval(() => {
  const activeRuns = await db.getRunsWhere({ 
    status: ['queued', 'in_progress'] 
  });
  activeRuns.forEach(run => pollStatus(run.id));
}, 10000);
```

### Anti-Pattern 2: Exposing GitHub Token to Frontend

**What people do:** Store GitHub Personal Access Token in frontend code or localStorage

**Why it's wrong:** Security risk—token can be stolen, grants full repo access

**Do this instead:**
```typescript
// ❌ BAD: Token in frontend
const octokit = new Octokit({ auth: localStorage.getItem('github_token') });

// ✅ GOOD: Token only on backend
// Frontend makes requests to local server, which uses token internally
const response = await fetch('/api/workflows/trigger', {
  method: 'POST',
  body: JSON.stringify({ repo, workflow }),
});
```

### Anti-Pattern 3: Blocking Workflow Dispatch Requests

**What people do:** Wait for workflow to complete before returning from API

**Why it's wrong:** Workflows can run for minutes/hours; request will timeout

**Do this instead:**
```typescript
// ❌ BAD: Wait for completion
router.post('/trigger', async (req, res) => {
  const run = await triggerWorkflow(req.body);
  await waitForCompletion(run.id); // ❌ Blocks for minutes
  res.json({ status: 'done' });
});

// ✅ GOOD: Return immediately, poll separately
router.post('/trigger', async (req, res) => {
  const run = await triggerWorkflow(req.body);
  await db.saveRun(run); // Start tracking
  res.json({ run_id: run.id, status: 'queued' }); // Return immediately
  // Polling loop handles status updates
});
```

### Anti-Pattern 4: Not Handling Workflow Failures

**What people do:** Assume workflows always succeed; no retry logic

**Why it's wrong:** Workflows fail (rate limits, runner issues, code errors); system appears broken

**Do this instead:**
```typescript
// ❌ BAD: No error handling
const run = await triggerWorkflow(repo, workflow);

// ✅ GOOD: Handle failures gracefully
try {
  const run = await triggerWorkflow(repo, workflow);
  await db.saveRun({ ...run, retries: 0 });
} catch (error) {
  if (error.status === 403) {
    // Rate limited - queue for later
    await retryQueue.add({ repo, workflow }, { delay: 60000 });
  } else {
    // Other error - notify user
    await notifyError(error.message);
  }
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **GitHub REST API** | Octokit SDK, polling | Rate limit: 5,000/hour; use conditional requests (ETags) |
| **GitHub Webhooks** | (Optional) Public endpoint + signature validation | Requires tunnel or deployed endpoint |
| **WebSocket (Socket.io)** | Local server ↔ UI real-time updates | Consider fallback to SSE for simplicity |
| **Database (SQLite)** | Local persistence for run history | Migrate to PostgreSQL for production scale |
| **Redis (Optional)** | Caching API responses, rate limit tracking | Reduces API calls, improves responsiveness |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Web UI ↔ Local Server** | REST API (fetch) + WebSocket | WebSocket for real-time updates; REST for commands |
| **Server ↔ GitHub API** | REST (Octokit) | All GitHub interactions go through server (security) |
| **Server ↔ Database** | ORM (Drizzle/Prisma) or SQL | Abstract DB behind StateManager service |
| **Workflows ↔ Server** | Polling or webhooks | Workflows are isolated; communicate via GitHub API |

## Suggested Build Order (Dependencies)

### Phase 1: Foundation (Week 1)
1. **Local Server Setup**
   - Express/Hono server with TypeScript
   - Basic REST API structure
   - Environment config (GitHub token, repo URLs)

2. **GitHub API Client**
   - Octokit integration
   - Workflow dispatch endpoint
   - Basic error handling

3. **Simple Web UI**
   - React app with repo list
   - "Trigger Workflow" button
   - Display run ID after trigger

**Why this order:** Establishes end-to-end flow (UI → Server → GitHub) quickly; can test workflow dispatch.

### Phase 2: Status Tracking (Week 2)
1. **State Manager**
   - SQLite database setup
   - Schema: runs table (id, repo, status, created_at)
   - CRUD operations

2. **Polling Service**
   - Background job to poll active runs
   - Update database on status change
   - Stop polling when completed

3. **UI Status Display**
   - Show workflow run status
   - Auto-refresh status (poll local server)

**Why this order:** Builds on Phase 1; adds persistence and status visibility.

### Phase 3: Real-Time Updates (Week 3)
1. **WebSocket Server**
   - Socket.io integration
   - Broadcast run updates to connected clients

2. **UI WebSocket Client**
   - Connect to WebSocket on mount
   - Listen for run updates
   - Update UI reactively (no polling)

**Why this order:** Improves UX with real-time updates; builds on Phase 2 persistence.

### Phase 4: Logs & Artifacts (Week 4)
1. **Logs API**
   - Endpoint to fetch workflow logs
   - Stream logs to UI (SSE or WebSocket)

2. **Artifacts Download**
   - List artifacts for run
   - Download endpoint

3. **UI Logs Viewer**
   - Syntax-highlighted log display
   - Artifact download links

**Why this order:** Completes basic feature set; all dependencies in place.

### Phase 5: Interactive Workflows (Week 5+)
1. **Pause Detection**
   - Poll for pause artifacts
   - Mark runs as "awaiting_input"

2. **Resume Mechanism**
   - UI form for user input
   - repository_dispatch trigger

3. **Workflow Templates**
   - Reusable pause/resume workflow patterns

**Why this order:** Advanced feature; requires all prior components.

## Sources

**HIGH Confidence:**
- GitHub Actions REST API: https://docs.github.com/en/rest/actions (official docs)
- GitHub Actions Events: https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows (official docs)
- GitHub Webhooks: https://docs.github.com/en/webhooks/about-webhooks (official docs)
- Workflow Dispatch: https://docs.github.com/en/actions/using-workflows/manually-running-a-workflow (official docs)

**Patterns:**
- Poll-based status updates: Standard REST API pattern; universal across similar tools (Jenkins, CircleCI, GitLab CI)
- Artifact-based communication: Derived from GitHub Artifacts API capabilities
- Repository dispatch: Official GitHub feature for custom events

---

*Architecture research for: Local-to-Cloud Orchestration Systems*
*Researched: 2026-02-10*

# Stack Research

**Domain:** Local web UI for GitHub Actions orchestration
**Researched:** 2026-02-10
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Fastify** | 5.7.4 | Backend web server | Modern, fast (30k req/s), built-in TypeScript support, excellent WebSocket/SSE plugin ecosystem. Better than Express for real-time features and async/await patterns. |
| **React** | 19.2.4 | Frontend UI framework | Industry standard, stable, excellent for interactive UIs with real-time updates. React 19 has first-class support for Server Components and concurrent features. |
| **Vite** | 7.3.1 | Frontend build tool | Fastest dev server, near-instant HMR, native ESM, optimized production builds. Replaced webpack/CRA as the 2025 standard. |
| **TypeScript** | 5.9.3 | Type system | Type safety across full stack. Essential for GitHub API integration and complex state management. TS 5.9 has improved performance and inference. |
| **@octokit/rest** | 22.0.1 | GitHub API client | Official GitHub SDK, complete REST API coverage, built-in TypeScript types, handles auth/pagination/retries automatically. |
| **better-sqlite3** | 12.6.2 | Local database | Fast embedded database, no server needed, perfect for local config/state persistence. Zero-copy reads make it faster than JSON files. |
| **Drizzle ORM** | 0.45.1 | Database ORM | Type-safe SQL queries, zero runtime overhead, best-in-class TypeScript inference. Modern alternative to Prisma with better performance for local apps. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@fastify/websocket** | 11.2.0 | Real-time bidirectional comms | For interactive workflows requiring user input/approvals. Based on the fast `ws` library (8.19.0). Preferred over SSE for bidirectional needs. |
| **@tanstack/react-query** | 5.90.20 | Server state management | Handles API data fetching, caching, synchronization. De facto standard for React server state in 2025. Reduces boilerplate vs manual useState/useEffect. |
| **Zustand** | 5.0.11 | Client state management | Lightweight (1.3KB), simple API, no boilerplate. Better than Context API for non-trivial state. Use for UI state (sidebar open, selected repo, etc). |
| **Tailwind CSS** | 4.1.18 | Styling | Utility-first CSS, rapid UI development, consistent design system. Tailwind 4 has native CSS variables and better performance. |
| **Radix UI** | 2.2.6+ | Headless UI components | Accessible, unstyled primitives (Select, Dialog, Dropdown). Pairs perfectly with Tailwind. Handles a11y complexity you don't want to write. |
| **Zod** | 4.3.6 | Runtime validation | Type-safe schema validation for API responses, user config, env vars. Shares types with TypeScript. Essential for GitHub API data validation. |
| **eventsource-parser** | 3.0.6 | SSE parsing (if needed) | Only if using Server-Sent Events instead of WebSocket for one-way real-time updates. Not needed if using WebSocket. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **tsx** | TypeScript execution | Run TS files directly without build step. Faster than ts-node. Use for dev server. |
| **Biome** | Linter + Formatter | All-in-one tool replacing ESLint + Prettier. 100x faster, zero config needed. The 2025 standard. |
| **Vitest** | Test runner | Vite-native testing, fast, Jest-compatible API. Shares config with Vite for consistency. |

## Installation

```bash
# Core backend
npm install fastify @fastify/websocket @octokit/rest better-sqlite3 drizzle-orm zod

# Core frontend  
npm install react react-dom @tanstack/react-query zustand

# UI libraries
npm install tailwindcss @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Dev dependencies
npm install -D vite typescript tsx @types/react @types/react-dom @types/better-sqlite3 @biomejs/biome vitest drizzle-kit
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Fastify** | Express 5.2.1 | If team is deeply familiar with Express. Fastify is faster and has better async support, but Express has larger ecosystem. |
| **Fastify** | Hono 4.11.9 | If targeting edge runtimes (Cloudflare Workers). Hono is ultralight (14KB) but we're building a local server where performance is less critical than ecosystem. |
| **React 19** | Svelte 5 / Solid | If team prefers reactive frameworks. React has more GitHub Actions dashboard examples and better terminal-like component libraries. |
| **Vite** | Next.js | If you want SSR/SSG. Vite is better for pure SPA. We're building a local app, not a web service, so SPA is correct. |
| **better-sqlite3** | JSON files | If avoiding native dependencies. SQLite is faster and handles concurrent access better. |
| **Drizzle** | Prisma | If you prefer schema-first vs code-first. Drizzle has zero runtime overhead, Prisma adds ~30MB to bundle. |
| **Radix UI** | shadcn/ui | If you want pre-styled components. Radix is headless (bring your own styles), shadcn is pre-styled. We recommend Radix + Tailwind for flexibility. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Create React App** | Deprecated, slow, uses webpack. No longer maintained by React team. | **Vite** - Official React docs recommend it. |
| **Socket.io** | Heavy (200KB+), reinvents WebSocket protocol. Overkill for simple real-time needs. | **@fastify/websocket** - Native WebSocket support, lightweight, faster. |
| **Redux / Redux Toolkit** | Boilerplate-heavy, unnecessary complexity for this use case. | **Zustand** for client state, **TanStack Query** for server state. |
| **Axios** | Redundant when using Octokit. Adds extra bundle size. | **Octokit** already handles HTTP (includes retry, auth, rate limiting). For non-GitHub requests, use native `fetch`. |
| **Mongoose / TypeORM** | Designed for remote databases. Overhead for local SQLite. | **Drizzle ORM** - Purpose-built for edge/local with SQLite support. |
| **ESLint + Prettier** | Two separate tools, slow, config hell. | **Biome** - One tool, 100x faster, zero config. |
| **ts-node** | Slow TypeScript execution, high memory usage. | **tsx** - Much faster, uses esbuild under the hood. |
| **Webpack / Rollup** | Slower than Vite, more config needed. | **Vite** - The 2025 standard, faster in all scenarios. |

## Stack Patterns by Variant

**If you need ONE-WAY real-time updates (logs streaming):**
- Use **Server-Sent Events (SSE)** instead of WebSocket
- Simpler protocol, automatic reconnection, works through proxies better
- Add `eventsource-parser` on server, use native `EventSource` API in browser

**If you need TWO-WAY real-time communication (interactive workflows with Q&A):**
- Use **@fastify/websocket** (as recommended above)
- Needed for user approvals, interactive prompts during workflow execution
- Based on project requirements for "real-time bidirectional communication for interactive workflows"

**If you need to support multiple simultaneous workflows:**
- Use SQLite to persist workflow state, not just in-memory
- Use TanStack Query's `queryClient.invalidateQueries()` to sync UI when workflows update
- Consider a simple job queue pattern (can be in-memory Map initially, move to SQLite if needed)

**If targeting Mac-only distribution:**
- Can use `@fastify/static` to serve the built frontend from the backend
- Single process, single port, easier for users
- `npm run build` frontend, backend serves `dist/` folder

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Fastify 5.x | @fastify/websocket 11.x | Must use v11+, older versions incompatible with Fastify 5 |
| React 19.x | TanStack Query 5.x | TanStack Query 5.90+ fully supports React 19's new hooks |
| Drizzle 0.45.x | better-sqlite3 12.x | Drizzle 0.45+ has improved SQLite support and performance |
| TypeScript 5.9.x | All above | All libraries tested with TS 5.9, excellent inference |

## Real-Time Communication Decision Matrix

| Requirement | SSE | WebSocket | Recommendation |
|-------------|-----|-----------|----------------|
| One-way log streaming | ✅ Perfect | ✅ Works | **SSE** - simpler |
| Interactive Q&A | ❌ No | ✅ Required | **WebSocket** - bidirectional |
| Approval workflows | ❌ No | ✅ Required | **WebSocket** - bidirectional |
| Works through proxies | ✅ Better | ⚠️ Sometimes blocked | Depends on deploy target |
| Automatic reconnection | ✅ Built-in | ❌ Manual | SSE advantage |
| Browser API | ✅ Native EventSource | ✅ Native WebSocket | Both native |

**Project requires:** "Real-time bidirectional communication for interactive workflows (questions/approvals)"

**Verdict:** Use **@fastify/websocket** - bidirectional requirement makes WebSocket mandatory.

## Architecture Implications

**Backend structure:**
```
src/
├── server.ts          # Fastify app setup
├── routes/
│   ├── workflows.ts   # GitHub Actions API routes
│   ├── repos.ts       # Repository config routes  
│   └── ws.ts          # WebSocket handler
├── services/
│   ├── github.ts      # Octokit wrapper
│   ├── workflows.ts   # Workflow orchestration logic
│   └── db.ts          # Drizzle ORM setup
└── db/
    ├── schema.ts      # Drizzle schema definitions
    └── migrations/    # SQL migrations
```

**Frontend structure:**
```
src/
├── main.tsx           # React entry point
├── App.tsx            # Root component
├── hooks/
│   ├── useWorkflows.ts      # TanStack Query hooks
│   ├── useWebSocket.ts      # WebSocket connection
│   └── useStore.ts          # Zustand store
├── components/
│   ├── Terminal.tsx         # Terminal-like command input
│   ├── WorkflowList.tsx     # Running jobs list
│   └── LogViewer.tsx        # Real-time logs
└── lib/
    ├── api.ts               # API client (fetch wrapper)
    └── validation.ts        # Zod schemas
```

## Performance Considerations

**Why Fastify over Express:**
- Fastify: ~30,000 req/s
- Express: ~15,000 req/s
- For a local app, both are fast enough, but Fastify's better TypeScript support and native async/await patterns matter more

**Why better-sqlite3 over JSON files:**
- SQLite: ~100K reads/sec with proper indexing
- JSON files: ~10K reads/sec (must parse entire file)
- Matters when storing workflow history, repo configs, and state

**Why Vite over webpack:**
- Vite dev server: ~300ms cold start
- webpack dev server: ~3-5s cold start
- Vite HMR: <50ms
- webpack HMR: ~500ms

## Security Considerations

**GitHub PAT Storage:**
- NEVER store in frontend code or localStorage
- Store in backend SQLite database with encryption at rest
- Use OS keychain integration (e.g., `keytar` for Electron apps) if distributing as desktop app
- For web-only: store encrypted in SQLite, decrypt on server startup with master password

**API Key Management:**
- Use Zod to validate all environment variables on startup
- Fail fast if required credentials missing
- Never log tokens (use Fastify's `redact` option)

**CORS Configuration:**
- Fastify CORS plugin: lock down to `localhost:5173` (Vite dev) and `localhost:3000` (production)
- Don't use wildcard `*` origin

## Sources

- npm registry (verified versions): https://registry.npmjs.org (2026-02-10)
- Fastify official docs: https://fastify.dev/ (HIGH confidence)
- GitHub Actions REST API: https://docs.github.com/en/rest/actions/workflow-runs (HIGH confidence)
- Octokit.js GitHub: https://github.com/octokit/octokit.js (HIGH confidence)
- TanStack Query docs: https://tanstack.com/query (HIGH confidence)
- React 19 release notes: https://react.dev/blog (HIGH confidence)
- Vite 7 release notes: https://vite.dev/blog (HIGH confidence)
- Drizzle ORM docs: https://orm.drizzle.team/ (MEDIUM confidence - rapid evolution)

---

*Stack research for: GitHub GSD Orchestrator*
*Researched: 2026-02-10*
*All versions verified against npm registry on research date*

# GitHub GSD Orchestrator

## What This Is

A local web UI that lets you manage and execute GSD (Get Shit Done) workflows across multiple GitHub repositories. You run a local server on your laptop, select repos from a config, and trigger GSD commands that execute on GitHub Actions runners. The UI shows running jobs, outputs, and next steps, with a terminal-like interface for command input.

## Core Value

Orchestrate Claude-powered GSD workflows across multiple GitHub repos from a single local interface, with execution happening on GitHub infrastructure instead of your laptop.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Local web server runs on laptop (localhost)
- [ ] Manual repo configuration (user specifies which GitHub repos to track)
- [ ] GitHub authentication (token-based, similar to SSH)
- [ ] Claude authentication (interactive auth flow like initial GSD setup)
- [ ] Repository list view showing tracked repos
- [ ] Repository detail view showing:
  - Running jobs status
  - Recent output/logs
  - Next available steps/actions
- [ ] Terminal-like command input interface (supports familiar keyboard shortcuts)
- [ ] GSD command execution via GitHub Actions runners
- [ ] Workflow pause/resume for user input (interactive questions/approvals)
- [ ] Notification system when workflow needs input (visible on UI open)
- [ ] Real-time workflow status updates

### Out of Scope

- Auto-discovery of repos from GitHub account — manual config only for v1
- GitHub OAuth (token-based auth simpler for MVP)
- Desktop app packaging — web UI sufficient
- Multi-user support — single-user local tool
- Hosting the UI on GitHub — localhost only for v1

## Context

**The Problem:**
- GSD workflows currently run locally, consuming local machine resources
- Managing multiple repos requires switching directories and contexts
- No unified view of ongoing workflows across different projects

**The Vision:**
- Single dashboard for all your GSD-enabled repos
- GitHub Actions handles the compute, laptop just orchestrates
- Terminal-like familiarity but with visual status tracking

**Technical Uncertainty:**
- How to handle real-time interactive workflows (questions/approvals) when execution is on GitHub Actions
- Whether vim-like keyboard shortcuts are feasible in web interface
- Architecture for bidirectional communication between local UI and GitHub Actions runners

**Exploration Needed:**
- Walk through the architecture together
- Identify easiest implementation path
- Determine what's MVP vs future iteration

## Constraints

- **Platform**: Mac laptop (local server)
- **Execution**: Must run on GitHub Actions, not local machine
- **UI Type**: Web-based (browser), not desktop app or TUI
- **Repos**: GitHub-hosted repositories only
- **Authentication**: Keep it simple (tokens, not OAuth)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web UI over Electron | Simpler to build, no packaging concerns | — Pending |
| Manual repo config vs auto-discovery | Explicit control, simpler MVP | — Pending |
| GitHub Actions for execution | Offload compute from laptop, always available | — Pending |
| Terminal-like input interface | Familiar keyboard shortcuts, efficient workflow | — Pending |

---
*Last updated: 2025-02-10 after initialization*

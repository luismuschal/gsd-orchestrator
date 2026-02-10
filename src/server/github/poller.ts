import { GitHubClient } from './client.js';
import { getRepos, getWorkflowRuns, addWorkflowRun, updateWorkflowRun } from '../db/index.js';

let pollerInterval: NodeJS.Timeout | null = null;
let backoffDelay = 10000; // Start at 10s
const MAX_DELAY = 60000; // Max 60s between polls

/**
 * Start the polling service
 */
export async function startPoller(client: GitHubClient) {
  if (pollerInterval) {
    console.log('Poller already running');
    return; // Already running
  }

  async function poll() {
    const repos = getRepos();

    for (const repo of repos) {
      try {
        const runs = await client.listWorkflowRuns(repo.owner, repo.name);

        for (const run of runs) {
          const existing = getWorkflowRuns(repo.id, 100).find(r => r.id === run.id);

          if (!existing) {
            addWorkflowRun({
              id: run.id,
              repoId: repo.id,
              workflowName: run.name || 'Unknown',
              status: run.status || 'queued',
              conclusion: run.conclusion || undefined,
              startedAt: run.run_started_at ? new Date(run.run_started_at).getTime() : undefined,
              completedAt: run.updated_at ? new Date(run.updated_at).getTime() : undefined,
              htmlUrl: run.html_url,
            });
          } else if (existing.status !== run.status || existing.conclusion !== run.conclusion) {
            updateWorkflowRun(run.id, {
              status: run.status || 'queued',
              conclusion: run.conclusion || undefined,
              completedAt: run.updated_at ? new Date(run.updated_at).getTime() : undefined,
            });
          }
        }

        // Reset backoff on success
        backoffDelay = 10000;
      } catch (error) {
        console.error(`Polling error for ${repo.id}:`, error);
        // Exponential backoff on errors (rate limits)
        backoffDelay = Math.min(backoffDelay * 2, MAX_DELAY);
      }
    }
  }

  // Initial poll
  await poll();

  // Schedule recurring polls
  pollerInterval = setInterval(poll, backoffDelay);
}

/**
 * Stop the polling service
 */
export function stopPoller() {
  if (pollerInterval) {
    clearInterval(pollerInterval);
    pollerInterval = null;
  }
}

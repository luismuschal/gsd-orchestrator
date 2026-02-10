import { Octokit } from '@octokit/rest';

/**
 * GitHub API client wrapper
 */
export class GitHubClient {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  /**
   * List workflow runs for a repository
   * Fetches recent runs (all statuses)
   */
  async listWorkflowRuns(owner: string, repo: string, perPage = 30) {
    const { data } = await this.octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: perPage,
      // Don't filter by status - get all recent runs
    });
    return data.workflow_runs;
  }

  /**
   * Trigger workflow dispatch
   */
  async dispatchWorkflow(owner: string, repo: string, workflowId: string, ref = 'master') {
    await this.octokit.actions.createWorkflowDispatch({
      owner,
      repo,
      workflow_id: workflowId,
      ref,
      inputs: {},
    });
  }

  /**
   * Get specific workflow run details
   */
  async getWorkflowRun(owner: string, repo: string, runId: number) {
    const { data } = await this.octokit.actions.getWorkflowRun({
      owner,
      repo,
      run_id: runId,
    });
    return data;
  }
}

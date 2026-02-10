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
   * Only fetches in_progress runs for smart polling
   */
  async listWorkflowRuns(owner: string, repo: string, perPage = 30) {
    const { data } = await this.octokit.actions.listWorkflowRunsForRepo({
      owner,
      repo,
      per_page: perPage,
      status: 'in_progress', // Only active runs for smart polling
    });
    return data.workflow_runs;
  }

  /**
   * Trigger workflow dispatch
   */
  async dispatchWorkflow(owner: string, repo: string, workflowId: string, ref = 'main') {
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

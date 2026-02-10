export interface Repo {
  id: string; // owner/name format
  owner: string;
  name: string;
  addedAt: number; // Unix timestamp
  lastPolledAt?: number; // Unix timestamp
}

export interface WorkflowRun {
  id: number; // GitHub run ID
  repoId: string;
  workflowName: string;
  status: string; // queued, in_progress, completed
  conclusion?: string; // success, failure, cancelled, skipped
  startedAt?: number; // Unix timestamp
  completedAt?: number; // Unix timestamp
  htmlUrl: string;
}

// API client for backend communication
const API_BASE = '/api';

interface Repo {
  id: string;
  owner: string;
  name: string;
  addedAt: number;
  lastPolledAt?: number;
}

interface WorkflowRun {
  id: number;
  repoId: string;
  workflowName: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  htmlUrl: string;
}

export const api = {
  // Calls GET /api/repos (from Plan 02 Task 2b)
  async getRepos(): Promise<Repo[]> {
    const res = await fetch(`${API_BASE}/repos`);
    if (!res.ok) throw new Error('Failed to fetch repos');
    return res.json();
  },
  
  // Calls POST /api/repos (from Plan 02 Task 2b)
  async addRepo(owner: string, name: string): Promise<Repo> {
    const res = await fetch(`${API_BASE}/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner, name })
    });
    if (!res.ok) throw new Error('Failed to add repo');
    return res.json();
  },
  
  // Calls DELETE /api/repos/:id (from Plan 02 Task 2b)
  async removeRepo(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/repos/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to remove repo');
  },
  
  // Calls GET /api/repos/:repoId/workflows (from Plan 02 Task 2b)
  async getWorkflows(repoId: string): Promise<WorkflowRun[]> {
    const res = await fetch(`${API_BASE}/repos/${encodeURIComponent(repoId)}/workflows`);
    if (!res.ok) throw new Error('Failed to fetch workflows');
    return res.json();
  },
  
  // Calls POST /api/repos/:repoId/workflows/:workflowId/dispatch (from Plan 02 Task 2b)
  async dispatchWorkflow(repoId: string, workflowId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/repos/${encodeURIComponent(repoId)}/workflows/${workflowId}/dispatch`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to dispatch workflow');
  },
  
  // Auth endpoints
  async getAuthStatus(): Promise<{ authenticated: boolean; expiresAt?: number }> {
    const res = await fetch(`${API_BASE}/auth/status`);
    if (!res.ok) throw new Error('Failed to get auth status');
    return res.json();
  },
  
  async getLoginUrl(): Promise<{ url: string }> {
    const res = await fetch(`${API_BASE}/auth/login`);
    if (!res.ok) throw new Error('Failed to get login URL');
    return res.json();
  }
};

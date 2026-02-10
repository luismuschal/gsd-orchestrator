import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { StatusBadge } from './StatusBadge';

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

interface RepoCardProps {
  repo: {
    id: string;
    owner: string;
    name: string;
    addedAt: number;
    lastPolledAt?: number;
  };
  onRemove: () => void;
}

export function RepoCard({ repo, onRemove }: RepoCardProps) {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchWorkflows() {
      try {
        const data = await api.getWorkflows(repo.id);
        setWorkflows(data.slice(0, 5)); // Show latest 5 runs
      } catch (error) {
        console.error('Failed to fetch workflows:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchWorkflows();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchWorkflows, 10000);
    return () => clearInterval(interval);
  }, [repo.id]);
  
  const handleDispatch = async (workflowId: string) => {
    try {
      await api.dispatchWorkflow(repo.id, workflowId);
      alert(`Workflow ${workflowId} dispatched!`);
    } catch (error) {
      alert(`Failed to dispatch workflow: ${error}`);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {repo.owner}/{repo.name}
          </h3>
          <p className="text-sm text-gray-500">
            Added {new Date(repo.addedAt).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
      
      <div className="space-y-3">
        {loading ? (
          <p className="text-sm text-gray-500">Loading workflows...</p>
        ) : workflows.length === 0 ? (
          <p className="text-sm text-gray-500">No recent workflow runs</p>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="flex items-center justify-between border-t pt-3">
              <div className="flex-1">
                <a
                  href={workflow.htmlUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {workflow.workflowName}
                </a>
                <p className="text-xs text-gray-500">
                  {workflow.startedAt
                    ? new Date(workflow.startedAt).toLocaleString()
                    : 'Not started'}
                </p>
              </div>
              <StatusBadge status={workflow.status} conclusion={workflow.conclusion} />
            </div>
          ))
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <button
          onClick={() => handleDispatch('main.yml')}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Trigger Workflow
        </button>
      </div>
      
      {/* NOTE: Phase 1 MVP assumes all repos have 'main.yml' workflow file.
          Phase 2 will add workflow discovery/selection UI. This is acceptable
          for MVP testing with controlled repos. Document in SUMMARY. */}
    </div>
  );
}

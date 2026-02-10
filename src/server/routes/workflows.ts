import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getWorkflowRuns } from '../db/index.js';
import { GitHubClient } from '../github/client.js';
import { getStoredToken } from '../auth/github.js';

/**
 * Workflow routes plugin
 */
export async function workflowRoutes(server: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * GET /api/repos/:repoId/workflows
   * Get workflow runs for a repository
   */
  server.get<{ Params: { repoId: string } }>('/api/repos/:repoId/workflows', async (request, reply) => {
    // Decode repoId (may contain / encoded as %2F)
    const repoId = decodeURIComponent(request.params.repoId);

    try {
      const runs = getWorkflowRuns(repoId, 100);
      return runs;
    } catch (error) {
      server.log.error({ error }, 'Failed to get workflow runs');
      reply.code(500);
      return { error: 'Failed to retrieve workflow runs' };
    }
  });

  /**
   * POST /api/repos/:repoId/workflows/:workflowId/dispatch
   * Trigger a workflow dispatch
   */
  server.post<{ Params: { repoId: string; workflowId: string } }>(
    '/api/repos/:repoId/workflows/:workflowId/dispatch',
    async (request, reply) => {
      const repoId = decodeURIComponent(request.params.repoId);
      const { workflowId } = request.params;

      // Check authentication
      const token = getStoredToken();
      if (!token) {
        reply.code(401);
        return { error: 'Not authenticated' };
      }

      // Parse owner/name from repoId
      const [owner, name] = repoId.split('/');
      if (!owner || !name) {
        reply.code(400);
        return { error: 'Invalid repository ID format (expected: owner/name)' };
      }

      try {
        const client = new GitHubClient(token);
        await client.dispatchWorkflow(owner, name, workflowId);

        server.log.info({ owner, name, workflowId }, 'Workflow dispatched');
        reply.code(202);
        return { success: true, message: 'Workflow dispatch triggered' };
      } catch (error) {
        server.log.error({ error, owner, name, workflowId }, 'Failed to dispatch workflow');
        reply.code(500);
        return { error: 'Failed to trigger workflow dispatch', details: error instanceof Error ? error.message : String(error) };
      }
    }
  );
}

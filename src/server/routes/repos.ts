import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { addRepo, getRepos, removeRepo } from '../db/index.js';

/**
 * Repo management routes plugin
 */
export async function repoRoutes(server: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * GET /api/repos
   * Get all tracked repositories
   */
  server.get('/api/repos', async (request, reply) => {
    try {
      const repos = getRepos();
      return repos;
    } catch (error) {
      server.log.error({ error }, 'Failed to get repos');
      reply.code(500);
      return { error: 'Failed to retrieve repositories' };
    }
  });

  /**
   * POST /api/repos
   * Add a repository to tracking list
   */
  server.post<{ Body: { owner: string; name: string } }>('/api/repos', async (request, reply) => {
    const { owner, name } = request.body;

    if (!owner || !name) {
      reply.code(400);
      return { error: 'Missing required fields: owner, name' };
    }

    try {
      // Check if already exists
      const existingRepos = getRepos();
      const repoId = `${owner}/${name}`;
      
      if (existingRepos.find(r => r.id === repoId)) {
        reply.code(409);
        return { error: 'Repository already tracked' };
      }

      const repo = addRepo(owner, name);
      reply.code(201);
      return repo;
    } catch (error) {
      server.log.error({ error }, 'Failed to add repo');
      reply.code(500);
      return { error: 'Failed to add repository' };
    }
  });

  /**
   * DELETE /api/repos/:id
   * Remove a repository from tracking
   */
  server.delete<{ Params: { id: string } }>('/api/repos/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      // Check if exists
      const repos = getRepos();
      if (!repos.find(r => r.id === id)) {
        reply.code(404);
        return { error: 'Repository not found' };
      }

      removeRepo(id);
      reply.code(204);
      return;
    } catch (error) {
      server.log.error({ error }, 'Failed to remove repo');
      reply.code(500);
      return { error: 'Failed to remove repository' };
    }
  });
}

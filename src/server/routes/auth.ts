import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getAuthUrl, handleCallback, isAuthenticated, getTokenExpiry, clearStoredToken, getStoredToken } from '../auth/github.js';
import { GitHubClient } from '../github/client.js';
import { startPoller } from '../github/poller.js';

/**
 * Auth routes plugin
 */
export async function authRoutes(server: FastifyInstance, options: FastifyPluginOptions) {
  /**
   * GET /api/auth/login
   * Returns GitHub OAuth authorization URL
   */
  server.get('/api/auth/login', async (request, reply) => {
    try {
      const url = getAuthUrl();
      return { url };
    } catch (error) {
      server.log.error({ error }, 'Failed to generate auth URL');
      reply.code(500);
      return { error: 'Failed to generate authorization URL' };
    }
  });

  /**
   * GET /api/auth/callback
   * OAuth callback endpoint - exchanges code for token
   */
  server.get('/api/auth/callback', async (request, reply) => {
    const { code } = request.query as { code?: string };

    if (!code) {
      reply.code(400);
      return { error: 'Missing authorization code' };
    }

    try {
      const { accessToken, expiresAt } = await handleCallback(code);
      server.log.info('User authenticated successfully');

      // Start polling service with the new token
      const token = getStoredToken();
      if (token) {
        const client = new GitHubClient(token);
        await startPoller(client);
        server.log.info('Polling service started after authentication');
      }

      // Redirect to dashboard
      reply.redirect('http://localhost:5173/dashboard');
    } catch (error) {
      server.log.error({ error }, 'OAuth callback failed');
      reply.code(401);
      return { error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) };
    }
  });

  /**
   * GET /api/auth/status
   * Check authentication status
   */
  server.get('/api/auth/status', async (request, reply) => {
    const authenticated = isAuthenticated();
    const expiresAt = getTokenExpiry();

    return {
      authenticated,
      expiresAt: authenticated ? expiresAt : undefined,
    };
  });

  /**
   * POST /api/auth/logout
   * Clear authentication token
   */
  server.post('/api/auth/logout', async (request, reply) => {
    clearStoredToken();
    server.log.info('User logged out');
    return { success: true };
  });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDb } from './db/index.js';
import { authRoutes } from './routes/auth.js';
import { repoRoutes } from './routes/repos.js';
import { workflowRoutes } from './routes/workflows.js';
import { startPoller, stopPoller } from './github/poller.js';
import { GitHubClient } from './github/client.js';
import { getStoredToken } from './auth/github.js';

const server = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  }
});

// Register CORS for local development
server.register(cors, {
  origin: true
});

// Register routes
server.register(authRoutes);
server.log.info('Auth routes registered');

server.register(repoRoutes);
server.log.info('Repo routes registered');

server.register(workflowRoutes);
server.log.info('Workflow routes registered');

// Health check endpoint
server.get('/api/health', async (request, reply) => {
  return { status: 'ok' };
});

// Graceful shutdown handling
const signals = ['SIGTERM', 'SIGINT'];
for (const signal of signals) {
  process.on(signal, async () => {
    server.log.info(`${signal} received, closing server gracefully`);
    stopPoller(); // Stop polling before shutdown
    await server.close();
    process.exit(0);
  });
}

// Start server
const start = async () => {
  try {
    // Initialize database
    initDb();
    server.log.info('Database initialized');
    
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);

    // Start polling service if authenticated
    const token = getStoredToken();
    if (token) {
      const client = new GitHubClient(token);
      await startPoller(client);
      server.log.info('Polling service started');
    } else {
      server.log.info('Polling service not started (not authenticated yet)');
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

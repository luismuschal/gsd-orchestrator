import Fastify from 'fastify';
import cors from '@fastify/cors';
import { initDb } from './db/index.js';
import { authRoutes } from './routes/auth.js';
import { stopPoller } from './github/poller.js';

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

// Register auth routes
server.register(authRoutes);
server.log.info('Auth routes registered');

// Poller will be started in Task 2b after routes registered

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
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

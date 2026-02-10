import Fastify from 'fastify';
import cors from '@fastify/cors';

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

// Health check endpoint
server.get('/api/health', async (request, reply) => {
  return { status: 'ok' };
});

// Graceful shutdown handling
const signals = ['SIGTERM', 'SIGINT'];
for (const signal of signals) {
  process.on(signal, async () => {
    server.log.info(`${signal} received, closing server gracefully`);
    await server.close();
    process.exit(0);
  });
}

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

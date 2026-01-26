import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      // Configurações TLS para Upstash
      tls: REDIS_URL.startsWith('rediss://') ? {
        rejectUnauthorized: false // Necessário para Upstash
      } : undefined,
      // Timeout e retry
      connectTimeout: 10000,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
    });

    redisClient.on('ready', () => {
      // Redis ready
    });

    redisClient.on('error', (error: Error) => {
      // Error connecting to Redis
    });

    redisClient.on('close', () => {
      // Connection closed
    });
  }

  return redisClient;
}

export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

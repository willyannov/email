import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
    });

    redisClient.on('error', (error) => {
      console.error('❌ Erro na conexão com Redis:', error);
    });
  }

  return redisClient;
}

export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('🔌 Conexão com Redis fechada');
  }
}

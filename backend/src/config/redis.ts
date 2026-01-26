import { Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    console.log('🔄 Conectando ao Redis...');
    console.log('📍 URL:', REDIS_URL.replace(/:[^:@]+@/, ':****@')); // Ocultar senha nos logs
    
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
        console.log(`🔄 Tentando reconectar ao Redis (tentativa ${times})...`);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis pronto para uso');
    });

    redisClient.on('error', (error: Error) => {
      console.error('❌ Erro na conexão com Redis:', error.message);
      // Mostrar mais detalhes do erro
      if (error.message.includes('ENOTFOUND')) {
        console.error('💡 Verifique se REDIS_URL está correta no Render');
        console.error('💡 Formato: rediss://default:SENHA@host.upstash.io:6379');
      }
    });

    redisClient.on('close', () => {
      console.log('🔌 Conexão com Redis fechada');
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

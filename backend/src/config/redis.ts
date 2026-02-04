import { Redis } from 'ioredis';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Suporta múltiplas URLs separadas por vírgula para rotação automática
const REDIS_URLS = (process.env.REDIS_URL || process.env.REDIS_URLS || 'redis://localhost:6379')
  .split(',')
  .map(url => url.trim())
  .filter(url => url.length > 0);

let redisClient: Redis | null = null;
let connectionAttempts = 0;
const MAX_ATTEMPTS_PER_URL = 3;

// Arquivo para persistir o índice atual (sobrevive a restarts)
const STATE_FILE = process.env.REDIS_STATE_FILE || join(process.cwd(), '.redis-state.json');

// Carregar índice persistido ou começar do 0
let currentUrlIndex = loadCurrentIndex();

function loadCurrentIndex(): number {
  try {
    if (existsSync(STATE_FILE)) {
      const data = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
      const index = data.currentIndex || 0;
      console.log(`📂 Índice carregado do estado persistido: ${index + 1}/${REDIS_URLS.length}`);
      return index;
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar estado persistido, usando índice 0');
  }
  return 0;
}

function saveCurrentIndex(): void {
  try {
    const state = {
      currentIndex: currentUrlIndex,
      lastUpdate: new Date().toISOString(),
      totalUrls: REDIS_URLS.length,
    };
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.warn('⚠️ Erro ao salvar estado persistido:', error);
  }
}

function getNextRedisUrl(): string {
  const url = REDIS_URLS[currentUrlIndex];
  console.log(`🔄 Usando Redis URL ${currentUrlIndex + 1}/${REDIS_URLS.length}`);
  return url;
}

function rotateToNextUrl(): void {
  currentUrlIndex = (currentUrlIndex + 1) % REDIS_URLS.length;
  connectionAttempts = 0;
  saveCurrentIndex(); // Persistir novo índice
  console.log(`🔄 Rotacionando para próxima URL do Redis (${currentUrlIndex + 1}/${REDIS_URLS.length})`);
}

export function getRedisClient(): Redis {
  if (!redisClient) {
    const REDIS_URL = getNextRedisUrl();
    
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
        connectionAttempts++;
        
        // Se falhou muito, tentar próxima URL
        if (connectionAttempts >= MAX_ATTEMPTS_PER_URL && REDIS_URLS.length > 1) {
          console.warn(`⚠️ Limite de tentativas atingido na URL atual, rotacionando...`);
          
          // Fechar conexão atual
          if (redisClient) {
            redisClient.disconnect(false);
            redisClient = null;
          }
          
          // Rotar para próxima URL
          rotateToNextUrl();
          
          // Reconectar com nova URL
          setTimeout(() => {
            getRedisClient();
          }, 1000);
          
          return null; // Não tentar mais nesta URL
        }
        
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      console.log(`✅ Conectado ao Redis com sucesso (URL ${currentUrlIndex + 1}/${REDIS_URLS.length})`);
      connectionAttempts = 0; // Reset contador em conexão bem-sucedida
    });

    redisClient.on('ready', () => {
      // Redis ready
    });

    redisClient.on('error', (error: Error) => {
      // Error connecting to Redis
      if (error.message.includes('READONLY') || 
          error.message.includes('limit exceeded') ||
          error.message.includes('quota')) {
        console.error(`❌ Erro de limite/quota no Redis: ${error.message}`);
        
        // Rotar automaticamente se for erro de limite
        if (REDIS_URLS.length > 1) {
          console.log('🔄 Detectado erro de limite, rotacionando para próxima URL...');
          
          if (redisClient) {
            redisClient.disconnect(false);
            redisClient = null;
          }
          
          rotateToNextUrl();
          
          // Reconectar com nova URL
          setTimeout(() => {
            getRedisClient();
          }, 1000);
        }
      }
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

/**
 * Força rotação manual para próxima URL do Redis
 */
export async function rotateRedisUrl(): Promise<void> {
  console.log('🔄 Rotação manual do Redis solicitada...');
  
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  
  rotateToNextUrl();
  getRedisClient();
}

/**
 * Retorna informações sobre as URLs configuradas
 */
export function getRedisInfo() {
  const maskedUrls = REDIS_URLS.map((url, i) => {
    const isCurrent = i === currentUrlIndex;
    // Mascarar senha na URL
    const masked = url.replace(/:([^@]+)@/, ':****@');
    return {
      index: i + 1,
      url: masked,
      active: isCurrent,
    };
  });

  return {
    totalUrls: REDIS_URLS.length,
    currentIndex: currentUrlIndex + 1,
    connectionAttempts,
    urls: maskedUrls,
  };
}

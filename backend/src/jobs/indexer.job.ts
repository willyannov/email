import { Queue, Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { SearchService } from '../services/search.service.js';
import { Email } from '../models/Email.js';

const QUEUE_NAME = 'indexer';
const searchService = new SearchService();

// Criar fila
export const indexerQueue = new Queue(QUEUE_NAME, {
  connection: getRedisClient(),
});

interface IndexEmailJob {
  email: Email;
}

// Worker para processar jobs
export const indexerWorker = new Worker<IndexEmailJob>(
  QUEUE_NAME,
  async (job) => {
    const { email } = job.data;

    try {
      await searchService.indexEmail(email);

      return { emailId: email._id, timestamp: new Date() };
    } catch (error) {
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 5, // Processar até 5 emails simultaneamente
  }
);

// Event listeners
indexerWorker.on('completed', (job) => {
  // Job completed
});

indexerWorker.on('failed', (job, err) => {
  // Job failed
});

// Função auxiliar para adicionar email à fila de indexação
export async function queueEmailForIndexing(email: Email) {
  await indexerQueue.add('index-email', { email }, {
    removeOnComplete: 10, // Reduzido de 100 para 10 (economizar memória Upstash)
    removeOnFail: 20, // Reduzido de 50 para 20
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

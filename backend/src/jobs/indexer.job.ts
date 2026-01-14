import { Queue, Worker } from 'bullmq';
import { getRedisClient } from '../config/redis';
import { SearchService } from '../services/search.service';
import { Email } from '../models/Email';

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
      console.log(`🔍 Email indexado: ${email._id}`);

      return { emailId: email._id, timestamp: new Date() };
    } catch (error) {
      console.error('❌ Erro ao indexar email:', error);
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
  console.log(`✅ Job de indexação ${job.id} concluído`);
});

indexerWorker.on('failed', (job, err) => {
  console.error(`❌ Job de indexação ${job?.id} falhou:`, err);
});

// Função auxiliar para adicionar email à fila de indexação
export async function queueEmailForIndexing(email: Email) {
  await indexerQueue.add('index-email', { email }, {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
}

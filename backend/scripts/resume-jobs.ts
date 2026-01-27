import { getRedisClient } from './config/redis.js';
import { cleanupQueue } from './jobs/cleanup.job.js';
import { indexerQueue } from './jobs/indexer.job.js';
import { orphanCleanupQueue } from './jobs/orphan-cleanup.job.js';

/**
 * Script para resumir todos os jobs/queues
 * 
 * Uso:
 * npm run resume-jobs
 */

async function resumeJobs() {
  console.log('▶️  Resumindo todos os jobs...\n');

  try {
    // Resumir todas as filas
    await cleanupQueue.resume();
    console.log('✅ Cleanup queue reativada');

    await indexerQueue.resume();
    console.log('✅ Indexer queue reativada');

    await orphanCleanupQueue.resume();
    console.log('✅ Orphan cleanup queue reativada');

    console.log('\n✨ Todos os jobs foram reativados!');
    console.log('📊 Os jobs agora executarão nos horários agendados\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resumir jobs:', error);
    process.exit(1);
  }
}

resumeJobs();

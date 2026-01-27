import { getRedisClient } from '../src/config/redis.js';
import { cleanupQueue } from '../src/jobs/cleanup.job.js';
import { indexerQueue } from '../src/jobs/indexer.job.js';
import { orphanCleanupQueue } from '../src/jobs/orphan-cleanup.job.js';

/**
 * Script para pausar todos os jobs/queues
 * Útil quando você quer economizar recursos do Upstash
 * 
 * Uso:
 * npm run pause-jobs
 */

async function pauseJobs() {
  console.log('⏸️  Pausando todos os jobs...\n');

  try {
    // Pausar todas as filas
    await cleanupQueue.pause();
    console.log('✅ Cleanup queue pausada');

    await indexerQueue.pause();
    console.log('✅ Indexer queue pausada');

    await orphanCleanupQueue.pause();
    console.log('✅ Orphan cleanup queue pausada');

    console.log('\n✨ Todos os jobs foram pausados!');
    console.log('💡 Para reativar, rode: npm run resume-jobs');
    console.log('💡 Ou reinicie o servidor com ENABLE_JOBS=true\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao pausar jobs:', error);
    process.exit(1);
  }
}

pauseJobs();

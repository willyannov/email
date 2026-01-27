import { getRedisClient } from './config/redis.js';

/**
 * Script para limpar dados antigos do Redis/Upstash
 * 
 * Uso:
 * npm run clean-redis
 * ou
 * bun run clean-redis
 */

async function cleanRedis() {
  console.log('🧹 Iniciando limpeza do Redis...\n');

  try {
    const redis = getRedisClient();

    // 1. Limpar jobs completados antigos
    console.log('📋 Limpando jobs completados...');
    const queueKeys = await redis.keys('bull:*:completed');
    let deletedCompleted = 0;
    for (const key of queueKeys) {
      const deleted = await redis.del(key);
      deletedCompleted += deleted;
    }
    console.log(`✅ ${deletedCompleted} keys de jobs completados removidos\n`);

    // 2. Limpar jobs falhos antigos
    console.log('❌ Limpando jobs falhos...');
    const failedKeys = await redis.keys('bull:*:failed');
    let deletedFailed = 0;
    for (const key of failedKeys) {
      const deleted = await redis.del(key);
      deletedFailed += deleted;
    }
    console.log(`✅ ${deletedFailed} keys de jobs falhos removidos\n`);

    // 3. Limpar jobs repeatable antigos
    console.log('🔄 Limpando jobs repetitivos...');
    const repeatKeys = await redis.keys('bull:*:repeat:*');
    let deletedRepeat = 0;
    for (const key of repeatKeys) {
      const deleted = await redis.del(key);
      deletedRepeat += deleted;
    }
    console.log(`✅ ${deletedRepeat} keys de jobs repetitivos removidos\n`);

    // 4. Limpar keys de delay antigos
    console.log('⏰ Limpando delays...');
    const delayKeys = await redis.keys('bull:*:delayed');
    let deletedDelay = 0;
    for (const key of delayKeys) {
      const deleted = await redis.del(key);
      deletedDelay += deleted;
    }
    console.log(`✅ ${deletedDelay} keys de delay removidos\n`);

    // 5. Mostrar estatísticas
    console.log('📊 Obtendo estatísticas do Redis...');
    const dbsize = await redis.dbsize();
    const info = await redis.info('memory');
    
    console.log(`\n📈 Estatísticas finais:`);
    console.log(`   Total de keys: ${dbsize}`);
    console.log(`\n💾 Informações de memória:`);
    const memoryLines = info.split('\n').filter(line => 
      line.includes('used_memory') || line.includes('used_memory_human')
    );
    memoryLines.forEach(line => console.log(`   ${line}`));

    // 6. Resumo
    console.log(`\n\n✨ Limpeza concluída!`);
    console.log(`   Jobs completados: ${deletedCompleted}`);
    console.log(`   Jobs falhos: ${deletedFailed}`);
    console.log(`   Jobs repetitivos: ${deletedRepeat}`);
    console.log(`   Delays: ${deletedDelay}`);
    console.log(`   Total: ${deletedCompleted + deletedFailed + deletedRepeat + deletedDelay} keys removidos\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar Redis:', error);
    process.exit(1);
  }
}

// Executar
cleanRedis();

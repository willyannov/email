import { getRedisClient, rotateRedisUrl, getRedisInfo } from '../src/config/redis.js';

/**
 * Script para rotacionar manualmente a URL do Redis
 * 
 * Uso:
 * npm run rotate-redis
 * ou
 * bun run rotate-redis
 */

async function rotateRedis() {
  console.log('🔄 Iniciando rotação da URL do Redis...\n');

  try {
    // Mostrar estado atual
    const beforeInfo = getRedisInfo();
    console.log('📊 Estado atual:');
    console.log(`   Total de URLs: ${beforeInfo.totalUrls}`);
    console.log(`   URL atual: ${beforeInfo.currentIndex}/${beforeInfo.totalUrls}`);
    console.log(`   Tentativas de conexão: ${beforeInfo.connectionAttempts}\n`);

    // Verificar se há múltiplas URLs
    if (beforeInfo.totalUrls <= 1) {
      console.log('⚠️ Apenas uma URL configurada. Configure múltiplas URLs separadas por vírgula.');
      console.log('   Exemplo: REDIS_URL="url1,url2,url3"\n');
      process.exit(0);
    }

    // Rotacionar
    await rotateRedisUrl();

    // Mostrar novo estado
    const afterInfo = getRedisInfo();
    console.log('\n✅ Rotação concluída!');
    console.log(`   Nova URL: ${afterInfo.currentIndex}/${afterInfo.totalUrls}\n`);

    // Testar conexão
    console.log('🔍 Testando nova conexão...');
    const redis = getRedisClient();
    await redis.ping();
    console.log('✅ Conexão testada com sucesso!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao rotacionar Redis:', error);
    process.exit(1);
  }
}

rotateRedis();

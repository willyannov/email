/**
 * Script de migração: Renomear accessToken para token
 * 
 * Este script:
 * 1. Remove índice antigo accessToken_1
 * 2. Renomeia campo accessToken para token em documentos existentes
 * 3. Cria novo índice token_1
 * 4. Remove documentos antigos sem token
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI não definida!');
  console.log('💡 Execute: export MONGODB_URI="mongodb+srv://..."');
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Conectando ao MongoDB...\n');
    await client.connect();
    
    const db = client.db('tempmail');
    const collection = db.collection('mailboxes');
    
    // 1. Listar índices existentes
    console.log('📋 Índices atuais:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}:`, JSON.stringify(idx.key));
    });
    console.log('');
    
    // 2. Remover índice accessToken_1 se existir
    try {
      console.log('🗑️  Removendo índice accessToken_1...');
      await collection.dropIndex('accessToken_1');
      console.log('✅ Índice accessToken_1 removido\n');
    } catch (error: any) {
      if (error.code === 27) {
        console.log('ℹ️  Índice accessToken_1 já não existe\n');
      } else {
        console.log('⚠️  Erro ao remover índice:', error.message, '\n');
      }
    }
    
    // 3. Contar documentos
    const totalDocs = await collection.countDocuments();
    console.log(`📊 Total de documentos: ${totalDocs}\n`);
    
    // 4. Renomear campo accessToken → token (se existir)
    console.log('🔄 Renomeando campo accessToken → token...');
    const renameResult = await collection.updateMany(
      { accessToken: { $exists: true } },
      { $rename: { accessToken: 'token' } }
    );
    console.log(`✅ ${renameResult.modifiedCount} documentos atualizados\n`);
    
    // 5. Remover documentos sem token (dados corrompidos)
    console.log('🧹 Removendo documentos sem token...');
    const deleteResult = await collection.deleteMany({
      $or: [
        { token: { $exists: false } },
        { token: null }
      ]
    });
    console.log(`✅ ${deleteResult.deletedCount} documentos removidos\n`);
    
    // 6. Criar novo índice token_1
    try {
      console.log('📌 Criando índice token_1...');
      await collection.createIndex({ token: 1 }, { unique: true });
      console.log('✅ Índice token_1 criado\n');
    } catch (error: any) {
      if (error.code === 85 || error.code === 68) {
        console.log('ℹ️  Índice token_1 já existe\n');
      } else {
        throw error;
      }
    }
    
    // 7. Verificar índices finais
    console.log('📋 Índices após migração:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach(idx => {
      console.log(`   - ${idx.name}:`, JSON.stringify(idx.key));
    });
    console.log('');
    
    // 8. Mostrar estatísticas finais
    const finalCount = await collection.countDocuments();
    console.log('📊 Estatísticas finais:');
    console.log(`   Total de mailboxes: ${finalCount}`);
    console.log(`   Documentos removidos: ${totalDocs - finalCount}`);
    console.log('');
    
    console.log('═══════════════════════════════════════');
    console.log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Desconectado do MongoDB\n');
  }
}

// Executar migração
migrate().catch(console.error);

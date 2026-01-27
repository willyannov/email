import { Queue, Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { getDatabase } from '../config/database.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Email } from '../models/Email.js';

const QUEUE_NAME = 'orphan-cleanup';
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

// Criar fila
export const orphanCleanupQueue = new Queue(QUEUE_NAME, {
  connection: getRedisClient(),
});

// Worker para processar jobs
export const orphanCleanupWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const db = getDatabase();
    let checkedFiles = 0;
    let deletedOrphans = 0;
    let totalSize = 0;

    try {
      // Verificar se o diretório de uploads existe
      try {
        await fs.access(UPLOAD_DIR);
      } catch {
        console.log('ℹ️ Diretório uploads/ não existe - nada a limpar');
        console.log('📦 Nota: Em ambientes efêmeros (Render), uploads/ é recriado a cada deploy');
        return { checkedFiles: 0, deletedOrphans: 0, totalSize: 0 };
      }

      // Listar todos os arquivos em uploads/
      const files = await fs.readdir(UPLOAD_DIR);
      checkedFiles = files.length;

      if (files.length === 0) {
        console.log('✅ Nenhum arquivo para verificar');
        return { checkedFiles: 0, deletedOrphans: 0, totalSize: 0 };
      }

      console.log(`🔍 Verificando ${files.length} arquivos em uploads/...`);

      // Buscar todos os caminhos de anexos no banco
      const emails = await db.collection<Email>('emails')
        .find({ 'attachments.0': { $exists: true } }) // Emails com anexos
        .project({ attachments: 1 })
        .toArray();

      // Criar set de caminhos válidos
      const validPaths = new Set<string>();
      emails.forEach(email => {
        email.attachments.forEach((att: { path: string }) => {
          validPaths.add(att.path);
        });
      });

      // Verificar cada arquivo
      for (const file of files) {
        const filePath = join(UPLOAD_DIR, file);
        
        // Verificar se o caminho completo existe no banco
        if (!validPaths.has(filePath)) {
          try {
            // Arquivo órfão - deletar
            const stats = await fs.stat(filePath);
            await fs.unlink(filePath);
            deletedOrphans++;
            totalSize += stats.size;
            console.log(`🗑️ Anexo órfão removido: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
          } catch (error) {
            console.error(`❌ Erro ao deletar ${file}:`, error);
          }
        }
      }

      const totalSizeKB = (totalSize / 1024).toFixed(2);
      const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

      console.log(`✅ Limpeza de órfãos completa: ${deletedOrphans}/${checkedFiles} arquivos removidos (${totalSizeMB} MB liberados)`);

      return {
        checkedFiles,
        deletedOrphans,
        totalSizeKB: parseFloat(totalSizeKB),
        totalSizeMB: parseFloat(totalSizeMB),
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Erro na limpeza de anexos órfãos:', error);
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 1,
    // Reduzir polling no Redis
    settings: {
      stalledInterval: 60000, // 1 minuto
      maxStalledCount: 1,
    },
  }
);

// Event listeners
orphanCleanupWorker.on('completed', (job, result) => {
  if (result.deletedOrphans > 0) {
    console.log(`🎉 Job de limpeza de órfãos completo: ${result.deletedOrphans} arquivos removidos`);
  }
});

orphanCleanupWorker.on('failed', (job, err) => {
  console.error('❌ Job de limpeza de órfãos falhou:', err);
});

// Agendar job recorrente (a cada 1 hora - verificação de segurança)
export async function scheduleOrphanCleanupJob() {
  await orphanCleanupQueue.add(
    'cleanup-orphan-attachments',
    {},
    {
      repeat: {
        pattern: '0 */8 * * *', // A cada 8 horas (3x por dia)
      },
      removeOnComplete: 1, // Manter apenas último job
      removeOnFail: 2, // Manter últimos 2 falhos
    }
  );
  
  console.log('✅ Job de limpeza de anexos órfãos agendado (executa a cada 8 horas)');
}

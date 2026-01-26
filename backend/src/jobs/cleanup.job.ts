import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { MailboxService } from '../services/mailbox.service.js';
import { getDatabase } from '../config/database.js';
import { deleteAttachments } from '../utils/attachmentStorage.js';
import { Email } from '../models/Email.js';
import { SearchService } from '../services/search.service.js';

const QUEUE_NAME = 'cleanup';
const mailboxService = new MailboxService();
const searchService = new SearchService();

// Criar fila
export const cleanupQueue = new Queue(QUEUE_NAME, {
  connection: getRedisClient(),
});

// Worker para processar jobs
export const cleanupWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const db = getDatabase();
    let cleanedMailboxes = 0;
    let cleanedEmails = 0;
    let cleanedAttachments = 0;
    let cleanedSearchIndexes = 0;

    try {
      // Buscar mailboxes expiradas
      const expiredMailboxes = await mailboxService.getExpiredMailboxes();

      for (const mailbox of expiredMailboxes) {
        // Buscar emails da mailbox para deletar anexos
        const emails = await db.collection<Email>('emails')
          .find({ mailboxId: mailbox._id })
          .toArray();

        // Deletar anexos do sistema de arquivos
        for (const email of emails) {
          if (email.attachments.length > 0) {
            const attachmentPaths = email.attachments.map((a: any) => a.path);
            await deleteAttachments(attachmentPaths);
            cleanedAttachments += email.attachments.length;
          }
        }

        // Deletar emails do índice Meilisearch
        try {
          if (mailbox._id) {
            await searchService.deleteMailboxEmails(mailbox._id.toString());
            cleanedSearchIndexes++;
            console.log(`🔍 Índice Meilisearch limpo para mailbox ${mailbox.address}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erro ao limpar índice Meilisearch:`, error);
        }

        // Deletar emails do MongoDB
        const deleteResult = await db.collection('emails')
          .deleteMany({ mailboxId: mailbox._id });
        cleanedEmails += deleteResult.deletedCount;

        // Deletar mailbox permanentemente
        await db.collection('mailboxes').deleteOne(
          { _id: mailbox._id }
        );

        cleanedMailboxes++;
        console.log(`🧹 Mailbox limpa: ${mailbox.address} (${deleteResult.deletedCount} emails)`);
      }

      console.log(`✅ Cleanup completo: ${cleanedMailboxes} mailboxes, ${cleanedEmails} emails, ${cleanedAttachments} anexos, ${cleanedSearchIndexes} índices`);

      return {
        cleanedMailboxes,
        cleanedEmails,
        cleanedAttachments,
        cleanedSearchIndexes,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Erro no cleanup:', error);
      throw error;
    }
  },
  {
    connection: getRedisClient(),
    concurrency: 1,
  }
);

// Event listeners
cleanupWorker.on('completed', (job) => {
  // Job completed
});

cleanupWorker.on('failed', (job, err) => {
  // Job failed
});

// Agendar job recorrente (a cada 5 minutos para garantir limpeza em até 1 hora)
export async function scheduleCleanupJob() {
  await cleanupQueue.add(
    'cleanup-expired',
    {},
    {
      repeat: {
        pattern: '*/5 * * * *', // A cada 5 minutos (12x por hora)
      },
      removeOnComplete: 5, // Manter últimos 5 jobs completos (economizar Redis)
      removeOnFail: 10, // Manter últimos 10 jobs falhos
    }
  );
}

import { Queue, Worker, QueueEvents } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { MailboxService } from '../services/mailbox.service.js';
import { getDatabase } from '../config/database.js';
import { deleteAttachments } from '../utils/attachmentStorage.js';
import { Email } from '../models/Email.js';

const QUEUE_NAME = 'cleanup';
const mailboxService = new MailboxService();

// Criar fila
export const cleanupQueue = new Queue(QUEUE_NAME, {
  connection: getRedisClient(),
});

// Worker para processar jobs
export const cleanupWorker = new Worker(
  QUEUE_NAME,
  async (job) => {
    console.log('🧹 Iniciando limpeza de dados expirados...');

    const db = getDatabase();
    let cleanedMailboxes = 0;
    let cleanedEmails = 0;

    try {
      // Buscar mailboxes expiradas
      const expiredMailboxes = await mailboxService.getExpiredMailboxes();

      for (const mailbox of expiredMailboxes) {
        // Buscar emails da mailbox para deletar anexos
        const emails = await db.collection<Email>('emails')
          .find({ mailboxId: mailbox._id })
          .toArray();

        // Deletar anexos
        for (const email of emails) {
          if (email.attachments.length > 0) {
            const attachmentPaths = email.attachments.map((a: any) => a.path);
            await deleteAttachments(attachmentPaths);
          }
        }

        // Deletar emails
        const deleteResult = await db.collection('emails')
          .deleteMany({ mailboxId: mailbox._id });
        cleanedEmails += deleteResult.deletedCount;

        // Deletar mailbox permanentemente
        await db.collection('mailboxes').deleteOne(
          { _id: mailbox._id }
        );

        cleanedMailboxes++;
      }

      console.log(`✅ Limpeza concluída: ${cleanedMailboxes} mailboxes, ${cleanedEmails} emails`);

      return {
        cleanedMailboxes,
        cleanedEmails,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Erro durante limpeza:', error);
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
  console.log(`✅ Job de limpeza ${job.id} concluído`);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`❌ Job de limpeza ${job?.id} falhou:`, err);
});

// Agendar job recorrente (a cada 10 minutos)
export async function scheduleCleanupJob() {
  await cleanupQueue.add(
    'cleanup-expired',
    {},
    {
      repeat: {
        pattern: '*/10 * * * *', // A cada 10 minutos
      },
      removeOnComplete: 10, // Manter últimos 10 jobs completos
      removeOnFail: 20, // Manter últimos 20 jobs falhos
    }
  );

  console.log('🔄 Job de limpeza agendado (a cada 10 minutos)');
}

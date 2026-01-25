import { connectToDatabase, closeDatabaseConnection } from './config/database.js';
import { getRedisClient, closeRedisConnection } from './config/redis.js';
import { setupMeilisearchIndexes } from './config/meilisearch.js';
import { CustomSMTPServer } from './services/smtp.service.js';
import { WebSocketService } from './services/websocket.service.js';
import { createRouter } from './router.js';
import { scheduleCleanupJob, cleanupWorker } from './jobs/cleanup.job.js';
import { indexerWorker } from './jobs/indexer.job.js';

const PORT = parseInt(process.env.PORT || '3000');
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '2525');

let smtpServer: CustomSMTPServer;
const wsService = new WebSocketService();

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Inicializar Redis
    getRedisClient();
    
    // Configurar Meilisearch
    await setupMeilisearchIndexes();
    
    // Inicializar Bull workers
    console.log('⚙️  Inicializando workers...');
    await scheduleCleanupJob();
    
    // Inicializar servidor HTTP com WebSocket
    const router = createRouter(wsService);
    
    type WebSocketData = { token: string };
    
    const httpServer = Bun.serve<WebSocketData>({
      port: PORT,
      fetch: async (req: Request, server) => {
        const url = new URL(req.url);
        
        // WebSocket upgrade
        if (url.pathname.startsWith('/ws/mailbox/')) {
          const token = url.pathname.split('/').pop();
          
          const success = server.upgrade(req, {
            data: { token: token || '' },
          });
          
          if (success) {
            return undefined as any;
          }
          
          return new Response('WebSocket upgrade failed', { status: 400 });
        }
        
        // Rotas HTTP normais
        return router(req);
      },
      websocket: {
        open(ws) {
          const token = ws.data.token;
          if (token) {
            wsService.handleConnection(ws as any, token);
          } else {
            ws.close();
          }
        },
        message(ws, message) {
          wsService.handleMessage(ws as any, message as string);
        },
        close(ws) {
          wsService.handleDisconnection(ws as any);
        },
      },
    });
    
    // Inicializar servidor SMTP
    smtpServer = new CustomSMTPServer(wsService);
    smtpServer.listen(SMTP_PORT);
    
    console.log(`✅ Servidor HTTP rodando na porta ${PORT}`);
    console.log(`📧 Servidor SMTP rodando na porta ${SMTP_PORT}`);
    console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}/ws/mailbox/:token`);
    console.log(`🌐 Acesse: http://localhost:${PORT}/health`);
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  if (smtpServer) await smtpServer.close();
  await cleanupWorker.close();
  await indexerWorker.close();
  await closeDatabaseConnection();
  await closeRedisConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  if (smtpServer) await smtpServer.close();
  await cleanupWorker.close();
  await indexerWorker.close();
  await closeDatabaseConnection();
  await closeRedisConnection();
  process.exit(0);
});

// Iniciar servidor
startServer();

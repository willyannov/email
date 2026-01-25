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
let db: any = null; // Flag para status do MongoDB
const wsService = new WebSocketService();

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor...');
    
    // Inicializar servidor HTTP PRIMEIRO (para Render detectar porta)
    const router = createRouter(wsService);
    
    type WebSocketData = { token: string };
    
    const httpServer = Bun.serve<WebSocketData>({
      port: PORT,
      fetch: async (req: Request, server) => {
        const url = new URL(req.url);
        
        // Health check sempre responde (mesmo sem MongoDB)
        if (url.pathname === '/health') {
          return new Response(JSON.stringify({ 
            status: 'ok', 
            uptime: process.uptime(),
            mongodb: db ? 'connected' : 'connecting',
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
        
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
    
    console.log(`✅ Servidor HTTP rodando na porta ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    
    // Conectar ao banco de dados em background
    connectToDatabase()
      .then((database) => {
        db = database;
        console.log('✅ MongoDB conectado - inicializando serviços...');
        
        // Inicializar Redis
        getRedisClient();
        
        // Configurar Meilisearch
        setupMeilisearchIndexes().catch(err => 
          console.error('⚠️ Erro ao configurar Meilisearch:', err)
        );
        
        // Inicializar Bull workers
        scheduleCleanupJob().catch(err => 
          console.error('⚠️ Erro ao inicializar workers:', err)
        );
        
        // Inicializar servidor SMTP
        smtpServer = new CustomSMTPServer(wsService);
        smtpServer.listen(SMTP_PORT);
        console.log(`📧 Servidor SMTP rodando na porta ${SMTP_PORT}`);
      })
      .catch(err => {
        console.error('❌ Erro ao conectar serviços:', err);
        console.log('⚠️ Servidor HTTP continua rodando sem MongoDB');
      });
    
    console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}/ws/mailbox/:token`);
    
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

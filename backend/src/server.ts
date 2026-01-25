import http from 'http';
import { WebSocketServer } from 'ws';
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
    
    // Criar servidor HTTP
    const router = createRouter(wsService);
    
    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      
      // Health check sempre responde (mesmo sem MongoDB)
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'ok', 
          uptime: process.uptime(),
          mongodb: db ? 'connected' : 'connecting',
        }));
        return;
      }
      
      // Converter requisição Node.js para Request do Fetch API
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
      });
      
      const fetchRequest = new Request(`http://${req.headers.host}${req.url}`, {
        method: req.method,
        headers,
        body: req.method !== 'GET' && req.method !== 'HEAD' ? 
          await new Promise<Buffer>((resolve) => {
            const chunks: Buffer[] = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', () => resolve(Buffer.concat(chunks)));
          }) : undefined,
      });
      
      try {
        const response = await router(fetchRequest);
        
        // Converter Response para resposta Node.js
        res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
        
        if (response.body) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
        }
        
        res.end();
      } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });
    
    // Configurar WebSocket
    const wss = new WebSocketServer({ noServer: true });
    
    httpServer.on('upgrade', (request, socket, head) => {
      const url = new URL(request.url || '/', `http://${request.headers.host}`);
      
      if (url.pathname.startsWith('/ws/mailbox/')) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          const token = url.pathname.split('/').pop() || '';
          
          // Adicionar token ao WebSocket
          (ws as any).token = token;
          
          ws.on('open', () => {
            wsService.handleConnection(ws as any, token);
          });
          
          ws.on('message', (message) => {
            wsService.handleMessage(ws as any, message.toString());
          });
          
          ws.on('close', () => {
            wsService.handleDisconnection(ws as any);
          });
          
          // Conectar imediatamente após upgrade
          if (token) {
            wsService.handleConnection(ws as any, token);
          } else {
            ws.close();
          }
        });
      } else {
        socket.destroy();
      }
    });
    
    // Iniciar servidor HTTP
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor HTTP rodando na porta ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket disponível em ws://localhost:${PORT}/ws/mailbox/:token`);
    });
    
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

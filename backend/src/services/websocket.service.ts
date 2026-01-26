import { WebSocket } from 'ws';
import { MailboxService } from './mailbox.service.js';
import { Email } from '../models/Email.js';

interface ExtendedWebSocket extends WebSocket {
  token?: string;
  mailboxId?: string;
}

export class WebSocketService {
  private connections = new Map<string, ExtendedWebSocket>();
  private mailboxService: MailboxService;

  constructor() {
    this.mailboxService = new MailboxService();
  }

  /**
   * Registra uma nova conexão WebSocket
   */
  async handleConnection(ws: ExtendedWebSocket, token: string) {
    try {
      console.log(`🔌 Tentando conectar WebSocket com token: ${token}`);
      console.log(`📏 Tamanho do token recebido: ${token.length}`);
      
      // Validar token
      const mailbox = await this.mailboxService.getMailboxByToken(token);
      
      if (!mailbox) {
        console.log(`❌ Mailbox não encontrada para token: ${token}`);
        console.log(`🔍 Tentando buscar no banco...`);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Mailbox não encontrada' 
        }));
        ws.close();
        return;
      }

      console.log(`✅ Mailbox encontrada: ${mailbox.address}`);
      console.log(`🔑 Token da mailbox: ${mailbox.token}`);

      // Verificar se não expirou
      const isValid = await this.mailboxService.isMailboxValid(token);
      if (!isValid) {
        console.log(`❌ Mailbox expirada: ${token}`);
        ws.send(JSON.stringify({ 
          type: 'error', 
          message: 'Mailbox expirada' 
        }));
        ws.close();
        return;
      }

      // Armazenar conexão
      ws.token = token;
      ws.mailboxId = mailbox._id!.toString();
      this.connections.set(token, ws);

      // Enviar confirmação
      ws.send(JSON.stringify({ 
        type: 'connected',
        message: 'Conectado com sucesso',
        address: mailbox.address,
      }));

      console.log(`🔌 Cliente conectado via WebSocket: ${mailbox.address}`);
    } catch (error) {
      console.error('❌ Erro ao processar conexão WebSocket:', error);
      ws.close();
    }
  }

  /**
   * Remove uma conexão
   */
  handleDisconnection(ws: ExtendedWebSocket) {
    const token = ws.token;
    if (token) {
      this.connections.delete(token);
      console.log(`🔌 Cliente desconectado via WebSocket: ${token}`);
    }
  }

  /**
   * Processa mensagem recebida
   */
  handleMessage(ws: ExtendedWebSocket, message: string) {
    try {
      const data = JSON.parse(message);
      
      // Heartbeat/ping
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      // Outras mensagens podem ser adicionadas aqui
      console.log('Mensagem WebSocket recebida:', data);
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  }

  /**
   * Notifica um cliente sobre um novo email
   */
  notifyNewEmail(mailboxToken: string, email: Email) {
    const ws = this.connections.get(mailboxToken);
    
    if (ws && ws.readyState === 1) { // 1 = OPEN
      ws.send(JSON.stringify({
        type: 'new_email',
        data: {
          _id: email._id!.toString(),
          from: email.from,
          subject: email.subject,
          receivedAt: email.receivedAt,
          hasAttachments: email.attachments.length > 0,
        },
      }));

      console.log(`📬 Notificação enviada via WebSocket para ${mailboxToken}`);
    }
  }

  /**
   * Broadcast para todas as conexões de uma mailbox
   */
  broadcastToMailbox(mailboxId: string, message: any) {
    for (const [token, ws] of this.connections) {
      if (ws.data.mailboxId === mailboxId && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Retorna número de conexões ativas
   */
  getConnectionCount(): number {
    return this.connections.size;
  }
}

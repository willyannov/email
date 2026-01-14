import { SMTPServer, SMTPServerSession, SMTPServerAddress } from 'smtp-server';
import { Readable } from 'stream';
import { ObjectId } from 'mongodb';
import { SMTP_CONFIG, EMAIL_DOMAINS } from '../config/smtp';
import { MailboxService } from './mailbox.service';
import { EmailService } from './email.service';
import { WebSocketService } from './websocket.service';
import { parseEmail } from '../utils/emailParser';
import { saveAttachment } from '../utils/attachmentStorage';
import { queueEmailForIndexing } from '../jobs/indexer.job';
import { Email } from '../models/Email';

export class CustomSMTPServer {
  private server: SMTPServer;
  private mailboxService: MailboxService;
  private emailService: EmailService;
  private wsService: WebSocketService | null = null;

  constructor(wsService?: WebSocketService) {
    this.mailboxService = new MailboxService();
    this.emailService = new EmailService();
    this.wsService = wsService || null;

    this.server = new SMTPServer({
      ...SMTP_CONFIG,
      onRcptTo: this.handleRecipient.bind(this),
      onData: this.handleData.bind(this),
    });

    this.setupErrorHandlers();
  }

  /**
   * Valida se o destinatário existe
   */
  private async handleRecipient(
    address: SMTPServerAddress,
    session: SMTPServerSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      const emailAddress = address.address.toLowerCase();
      
      // Verificar se o domínio é válido
      const domain = emailAddress.split('@')[1];
      if (!EMAIL_DOMAINS.includes(domain)) {
        return callback(new Error(`Domínio ${domain} não aceito`));
      }

      // Verificar se mailbox existe e está ativa
      const mailbox = await this.mailboxService.getMailboxByAddress(emailAddress);
      
      if (!mailbox) {
        return callback(new Error(`Mailbox ${emailAddress} não encontrada`));
      }

      // Verificar se não expirou
      const now = new Date();
      if (mailbox.expiresAt < now) {
        return callback(new Error(`Mailbox ${emailAddress} expirada`));
      }

      callback();
    } catch (error: any) {
      console.error('Erro ao validar destinatário:', error);
      callback(new Error('Erro ao processar destinatário'));
    }
  }

  /**
   * Processa o email recebido
   */
  private async handleData(
    stream: Readable,
    session: SMTPServerSession,
    callback: (err?: Error | null) => void
  ): Promise<void> {
    try {
      // Fazer parse do email
      const parsed = await parseEmail(stream);

      // Processar cada destinatário
      for (const recipient of parsed.to) {
        const mailbox = await this.mailboxService.getMailboxByAddress(recipient);
        
        if (!mailbox) {
          console.warn(`Mailbox não encontrada para ${recipient}`);
          continue;
        }

        // Salvar anexos
        const attachments = [];
        for (const attachment of parsed.attachments) {
          const filePath = await saveAttachment(
            attachment.content,
            attachment.filename
          );

          attachments.push({
            filename: attachment.filename,
            contentType: attachment.contentType,
            size: attachment.size,
            path: filePath,
          });
        }

        // Criar documento de email
        const email: Omit<Email, '_id'> = {
          mailboxId: mailbox._id!,
          from: parsed.from,
          to: parsed.to,
          subject: parsed.subject,
          textBody: parsed.textBody,
          htmlBody: parsed.htmlBody,
          attachments,
          headers: parsed.headers,
          receivedAt: new Date(),
          isRead: false,
        };

        // Salvar email no banco
        const emailId = await this.emailService.saveEmail(email);

        console.log(`✉️  Email recebido: ${parsed.from} -> ${recipient} (ID: ${emailId})`);

        // Atualizar objeto com ID
        const savedEmail = { ...email, _id: emailId };

        // Notificar via WebSocket
        if (this.wsService && mailbox.accessToken) {
          this.wsService.notifyNewEmail(mailbox.accessToken, savedEmail);
        }

        // Disparar job de indexação no Meilisearch
        await queueEmailForIndexing(savedEmail);
      }

      callback();
    } catch (error: any) {
      console.error('Erro ao processar email:', error);
      callback(new Error('Erro ao processar email'));
    }
  }

  /**
   * Configura handlers de erro
   */
  private setupErrorHandlers(): void {
    this.server.on('error', (error) => {
      console.error('❌ Erro no servidor SMTP:', error);
    });
  }

  /**
   * Inicia o servidor SMTP
   */
  public listen(port: number = SMTP_CONFIG.port): void {
    this.server.listen(port, () => {
      console.log(`📧 Servidor SMTP escutando na porta ${port}`);
    });
  }

  /**
   * Para o servidor SMTP
   */
  public close(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('🛑 Servidor SMTP encerrado');
        resolve();
      });
    });
  }
}

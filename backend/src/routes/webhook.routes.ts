import { MailboxService } from '../services/mailbox.service';
import { EmailService } from '../services/email.service';
import { WebSocketService } from '../services/websocket.service';
import { Email } from '../models/Email';
import { simpleParser } from 'mailparser';
import { saveAttachment } from '../utils/attachmentStorage';
import { queueEmailForIndexing } from '../jobs/indexer.job';

const mailboxService = new MailboxService();
const emailService = new EmailService();

export async function handleCloudflareEmail(
  req: Request,
  wsService?: WebSocketService
): Promise<Response> {
  try {
    const body = await req.json();
    const { to, from, subject, content, headers } = body;

    console.log('📧 Email recebido do Cloudflare:', { to, from, subject });

    // Extrair endereço de email
    const recipientEmail = Array.isArray(to) ? to[0] : to;

    // Buscar mailbox pelo email
    const mailbox = await mailboxService.getMailboxByEmail(recipientEmail);

    if (!mailbox) {
      console.log('❌ Mailbox não encontrado:', recipientEmail);
      return Response.json(
        { error: 'Mailbox não encontrado' },
        { status: 404 }
      );
    }

    const rawText = content?.text || '';
    const rawHtml = content?.html || '';

    let parsedFrom: string = from || '';
    let parsedTo: string[] = Array.isArray(to) ? to : (to ? [to] : []);
    let parsedSubject: string = subject || '(Sem assunto)';
    let parsedTextBody: string | undefined = rawText || undefined;
    let parsedHtmlBody: string | undefined = rawHtml || undefined;
    let parsedHeaders: Record<string, string> = headers || {};
    const parsedAttachments: Email['attachments'] = [];

    if (rawText) {
      try {
        const parsed = await simpleParser(rawText);

        parsedFrom = parsed.from?.text || parsedFrom;
        parsedTo = parsed.to?.value
          ?.map(v => v.address?.toLowerCase())
          .filter((v): v is string => Boolean(v)) || parsedTo;
        parsedSubject = parsed.subject || parsedSubject;
        parsedTextBody = parsed.text || parsedTextBody;
        parsedHtmlBody = (typeof parsed.html === 'string' ? parsed.html : undefined) || parsedHtmlBody;

        const parsedHeaderEntries: Array<[string, any]> = Array.from(parsed.headers?.entries?.() || []);
        if (parsedHeaderEntries.length > 0) {
          parsedHeaders = Object.fromEntries(
            parsedHeaderEntries.map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v)])
          );
        }

        if (parsed.attachments && parsed.attachments.length > 0) {
          for (const att of parsed.attachments) {
            const filePath = await saveAttachment(att.content, att.filename || 'unnamed');
            parsedAttachments.push({
              filename: att.filename || 'unnamed',
              contentType: att.contentType || 'application/octet-stream',
              size: att.size,
              path: filePath,
            });
          }
        }
      } catch (e) {
        console.warn('⚠️ Falha ao parsear raw email do Cloudflare, usando fallback.');
      }
    }

    // Criar documento de email (sem _id, será gerado pelo MongoDB)
    const emailData: Omit<Email, '_id'> = {
      mailboxId: mailbox._id!,
      from: parsedFrom,
      to: parsedTo,
      subject: parsedSubject,
      textBody: parsedTextBody,
      htmlBody: parsedHtmlBody,
      headers: parsedHeaders,
      attachments: parsedAttachments,
      receivedAt: new Date(),
      isRead: false,
    };

    // Salvar email
    const emailId = await emailService.saveEmail(emailData);

    console.log('✅ Email processado:', emailId.toString());

    // Atualizar objeto com ID
    const savedEmail = { ...emailData, _id: emailId };

    await queueEmailForIndexing(savedEmail as Email);

    // Notificar via WebSocket se o serviço estiver disponível
    if (wsService && mailbox.accessToken) {
      console.log('📡 Tentando notificar via WebSocket (webhook)...');
      wsService.notifyNewEmail(mailbox.accessToken, savedEmail as Email);
    } else {
      console.warn('⚠️ WebSocketService não fornecido ou mailbox sem token. Notificação pulada.');
    }

    return Response.json({ 
      success: true, 
      emailId: emailId.toString() 
    });
  } catch (error) {
    console.error('❌ Erro ao processar email:', error);
    return Response.json(
      { 
        error: 'Erro ao processar email',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

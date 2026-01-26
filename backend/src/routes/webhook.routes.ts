import { MailboxService } from '../services/mailbox.service.js';
import { EmailService } from '../services/email.service.js';
import { WebSocketService } from '../services/websocket.service.js';
import { Email } from '../models/Email.js';
import { simpleParser } from 'mailparser';
import { saveAttachment } from '../utils/attachmentStorage.js';
import { queueEmailForIndexing } from '../jobs/indexer.job.js';

const mailboxService = new MailboxService();
const emailService = new EmailService();

export async function handleCloudflareEmail(
  req: Request,
  wsService?: WebSocketService
): Promise<Response> {
  try {
    const body = await req.json() as any;
    const { to, from, subject, content, headers } = body;

    // Extrair endereço de email
    const recipientEmail = Array.isArray(to) ? to[0] : to;

    // Buscar mailbox pelo email
    const mailbox = await mailboxService.getMailboxByEmail(recipientEmail);

    if (!mailbox) {
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
        const toValue = Array.isArray(parsed.to) ? parsed.to : (parsed.to ? [parsed.to] : []);
        parsedTo = toValue
          .flatMap((addr: any) => addr.value || [])
          .map((v: any) => v.address?.toLowerCase())
          .filter((v): v is string => Boolean(v)) || parsedTo;
        parsedSubject = parsed.subject || parsedSubject;
        parsedTextBody = parsed.text || parsedTextBody;
        parsedHtmlBody = (typeof parsed.html === 'string' ? parsed.html : undefined) || parsedHtmlBody;

        const parsedHeaderEntries = Array.from(parsed.headers?.entries?.() || []);
        if (parsedHeaderEntries.length > 0) {
          parsedHeaders = Object.fromEntries(
            parsedHeaderEntries.map(([k, v]: [string, any]) => [k, Array.isArray(v) ? v.join(', ') : String(v)])
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
        // Fallback to basic parsing
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

    // Atualizar objeto com ID
    const savedEmail = { ...emailData, _id: emailId };

    await queueEmailForIndexing(savedEmail as Email);

    // Notificar via WebSocket se o serviço estiver disponível
    if (wsService && mailbox.token) {
      wsService.notifyNewEmail(mailbox.token, savedEmail as Email);
    }

    return Response.json({ 
      success: true, 
      emailId: emailId.toString() 
    });
  } catch (error) {
    return Response.json(
      { 
        error: 'Erro ao processar email',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

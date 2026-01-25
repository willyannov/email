import { ObjectId } from 'mongodb';
import { EmailService } from '../services/email.service.js';
import { MailboxService } from '../services/mailbox.service.js';
import { SearchService } from '../services/search.service.js';
import { EmailIdSchema, PaginationSchema, SearchQuerySchema, MailboxTokenSchema } from '../utils/validation.js';
import { readAttachment } from '../utils/attachmentStorage.js';

const emailService = new EmailService();
const mailboxService = new MailboxService();
const searchService = new SearchService();

export async function handleListEmails(req: Request, token: string): Promise<Response> {
  try {
    console.log(`📋 Listando emails para token: ${token.substring(0, 8)}...`);
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Validar paginação
    PaginationSchema.parse({ limit, offset });

    // Verificar mailbox
    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      console.error(`❌ Mailbox não encontrada para token: ${token.substring(0, 8)}...`);
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }

    // Listar emails
    const result = await emailService.listEmails(mailbox._id!, limit, offset);
    console.log(`✅ Retornando ${result.emails.length} emails`);

    return Response.json(result);
  } catch (error: any) {
    console.error('❌ Erro ao listar emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleGetEmail(
  req: Request,
  token: string,
  emailId: string
): Promise<Response> {
  try {
    // Validar email ID
    EmailIdSchema.parse({ emailId });

    // Verificar mailbox
    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }

    // Buscar email
    const email = await emailService.getEmailById(
      new ObjectId(emailId),
      mailbox._id!
    );

    if (!email) {
      return Response.json({ error: 'Email não encontrado' }, { status: 404 });
    }

    return Response.json(email);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json({ error: 'ID de email inválido' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleDeleteEmail(
  req: Request,
  token: string,
  emailId: string
): Promise<Response> {
  try {
    // Validar email ID
    EmailIdSchema.parse({ emailId });

    // Verificar mailbox
    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }

    // Deletar email
    const deleted = await emailService.deleteEmail(
      new ObjectId(emailId),
      mailbox._id!
    );

    if (!deleted) {
      return Response.json({ error: 'Email não encontrado' }, { status: 404 });
    }

    // Remover do índice de busca
    await searchService.deleteEmail(emailId);

    return Response.json({ message: 'Email deletado com sucesso' });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleSearchEmails(req: Request, token: string): Promise<Response> {
  try {
    MailboxTokenSchema.parse({ token });

    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }

    if (!await mailboxService.isMailboxValid(token)) {
      return Response.json({ error: 'Mailbox expirada' }, { status: 410 });
    }

    // Parsear query params
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const validated = SearchQuerySchema.parse({ q, limit, offset });

    const results = await searchService.search(
      mailbox._id!.toString(),
      validated.q,
      validated.limit,
      validated.offset
    );

    return Response.json(results);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json({ error: 'Parâmetros inválidos', details: error.errors }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleDownloadAttachment(
  req: Request,
  token: string,
  emailId: string,
  attachmentIndex: string
): Promise<Response> {
  try {
    MailboxTokenSchema.parse({ token });
    EmailIdSchema.parse({ emailId });

    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }

    const email = await emailService.getEmailById(
      new ObjectId(emailId),
      mailbox._id!
    );

    if (!email) {
      return Response.json({ error: 'Email não encontrado' }, { status: 404 });
    }

    const index = parseInt(attachmentIndex);
    if (isNaN(index) || index < 0 || index >= email.attachments.length) {
      return Response.json({ error: 'Anexo não encontrado' }, { status: 404 });
    }

    const attachment = email.attachments[index];
    const fileContent = await readAttachment(attachment.path);

    return new Response(fileContent, {
      headers: {
        'Content-Type': attachment.contentType,
        'Content-Disposition': `attachment; filename="${attachment.filename}"`,
        'Content-Length': attachment.size.toString(),
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleMarkAsRead(
  req: Request,
  token: string,
  emailId: string
): Promise<Response> {
  try {
    // Validar email ID
    EmailIdSchema.parse({ emailId });

    // Verificar mailbox
    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }

    // Marcar como lido
    const updated = await emailService.markAsRead(
      new ObjectId(emailId),
      mailbox._id!
    );

    if (!updated) {
      return Response.json({ error: 'Email não encontrado' }, { status: 404 });
    }

    return Response.json({ message: 'Email marcado como lido' });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

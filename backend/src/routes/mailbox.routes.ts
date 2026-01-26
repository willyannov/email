import { MailboxService } from '../services/mailbox.service.js';
import { CreateMailboxSchema, MailboxTokenSchema } from '../utils/validation.js';

const mailboxService = new MailboxService();

export async function handleCreateMailbox(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Validar input
    const validatedInput = CreateMailboxSchema.parse(body);
    
    // Criar mailbox
    const mailbox = await mailboxService.createMailbox(validatedInput);
    
    return Response.json(mailbox, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function handleGetMailbox(req: Request, tokenOrPrefix: string): Promise<Response> {
  try {
    let mailbox;

    // Tentar buscar por token primeiro (compatibilidade)
    if (tokenOrPrefix.length === 64) {
      MailboxTokenSchema.parse({ token: tokenOrPrefix });
      mailbox = await mailboxService.getMailboxByToken(tokenOrPrefix);
    } else {
      // Buscar ou criar por prefixo
      const mailboxData = await mailboxService.getOrCreateMailboxByPrefix(tokenOrPrefix);
      return Response.json({
        address: mailboxData.address,
        token: mailboxData.token,
        expiresAt: mailboxData.expiresAt,
        createdAt: mailboxData.createdAt,
      });
    }
    
    if (!mailbox) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }
    
    // Verificar se expirou
    if (!await mailboxService.isMailboxValid(tokenOrPrefix)) {
      return Response.json({ error: 'Mailbox expirada' }, { status: 410 });
    }
    
    return Response.json({
      address: mailbox.address,
      token: mailbox.token,
      expiresAt: mailbox.expiresAt,
      createdAt: mailbox.createdAt,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return Response.json({ error: 'Identificador inválido' }, { status: 400 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }
}

export async function handleExtendMailbox(req: Request, token: string): Promise<Response> {
  try {
    // Validar token
    MailboxTokenSchema.parse({ token });
    
    // Verificar se mailbox existe e é válida
    if (!await mailboxService.isMailboxValid(token)) {
      return Response.json({ error: 'Mailbox não encontrada ou expirada' }, { status: 404 });
    }
    
    // Estender tempo
    const newExpiresAt = await mailboxService.extendMailbox(token);
    
    return Response.json({ expiresAt: newExpiresAt });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function handleDeleteMailbox(req: Request, token: string): Promise<Response> {
  try {
    // Validar token
    MailboxTokenSchema.parse({ token });
    
    // Deletar mailbox
    const deleted = await mailboxService.deleteMailbox(token);
    
    if (!deleted) {
      return Response.json({ error: 'Mailbox não encontrada' }, { status: 404 });
    }
    
    return Response.json({ message: 'Mailbox deletada com sucesso' });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

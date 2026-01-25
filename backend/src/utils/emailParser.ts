import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import { Readable } from 'stream';

export interface ParsedEmail {
  from: string;
  to: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  headers: Record<string, string>;
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }>;
}

/**
 * Faz parse de um email MIME
 */
export async function parseEmail(emailStream: Readable): Promise<ParsedEmail> {
  const parsed: ParsedMail = await simpleParser(emailStream);

  // Extrair destinatários
  const toAddresses = parsed.to
    ? Array.isArray(parsed.to)
      ? parsed.to.map((addr: any) => addr.value?.[0]?.address || '').filter(Boolean)
      : [parsed.to.value?.[0]?.address || ''].filter(Boolean)
    : [];

  // Extrair remetente
  const fromAddress = parsed.from?.value?.[0]?.address || '';

  // Processar headers
  const headers: Record<string, string> = {};
  if (parsed.headers) {
    for (const [key, value] of parsed.headers) {
      headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
    }
  }

  // Processar anexos
  const attachments: ParsedEmail['attachments'] = [];
  if (parsed.attachments && parsed.attachments.length > 0) {
    for (const attachment of parsed.attachments) {
      attachments.push({
        filename: attachment.filename || 'unnamed',
        contentType: attachment.contentType || 'application/octet-stream',
        size: attachment.size,
        content: attachment.content,
      });
    }
  }

  // Garantir que o texto está limpo (sem headers adicionais)
  let textBody = parsed.text;
  let htmlBody = parsed.html;

  // Se o texto contém "Received:" é porque pegou headers junto
  // Vamos limpar isso
  if (textBody && textBody.includes('Received: from')) {
    // Tentar extrair apenas o conteúdo após todos os headers
    const lines = textBody.split('\n');
    let contentStartIndex = -1;
    
    // Procurar por linha vazia que marca fim dos headers
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '' && i > 0) {
        // Verificar se a próxima linha não é um header
        if (i + 1 < lines.length && !lines[i + 1].match(/^[A-Za-z-]+:/)) {
          contentStartIndex = i + 1;
          break;
        }
      }
    }
    
    if (contentStartIndex > 0) {
      textBody = lines.slice(contentStartIndex).join('\n').trim();
    }
  }

  // Se ainda tiver boundary markers, limpar
  if (textBody) {
    textBody = textBody.replace(/^--[0-9a-f]+.*$/gm, '').trim();
    textBody = textBody.replace(/^Content-Type:.*$/gm, '').trim();
    textBody = textBody.replace(/^Content-Transfer-Encoding:.*$/gm, '').trim();
  }

  console.log('📧 Email parseado:', {
    from: fromAddress,
    to: toAddresses,
    subject: parsed.subject,
    hasText: !!textBody,
    hasHtml: !!htmlBody,
    textLength: textBody?.length,
    htmlLength: typeof htmlBody === 'string' ? htmlBody.length : 0,
  });

  return {
    from: fromAddress,
    to: toAddresses,
    subject: parsed.subject || '(sem assunto)',
    textBody: textBody || undefined,
    htmlBody: htmlBody || undefined,
    headers,
    attachments,
  };
}

/**
 * Sanitiza conteúdo HTML para prevenir XSS
 * (Versão simplificada - em produção, use biblioteca como DOMPurify)
 */
export function sanitizeHtml(html: string): string {
  // Remove scripts
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href="javascript:[^"]*"/gi, '');
  sanitized = sanitized.replace(/href='javascript:[^']*'/gi, '');
  
  return sanitized;
}

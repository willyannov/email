import { ObjectId } from 'mongodb';

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  path: string;                 // caminho no sistema de arquivos
}

export interface Email {
  _id?: ObjectId;
  mailboxId: ObjectId;          // referência ao TempMailbox
  from: string;
  to: string[];
  subject: string;
  textBody?: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  headers: Record<string, string>;
  receivedAt: Date;
  isRead: boolean;
}

export interface EmailListItem {
  _id: string;
  from: string;
  subject: string;
  receivedAt: Date;
  isRead: boolean;
  hasAttachments: boolean;
  snippet: string;
}

export interface EmailDetail extends EmailListItem {
  to: string[];
  textBody?: string;
  htmlBody?: string;
  attachments: EmailAttachment[];
  headers: Record<string, string>;
}

import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database';
import { Email, EmailListItem, EmailDetail } from '../models/Email';
import { sanitizeHtml } from '../utils/emailParser';

export class EmailService {
  private readonly collection = 'emails';

  /**
   * Lista emails de uma mailbox (paginado)
   */
  async listEmails(
    mailboxId: ObjectId,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ emails: EmailListItem[]; total: number }> {
    const db = getDatabase();
    
    const emails = await db.collection<Email>(this.collection)
      .find({ mailboxId })
      .sort({ receivedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await db.collection<Email>(this.collection)
      .countDocuments({ mailboxId });

    const emailList: EmailListItem[] = emails.map(email => ({
      _id: email._id!.toString(),
      from: email.from,
      subject: email.subject,
      receivedAt: email.receivedAt,
      isRead: email.isRead,
      hasAttachments: email.attachments.length > 0,
      snippet: this.buildSnippet(email),
    }));

    return { emails: emailList, total };
  }

  private buildSnippet(email: Email): string {
    const raw = (email.textBody && email.textBody.trim().length > 0)
      ? email.textBody
      : (email.htmlBody || '');

    const withoutTags = raw.replace(/<[^>]*>/g, ' ');
    const normalized = withoutTags.replace(/\s+/g, ' ').trim();
    if (normalized.length <= 140) return normalized;
    return `${normalized.slice(0, 140).trim()}…`;
  }

  /**
   * Busca um email específico
   */
  async getEmailById(emailId: ObjectId, mailboxId: ObjectId): Promise<EmailDetail | null> {
    const db = getDatabase();
    
    const email = await db.collection<Email>(this.collection)
      .findOne({ _id: emailId, mailboxId });

    if (!email) return null;

    // Marcar como lido
    await db.collection<Email>(this.collection)
      .updateOne({ _id: emailId }, { $set: { isRead: true } });

    return {
      _id: email._id!.toString(),
      from: email.from,
      to: email.to,
      subject: email.subject,
      textBody: email.textBody,
      htmlBody: email.htmlBody ? sanitizeHtml(email.htmlBody) : undefined,
      attachments: email.attachments,
      headers: email.headers,
      receivedAt: email.receivedAt,
      isRead: true,
      hasAttachments: email.attachments.length > 0,
      snippet: this.buildSnippet(email),
    };
  }

  /**
   * Salva um novo email
   */
  async saveEmail(email: Omit<Email, '_id'>): Promise<ObjectId> {
    const db = getDatabase();
    
    const result = await db.collection<Email>(this.collection).insertOne({
      ...email,
      receivedAt: new Date(),
      isRead: false,
    } as Email);

    return result.insertedId;
  }

  /**
   * Deleta um email
   */
  async deleteEmail(emailId: ObjectId, mailboxId: ObjectId): Promise<boolean> {
    const db = getDatabase();
    
    const result = await db.collection<Email>(this.collection)
      .deleteOne({ _id: emailId, mailboxId });

    return result.deletedCount > 0;
  }

  /**
   * Marca email como lido
   */
  async markAsRead(emailId: ObjectId, mailboxId: ObjectId): Promise<boolean> {
    const db = getDatabase();
    
    const result = await db.collection<Email>(this.collection)
      .updateOne(
        { _id: emailId, mailboxId },
        { $set: { isRead: true } }
      );

    return result.modifiedCount > 0;
  }

  /**
   * Conta emails não lidos
   */
  async countUnread(mailboxId: ObjectId): Promise<number> {
    const db = getDatabase();
    
    return await db.collection<Email>(this.collection)
      .countDocuments({ mailboxId, isRead: false });
  }
}

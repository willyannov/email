import { ObjectId } from 'mongodb';
import { getDatabase } from '../config/database.js';
import { TempMailbox, CreateMailboxInput, MailboxResponse } from '../models/TempMailbox.js';
import { generateRandomEmail, generateAccessToken, isValidPrefix } from '../utils/emailGenerator.js';
import { EMAIL_DOMAINS } from '../config/smtp.js';

const DEFAULT_TTL = parseInt(process.env.DEFAULT_MAILBOX_TTL || '3600000'); // 1 hora

export class MailboxService {
  private readonly collection = 'mailboxes';

  /**
   * Cria uma nova mailbox temporária
   */
  async createMailbox(input: CreateMailboxInput = {}): Promise<MailboxResponse> {
    const db = getDatabase();
    const { customPrefix, domain, ttl } = input;

    // Determinar domínio
    const selectedDomain = domain && EMAIL_DOMAINS.includes(domain) 
      ? domain 
      : EMAIL_DOMAINS[0];

    // Gerar ou validar email
    let emailAddress: string;
    if (customPrefix) {
      if (!isValidPrefix(customPrefix)) {
        throw new Error('Prefixo inválido. Use apenas letras minúsculas, números e hífens (3-20 caracteres)');
      }
      emailAddress = `${customPrefix}@${selectedDomain}`;
      
      // Verificar se já existe
      const existing = await db.collection<TempMailbox>(this.collection)
        .findOne({ address: emailAddress, isActive: true });
      
      if (existing) {
        throw new Error('Este endereço de email já está em uso');
      }
    } else {
      emailAddress = generateRandomEmail(selectedDomain);
    }

    // Gerar token de acesso
    const token = generateAccessToken();

    // Calcular expiração
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || DEFAULT_TTL));

    // Criar documento
    const mailbox: TempMailbox = {
      address: emailAddress,
      token,
      createdAt: now,
      expiresAt,
      isActive: true,
    };

    const result = await db.collection<TempMailbox>(this.collection).insertOne(mailbox);

    return {
      address: emailAddress,
      token,
      expiresAt,
      createdAt: now,
    };
  }

  /**
   * Busca mailbox por token
   */
  async getMailboxByToken(token: string): Promise<TempMailbox | null> {
    const db = getDatabase();
    return await db.collection<TempMailbox>(this.collection)
      .findOne({ token: token, isActive: true });
  }

  /**
   * Busca mailbox por endereço de email
   */
  async getMailboxByAddress(address: string): Promise<TempMailbox | null> {
    const db = getDatabase();
    return await db.collection<TempMailbox>(this.collection)
      .findOne({ address: address.toLowerCase(), isActive: true });
  }

  /**
   * Busca ou cria mailbox por prefixo
   */
  async getOrCreateMailboxByPrefix(prefix: string): Promise<MailboxResponse> {
    const normalizedPrefix = prefix.toLowerCase().trim();
    
    if (!isValidPrefix(normalizedPrefix)) {
      throw new Error('Prefixo inválido. Use apenas letras minúsculas, números e hífens (3-20 caracteres)');
    }

    const domain = EMAIL_DOMAINS[0];
    const address = `${normalizedPrefix}@${domain}`;

    // Buscar mailbox existente
    const existing = await this.getMailboxByAddress(address);
    
    if (existing) {
      // Verificar se não expirou
      if (existing.expiresAt < new Date()) {
        // Renovar expiração
        const newExpiresAt = new Date(Date.now() + DEFAULT_TTL);
        const db = getDatabase();
        await db.collection<TempMailbox>(this.collection).updateOne(
          { address },
          { $set: { expiresAt: newExpiresAt } }
        );
        
        return {
          address,
          token: existing.token,
          expiresAt: newExpiresAt,
          createdAt: existing.createdAt,
        };
      }
      
      return {
        address: existing.address,
        token: existing.token,
        expiresAt: existing.expiresAt,
        createdAt: existing.createdAt,
      };
    }

    // Criar nova mailbox
    return await this.createMailbox({ customPrefix: normalizedPrefix });

  }
  /**
   * Verifica se uma mailbox está ativa e não expirou
   */
  async isMailboxValid(token: string): Promise<boolean> {
    const mailbox = await this.getMailboxByToken(token);
    if (!mailbox) return false;
    
    const now = new Date();
    return mailbox.isActive && mailbox.expiresAt > now;
  }

  /**
   * Estende o tempo de vida de uma mailbox
   */
  async extendMailbox(token: string, additionalTime: number = DEFAULT_TTL): Promise<Date> {
    const db = getDatabase();
    const mailbox = await this.getMailboxByToken(token);
    
    if (!mailbox) {
      throw new Error('Mailbox não encontrada');
    }

    const newExpiresAt = new Date(mailbox.expiresAt.getTime() + additionalTime);

    await db.collection<TempMailbox>(this.collection).updateOne(
      { _id: mailbox._id },
      { $set: { expiresAt: newExpiresAt } }
    );

    return newExpiresAt;
  }

  /**
   * Deleta uma mailbox e todos os emails associados
   */
  async deleteMailbox(token: string): Promise<boolean> {
    const db = getDatabase();
    const mailbox = await this.getMailboxByToken(token);
    
    if (!mailbox) {
      return false;
    }

    // Marcar como inativa
    await db.collection<TempMailbox>(this.collection).updateOne(
      { _id: mailbox._id },
      { $set: { isActive: false } }
    );

    // Deletar emails associados
    await db.collection('emails').deleteMany({ mailboxId: mailbox._id });

    return true;
  }

  /**
   * Lista mailboxes expiradas
   */
  async getExpiredMailboxes(): Promise<TempMailbox[]> {
    const db = getDatabase();
    const now = new Date();
    
    return await db.collection<TempMailbox>(this.collection)
      .find({ 
        isActive: true,
        expiresAt: { $lt: now }
      })
      .toArray();
  }

  /**
   * Busca mailbox por endereço de email
   */
  async getMailboxByEmail(emailAddress: string): Promise<TempMailbox | null> {
    const db = getDatabase();
    
    return await db.collection<TempMailbox>(this.collection)
      .findOne({ 
        address: emailAddress.toLowerCase(),
        isActive: true
      });
  }
}

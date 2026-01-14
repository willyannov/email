import { ObjectId } from 'mongodb';

export interface TempMailbox {
  _id?: ObjectId;
  address: string;              // email completo (usuario@dominio.com)
  accessToken: string;          // token único para acesso
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface CreateMailboxInput {
  customPrefix?: string;        // prefixo personalizado (opcional)
  domain?: string;              // domínio (opcional, usa padrão)
  ttl?: number;                 // tempo de vida em ms (opcional)
}

export interface MailboxResponse {
  address: string;
  accessToken: string;
  expiresAt: Date;
  createdAt: Date;
}

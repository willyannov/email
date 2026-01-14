import { z } from 'zod';

export const CreateMailboxSchema = z.object({
  customPrefix: z.string().min(3).max(20).regex(/^[a-z0-9-]+$/).optional(),
  domain: z.string().optional(),
  ttl: z.number().positive().optional(),
});

export const MailboxTokenSchema = z.object({
  token: z.string().min(1),
});

export const EmailIdSchema = z.object({
  emailId: z.string().regex(/^[0-9a-fA-F]{24}$/), // ObjectId válido
});

export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

export const PaginationSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

import { describe, test, expect } from 'bun:test';
import {
  CreateMailboxSchema,
  EmailIdSchema,
  MailboxTokenSchema,
  PaginationSchema,
  SearchQuerySchema,
} from '../../src/utils/validation';

describe('validation', () => {
  test('CreateMailboxSchema should accept valid prefixes', () => {
    const parsed = CreateMailboxSchema.parse({ customPrefix: 'my-project-test' });
    expect(parsed.customPrefix).toBe('my-project-test');
  });

  test('CreateMailboxSchema should reject invalid prefixes', () => {
    expect(() => CreateMailboxSchema.parse({ customPrefix: 'AB' })).toThrow();
    expect(() => CreateMailboxSchema.parse({ customPrefix: 'has space' })).toThrow();
    expect(() => CreateMailboxSchema.parse({ customPrefix: 'UPPERCASE' })).toThrow();
  });

  test('MailboxTokenSchema should accept non-empty tokens', () => {
    expect(() => MailboxTokenSchema.parse({ token: 'abc' })).not.toThrow();
  });

  test('EmailIdSchema should validate ObjectId strings', () => {
    expect(() => EmailIdSchema.parse({ emailId: '507f1f77bcf86cd799439011' })).not.toThrow();
    expect(() => EmailIdSchema.parse({ emailId: 'not-an-objectid' })).toThrow();
  });

  test('SearchQuerySchema should validate and default pagination', () => {
    const parsed = SearchQuerySchema.parse({ q: 'hello' });
    expect(parsed.q).toBe('hello');
    expect(parsed.limit).toBe(20);
    expect(parsed.offset).toBe(0);
  });

  test('PaginationSchema should enforce bounds', () => {
    expect(() => PaginationSchema.parse({ limit: 0, offset: 0 })).toThrow();
    expect(() => PaginationSchema.parse({ limit: 20, offset: 0 })).not.toThrow();
  });
});

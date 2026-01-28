import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Db } from 'mongodb';
import { connectToDatabase, closeDatabaseConnection } from '../../src/config/database';
import { createRouter } from '../../src/router';

describe('Mailbox Integration Tests', () => {
  let db: Db;
  let server: ReturnType<typeof Bun.serve> | undefined;
  let API_URL: string;

  beforeAll(async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/tempmail-test';
    db = await connectToDatabase();
    await db.dropDatabase();

    const router = createRouter();
    server = Bun.serve({
      port: 0,
      fetch: router,
    });

    API_URL = `http://localhost:${server.port}/api`;
  });

  afterAll(async () => {
    server?.stop(true);
    await db.dropDatabase();
    await closeDatabaseConnection();
  });

  describe('POST /api/mailbox/create', () => {
    test('should create mailbox with random email', async () => {
      const response = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('expiresAt');
      expect(data.address).toMatch(/@tadurodorme\.site$/);
      expect(data.token).toHaveLength(64);
    });

    test('should create mailbox with custom prefix', async () => {
      const customPrefix = 'testuser123';
      const response = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrefix }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();

      expect(data.address).toBe(`${customPrefix}@tadurodorme.site`);
      expect(data.token).toHaveLength(64);
    });

    test('should reject invalid custom prefix', async () => {
      const response = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrefix: 'ab' }),
      });

      expect(response.status).toBe(400);
    });

    test('should reject duplicate custom prefix', async () => {
      const customPrefix = 'uniqueuser';

      await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrefix }),
      });

      const response = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrefix }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/mailbox/:token', () => {
    test('should retrieve mailbox by token', async () => {
      const createResponse = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { token } = await createResponse.json();

      const response = await fetch(`${API_URL}/mailbox/${token}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('address');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('createdAt');
    });

    test('should return 404 for non-existent token', async () => {
      const response = await fetch(`${API_URL}/mailbox/${'a'.repeat(64)}`);
      expect(response.status).toBe(404);
    });

    test('should return 410 for expired mailbox', async () => {
      const token = 'b'.repeat(64);
      await db.collection('mailboxes').insertOne({
        address: 'expired@tadurodorme.site',
        token,
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
        isActive: true,
      });

      const response = await fetch(`${API_URL}/mailbox/${token}`);
      expect(response.status).toBe(410);
    });
  });

  describe('PATCH /api/mailbox/:token/extend', () => {
    test('should extend mailbox expiration', async () => {
      const createResponse = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { token } = await createResponse.json();

      const originalResponse = await fetch(`${API_URL}/mailbox/${token}`);
      const original = await originalResponse.json();
      const originalExpiry = new Date(original.expiresAt);

      const extendResponse = await fetch(`${API_URL}/mailbox/${token}/extend`, {
        method: 'PATCH',
      });
      expect(extendResponse.status).toBe(200);

      const newResponse = await fetch(`${API_URL}/mailbox/${token}`);
      const updated = await newResponse.json();
      const newExpiry = new Date(updated.expiresAt);

      expect(newExpiry.getTime()).toBeGreaterThan(originalExpiry.getTime());
    });
  });

  describe('DELETE /api/mailbox/:token', () => {
    test('should delete mailbox', async () => {
      const createResponse = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { token } = await createResponse.json();

      const deleteResponse = await fetch(`${API_URL}/mailbox/${token}`, {
        method: 'DELETE',
      });
      expect(deleteResponse.status).toBe(200);

      const getResponse = await fetch(`${API_URL}/mailbox/${token}`);
      expect(getResponse.status).toBe(404);
    });
  });

  describe('GET /api/mailbox/:token/emails', () => {
    test('should return empty array for new mailbox', async () => {
      const createResponse = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { token } = await createResponse.json();

      const response = await fetch(`${API_URL}/mailbox/${token}/emails`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.emails).toEqual([]);
      expect(data.total).toBe(0);
    });

    test('should list emails after receiving', async () => {
      const createResponse = await fetch(`${API_URL}/mailbox/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const { token, address } = await createResponse.json();

      const mailboxDoc = await db.collection('mailboxes').findOne({ token });
      expect(mailboxDoc).not.toBeNull();

      await db.collection('emails').insertOne({
        mailboxId: mailboxDoc!._id,
        from: 'sender@example.com',
        to: [address],
        subject: 'Test Email',
        textBody: 'This is a test',
        receivedAt: new Date(),
        isRead: false,
        attachments: [],
        headers: {},
      });

      const response = await fetch(`${API_URL}/mailbox/${accessToken}/emails`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.emails).toHaveLength(1);
      expect(data.emails[0].subject).toBe('Test Email');
    });
  });
});

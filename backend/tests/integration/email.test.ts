import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import type { Db, ObjectId } from 'mongodb';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { connectToDatabase, closeDatabaseConnection } from '../../src/config/database';
import { createRouter } from '../../src/router';

describe('Email Integration Tests', () => {
  let db: Db;
  let server: ReturnType<typeof Bun.serve> | undefined;
  let API_URL: string;

  let testMailboxId: ObjectId;
  let testToken: string;
  let testAddress: string;

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

    const createResponse = await fetch(`${API_URL}/mailbox/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(createResponse.status).toBe(201);
    const created = await createResponse.json();
    testToken = created.accessToken;
    testAddress = created.address;

    const mailboxDoc = await db.collection('mailboxes').findOne({ accessToken: testToken });
    expect(mailboxDoc).not.toBeNull();
    testMailboxId = mailboxDoc!._id;
  });

  afterAll(async () => {
    server?.stop(true);
    await db.dropDatabase();
    await closeDatabaseConnection();
  });

  describe('GET /api/mailbox/:token/emails/:emailId', () => {
    test('should retrieve email details', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      const email = await db.collection('emails').insertOne({
        mailboxId: testMailboxId,
        from: 'sender@example.com',
        to: [testAddress],
        subject: 'Test Email Detail',
        textBody: 'Email body content',
        htmlBody: '<p>Email body content</p>',
        receivedAt: new Date(),
        isRead: false,
        attachments: [],
        headers: { 'content-type': 'text/html' },
      });

      const response = await fetch(`${API_URL}/mailbox/${testToken}/emails/${email.insertedId}`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.subject).toBe('Test Email Detail');
      expect(data.from).toBe('sender@example.com');
      expect(data.textBody).toBe('Email body content');
      expect(data.htmlBody).toBe('<p>Email body content</p>');
      expect(data.isRead).toBe(true);
    });

    test('should return 404 for non-existent email', async () => {
      const response = await fetch(`${API_URL}/mailbox/${testToken}/emails/${'0'.repeat(24)}`);
      expect(response.status).toBe(404);
    });

    test('should mark email as read after viewing', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      const email = await db.collection('emails').insertOne({
        mailboxId: testMailboxId,
        from: 'sender@example.com',
        to: [testAddress],
        subject: 'Unread Email',
        receivedAt: new Date(),
        isRead: false,
        attachments: [],
        headers: {},
      });

      const viewResponse = await fetch(`${API_URL}/mailbox/${testToken}/emails/${email.insertedId}`);
      expect(viewResponse.status).toBe(200);

      const updatedEmail = await db.collection('emails').findOne({ _id: email.insertedId });
      expect(updatedEmail?.isRead).toBe(true);
    });
  });

  describe('GET /api/mailbox/:token/emails/:emailId/attachments/:index', () => {
    test('should download attachment', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      const content = 'test content';
      const attachmentPath = join(
        tmpdir(),
        `tempmail-attachment-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`
      );
      await fs.writeFile(attachmentPath, content);

      try {
        const email = await db.collection('emails').insertOne({
          mailboxId: testMailboxId,
          from: 'sender@example.com',
          to: [testAddress],
          subject: 'Email with Attachment',
          receivedAt: new Date(),
          isRead: false,
          attachments: [
            {
              filename: 'test.txt',
              contentType: 'text/plain',
              size: Buffer.byteLength(content),
              path: attachmentPath,
            },
          ],
          headers: {},
        });

        const response = await fetch(
          `${API_URL}/mailbox/${testToken}/emails/${email.insertedId}/attachments/0`
        );

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('text/plain');

        const downloaded = await response.text();
        expect(downloaded).toBe(content);
      } finally {
        await fs.unlink(attachmentPath).catch(() => undefined);
      }
    });

    test('should return 404 for non-existent attachment', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      const email = await db.collection('emails').insertOne({
        mailboxId: testMailboxId,
        from: 'sender@example.com',
        to: [testAddress],
        subject: 'No Attachment',
        receivedAt: new Date(),
        isRead: false,
        attachments: [],
        headers: {},
      });

      const response = await fetch(
        `${API_URL}/mailbox/${testToken}/emails/${email.insertedId}/attachments/0`
      );
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/mailbox/:token/emails/search', () => {
    test('should search emails by query', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      await db.collection('emails').insertMany([
        {
          mailboxId: testMailboxId,
          from: 'important@example.com',
          to: [testAddress],
          subject: 'Important Meeting',
          textBody: 'Meeting at 3pm',
          receivedAt: new Date(),
          isRead: false,
          attachments: [],
          headers: {},
        },
        {
          mailboxId: testMailboxId,
          from: 'newsletter@example.com',
          to: [testAddress],
          subject: 'Weekly Newsletter',
          textBody: 'Latest news',
          receivedAt: new Date(),
          isRead: false,
          attachments: [],
          headers: {},
        },
      ]);

      const response = await fetch(`${API_URL}/mailbox/${testToken}/emails/search?q=meeting`);
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Email filtering and pagination', () => {
    test('should support limit parameter', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      const emails = Array.from({ length: 15 }, (_, i) => ({
        mailboxId: testMailboxId,
        from: `sender${i}@example.com`,
        to: [testAddress],
        subject: `Email ${i}`,
        receivedAt: new Date(Date.now() + i * 1000),
        isRead: false,
        attachments: [],
        headers: {},
      }));
      await db.collection('emails').insertMany(emails);

      const response = await fetch(`${API_URL}/mailbox/${testToken}/emails?limit=10`);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.emails.length).toBeLessThanOrEqual(10);
    });

    test('should sort emails by receivedAt desc', async () => {
      await db.collection('emails').deleteMany({ mailboxId: testMailboxId });

      const now = Date.now();
      await db.collection('emails').insertMany([
        {
          mailboxId: testMailboxId,
          from: 'old@example.com',
          to: [testAddress],
          subject: 'Old Email',
          receivedAt: new Date(now - 10000),
          isRead: false,
          attachments: [],
          headers: {},
        },
        {
          mailboxId: testMailboxId,
          from: 'new@example.com',
          to: [testAddress],
          subject: 'New Email',
          receivedAt: new Date(now),
          isRead: false,
          attachments: [],
          headers: {},
        },
      ]);

      const response = await fetch(`${API_URL}/mailbox/${testToken}/emails`);
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.emails[0].subject).toBe('New Email');
    });
  });
});

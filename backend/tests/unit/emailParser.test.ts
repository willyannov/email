import { describe, test, expect } from 'bun:test';
import { Readable } from 'stream';
import { parseEmail } from '../../src/utils/emailParser';

describe('emailParser', () => {
  test('should parse simple email correctly', async () => {
    const raw = [
      'From: sender@example.com',
      'To: recipient@tempmail.com',
      'Subject: Test Email',
      '',
      'This is a test email',
      '',
    ].join('\r\n');

    const result = await parseEmail(Readable.from([raw]));

    expect(result.from).toBe('sender@example.com');
    expect(result.to).toEqual(['recipient@tempmail.com']);
    expect(result.subject).toBe('Test Email');
    expect(result.textBody).toBe('This is a test email');
  });

  test('should parse multipart alternative (text + html)', async () => {
    const boundary = 'alt_boundary';
    const raw = [
      'From: sender@example.com',
      'To: recipient@tempmail.com',
      'Subject: HTML Email',
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="utf-8"',
      '',
      'Text version',
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="utf-8"',
      '',
      '<p>HTML version</p>',
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const result = await parseEmail(Readable.from([raw]));

    expect(result.subject).toBe('HTML Email');
    expect(result.textBody).toContain('Text version');
    expect(result.htmlBody).toContain('<p>HTML version</p>');
  });

  test('should parse email with attachments', async () => {
    const boundary = 'mixed_boundary';
    const attachmentBase64 = Buffer.from('test content').toString('base64');
    const raw = [
      'From: sender@example.com',
      'To: recipient@tempmail.com',
      'Subject: Email with attachment',
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="utf-8"',
      '',
      'Check the attachment',
      '',
      `--${boundary}`,
      'Content-Type: text/plain; name="test.txt"',
      'Content-Transfer-Encoding: base64',
      'Content-Disposition: attachment; filename="test.txt"',
      '',
      attachmentBase64,
      '',
      `--${boundary}--`,
      '',
    ].join('\r\n');

    const result = await parseEmail(Readable.from([raw]));

    expect(result.subject).toBe('Email with attachment');
    expect(result.attachments).toHaveLength(1);
    expect(result.attachments[0].filename).toBe('test.txt');
    expect(result.attachments[0].contentType).toBe('text/plain');
    expect(result.attachments[0].size).toBeGreaterThan(0);
  });

  test('should handle missing fields gracefully', async () => {
    const raw = [
      'From: sender@example.com',
      'To: recipient@tempmail.com',
      '',
      'Body',
      '',
    ].join('\r\n');

    const result = await parseEmail(Readable.from([raw]));

    expect(result.subject).toBe('(sem assunto)');
    expect(result.textBody).toContain('Body');
  });
});

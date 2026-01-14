import { describe, test, expect } from 'bun:test';
import { generateRandomEmail, generateRandomPrefix, generateAccessToken, isValidPrefix } from '../../src/utils/emailGenerator';

describe('emailGenerator', () => {
  test('should generate random prefix with expected shape', () => {
    const prefix = generateRandomPrefix();
    expect(prefix).toMatch(/^[a-z]+-[a-z]+-[0-9a-f]{4}$/);
    expect(isValidPrefix(prefix)).toBe(true);
  });

  test('should generate random email with provided domain', () => {
    const domain = 'tempmail.com';
    const email = generateRandomEmail(domain);
    expect(email).toContain(`@${domain}`);
    expect(email.split('@')[0].length).toBeGreaterThanOrEqual(3);
  });

  test('should generate unique emails', () => {
    const domain = 'tempmail.com';
    const email1 = generateRandomEmail(domain);
    const email2 = generateRandomEmail(domain);
    expect(email1).not.toBe(email2);
  });

  test('should generate secure access token', () => {
    const token = generateAccessToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  test('should validate custom prefixes', () => {
    expect(isValidPrefix('abc')).toBe(true);
    expect(isValidPrefix('my-project-test')).toBe(true);
    expect(isValidPrefix('ab')).toBe(false);
    expect(isValidPrefix('this-prefix-is-way-too-long-for-the-rule')).toBe(false);
    expect(isValidPrefix('UPPER')).toBe(false);
    expect(isValidPrefix('has_space')).toBe(false);
  });
});

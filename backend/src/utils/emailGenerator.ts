import { randomBytes } from 'crypto';

const ADJECTIVES = [
  'swift', 'clever', 'bright', 'quick', 'smart', 'sharp', 'witty', 'bold',
  'brave', 'calm', 'cool', 'eager', 'fair', 'fancy', 'fine', 'gentle',
];

const NOUNS = [
  'panda', 'tiger', 'eagle', 'wolf', 'fox', 'hawk', 'bear', 'lion',
  'otter', 'raven', 'shark', 'whale', 'falcon', 'lynx', 'cobra', 'viper',
];

/**
 * Gera um prefixo de email aleatório no formato: adjective-noun-random
 * Exemplo: swift-panda-x7k2
 */
export function generateRandomPrefix(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const random = randomBytes(2).toString('hex'); // 4 caracteres hex
  
  return `${adjective}-${noun}-${random}`;
}

/**
 * Gera um email completo com domínio
 */
export function generateRandomEmail(domain: string): string {
  const prefix = generateRandomPrefix();
  return `${prefix}@${domain}`;
}

/**
 * Gera um token de acesso seguro
 */
export function generateAccessToken(): string {
  return randomBytes(32).toString('hex'); // 64 caracteres
}

/**
 * Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-z0-9][a-z0-9-_.]*@[a-z0-9][a-z0-9-]*\.[a-z]{2,}$/i;
  return emailRegex.test(email);
}

/**
 * Valida prefixo customizado
 */
export function isValidPrefix(prefix: string): boolean {
  const prefixRegex = /^[a-z0-9-]{3,20}$/;
  return prefixRegex.test(prefix);
}

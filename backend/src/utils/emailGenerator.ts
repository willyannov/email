import { randomBytes } from 'crypto';

const NOMES_FEMININOS = [
  'ana', 'maria', 'julia', 'beatriz', 'laura', 'isabela', 'manuela', 'gabriela',
  'sophia', 'alice', 'helena', 'yasmin', 'livia', 'valentina', 'giovanna', 'cecilia',
  'mariana', 'amanda', 'fernanda', 'patricia', 'camila', 'carolina', 'natalia', 'jessica',
  'vanessa', 'leticia', 'bianca', 'barbara', 'daniela', 'roberta', 'adriana', 'raquel',
  'luciana', 'juliana', 'renata', 'michele', 'priscila', 'sabrina', 'tatiana', 'aline',
  'bruna', 'carla', 'debora', 'elaine', 'fabiana', 'gisele', 'heloisa', 'ingrid',
  'janaina', 'karina'
];

const ADJETIVOS_FEMININOS = [
  'linda', 'bonita', 'bela', 'formosa', 'graciosa', 'encantadora', 'maravilhosa', 'deslumbrante',
  'radiante', 'elegante', 'charmosa', 'sedutora', 'atraente', 'fascinante', 'esplendida', 'divina',
  'sublime', 'perfeita', 'adoravel', 'cativante', 'feia', 'horrivel', 'estranha', 'bizarra',
  'exotica', 'diferente', 'peculiar', 'unica', 'rara', 'especial', 'doce', 'meiga',
  'gentil', 'terna', 'carinhosa', 'amorosa', 'querida', 'amada', 'preciosa', 'estimada',
  'valente', 'corajosa', 'forte', 'destemida', 'audaciosa', 'intrépida', 'heroica', 'brava',
  'inteligente', 'sagaz'
];

/**
 * Gera um prefixo de email aleatório no formato: adjetivo-nome-random
 * Exemplo: linda-ana-x7k2
 */
export function generateRandomPrefix(): string {
  const adjetivo = ADJETIVOS_FEMININOS[Math.floor(Math.random() * ADJETIVOS_FEMININOS.length)];
  const nome = NOMES_FEMININOS[Math.floor(Math.random() * NOMES_FEMININOS.length)];
  const random = randomBytes(2).toString('hex'); // 4 caracteres hex
  
  return `${nome}-${adjetivo}`;
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

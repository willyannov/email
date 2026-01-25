export const SMTP_CONFIG = {
  port: parseInt(process.env.SMTP_PORT || '2525'),
  host: process.env.SMTP_HOST || '0.0.0.0',
  secure: false,
  authOptional: true,
  disabledCommands: ['AUTH'] as string[],
  maxClients: 100,
  useXClient: false,
  useXForward: false,
  banner: 'Temp Email SMTP Server',
  
  // Limites
  size: 10 * 1024 * 1024, // 10MB max por email
  
  // Timeouts
  socketTimeout: 60 * 1000, // 60 segundos
  closeTimeout: 30 * 1000,  // 30 segundos
};

export const EMAIL_DOMAINS = [
  'mediavid.site',
  'mail.mediavid.site',
  'tempmail.local',  // Para testes locais
];

import { promises as fs } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');

/**
 * Garante que o diretório de uploads existe
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Salva um anexo no sistema de arquivos
 */
export async function saveAttachment(
  content: Buffer,
  originalFilename: string
): Promise<string> {
  await ensureUploadDir();

  // Gerar nome único para o arquivo
  const extension = originalFilename.split('.').pop() || 'bin';
  const uniqueName = `${randomBytes(16).toString('hex')}.${extension}`;
  const filePath = join(UPLOAD_DIR, uniqueName);

  // Salvar arquivo
  await fs.writeFile(filePath, content);

  return filePath;
}

/**
 * Lê um anexo do sistema de arquivos
 */
export async function readAttachment(filePath: string): Promise<Buffer> {
  return await fs.readFile(filePath);
}

/**
 * Deleta um anexo do sistema de arquivos
 */
export async function deleteAttachment(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Erro ao deletar anexo:', error);
  }
}

/**
 * Deleta múltiplos anexos
 */
export async function deleteAttachments(filePaths: string[]): Promise<void> {
  await Promise.all(filePaths.map(path => deleteAttachment(path)));
}

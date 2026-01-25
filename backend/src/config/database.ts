import { MongoClient, Db } from 'mongodb';

function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb://localhost:27017/temp-email';
}

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    const uri = getMongoUri();
    
    console.log('🔌 Tentando conectar ao MongoDB...');
    console.log('📍 URI original (mascarada):', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    // Adicionar database name se não estiver presente
    let finalUri = uri;
    if (uri.includes('mongodb.net/') || uri.includes('mongodb+srv://')) {
      // Garantir que tem o database name "tempmail"
      if (uri.includes('mongodb.net/?')) {
        finalUri = uri.replace('mongodb.net/?', 'mongodb.net/tempmail?');
      } else if (!uri.includes('mongodb.net/tempmail') && uri.includes('mongodb.net/')) {
        finalUri = uri.replace('mongodb.net/', 'mongodb.net/tempmail/');
      }
      
      // Adicionar parâmetros apenas se não existirem
      const params: string[] = [];
      if (!finalUri.includes('retryWrites')) params.push('retryWrites=true');
      if (!finalUri.includes('w=')) params.push('w=majority');
      if (!finalUri.includes('tls=')) params.push('tls=true');
      
      if (params.length > 0) {
        const separator = finalUri.includes('?') ? '&' : '?';
        finalUri += separator + params.join('&');
      }
    }
    
    console.log('📝 URI preparada (mascarada):', finalUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    
    // Verificar se deve permitir certificados inválidos (via env var)
    const allowInvalidTLS = process.env.ALLOW_INVALID_TLS === 'true';
    if (allowInvalidTLS) {
      console.log('⚠️ TLS validation disabled via ALLOW_INVALID_TLS=true');
    }
    
    // Configurações TLS explícitas para MongoDB Atlas
    client = new MongoClient(finalUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      ssl: true,
      sslValidate: !allowInvalidTLS,
      tlsAllowInvalidCertificates: allowInvalidTLS,
      tlsAllowInvalidHostnames: allowInvalidTLS,
    });
    
    await client.connect();
    
    // Ping para verificar conexão
    await client.db('admin').command({ ping: 1 });
    
    db = client.db();
    
    console.log('✅ Conectado ao MongoDB com sucesso');
    
    // Criar índices
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    
    // Tentar com TLS relaxado (fallback para problemas de certificado)
    if (error instanceof Error && (error.message.includes('SSL') || error.message.includes('TLS'))) {
      console.log('⚠️ Tentando conectar com TLS relaxado...');
      try {
        const uri = getMongoUri();
        let finalUri = uri;
        
        if (uri.includes('mongodb.net/') || uri.includes('mongodb+srv://')) {
          if (uri.includes('mongodb.net/?')) {
            finalUri = uri.replace('mongodb.net/?', 'mongodb.net/tempmail?');
          } else if (!uri.includes('mongodb.net/tempmail') && uri.includes('mongodb.net/')) {
            finalUri = uri.replace('mongodb.net/', 'mongodb.net/tempmail/');
          }
          
          // Adicionar apenas o que falta
          const params: string[] = [];
          if (!finalUri.includes('tlsAllowInvalidCertificates')) {
            params.push('tlsAllowInvalidCertificates=true');
          }
          if (!finalUri.includes('retryWrites')) params.push('retryWrites=true');
          if (!finalUri.includes('w=')) params.push('w=majority');
          
          if (params.length > 0) {
            const separator = finalUri.includes('?') ? '&' : '?';
            finalUri += separator + params.join('&');
          }
        }
        
        console.log('📝 URI retry (mascarada):', finalUri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
        
        client = new MongoClient(finalUri, {
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
          ssl: true,
          sslValidate: false,
        });
        
        await client.connect();
        await client.db('admin').command({ ping: 1 });
        db = client.db();
        
        console.log('✅ Conectado ao MongoDB com TLS relaxado');
        await createIndexes(db);
        
        return db;
      } catch (retryError) {
        console.error('❌ Falha na tentativa com TLS relaxado:', retryError);
        throw retryError;
      }
    }
    
    throw error;
  }
}

async function createIndexes(db: Db) {
  try {
    // Índices para TempMailbox
    await db.collection('mailboxes').createIndex({ address: 1 }, { unique: true });
    await db.collection('mailboxes').createIndex({ accessToken: 1 }, { unique: true });
    await db.collection('mailboxes').createIndex({ expiresAt: 1 });
    await db.collection('mailboxes').createIndex({ isActive: 1 });
    
    // Índices para Email
    await db.collection('emails').createIndex({ mailboxId: 1 });
    await db.collection('emails').createIndex({ receivedAt: -1 });
    await db.collection('emails').createIndex({ mailboxId: 1, receivedAt: -1 });
    
    console.log('✅ Índices do MongoDB criados com sucesso');
  } catch (error) {
    console.error('⚠️ Erro ao criar índices:', error);
  }
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 Conexão com MongoDB fechada');
  }
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database não conectado. Chame connectToDatabase() primeiro.');
  }
  return db;
}

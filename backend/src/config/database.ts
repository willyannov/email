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
    
    // Adicionar database name se não estiver presente
    let finalUri = uri;
    if (uri.includes('mongodb.net/') || uri.includes('mongodb+srv://')) {
      // Garantir que tem o database name
      if (!uri.includes('mongodb.net/tempmail') && !uri.includes('mongodb.net/?')) {
        finalUri = uri.replace('mongodb.net/', 'mongodb.net/tempmail');
      } else if (uri.includes('mongodb.net/?')) {
        finalUri = uri.replace('mongodb.net/?', 'mongodb.net/tempmail?');
      }
      
      // Adicionar parâmetros TLS se não estiverem presentes
      if (!finalUri.includes('retryWrites')) {
        const separator = finalUri.includes('?') ? '&' : '?';
        finalUri += `${separator}retryWrites=true&w=majority&tls=true`;
      }
    }
    
    console.log('📝 Connection string preparada');
    
    // Configurações compatíveis com Node.js Alpine + MongoDB Atlas
    client = new MongoClient(finalUri, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true,
      // Não especificar TLS aqui - deixar a URL decidir
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
    
    // Tentar novamente sem verificação de certificado (fallback)
    if (error instanceof Error && error.message.includes('SSL')) {
      console.log('⚠️ Tentando conectar com TLS relaxado...');
      try {
        const uri = getMongoUri();
        let finalUri = uri;
        
        if (uri.includes('mongodb.net/') || uri.includes('mongodb+srv://')) {
          if (!uri.includes('mongodb.net/tempmail') && !uri.includes('mongodb.net/?')) {
            finalUri = uri.replace('mongodb.net/', 'mongodb.net/tempmail');
          } else if (uri.includes('mongodb.net/?')) {
            finalUri = uri.replace('mongodb.net/?', 'mongodb.net/tempmail?');
          }
          
          const separator = finalUri.includes('?') ? '&' : '?';
          finalUri += `${separator}retryWrites=true&w=majority&tlsAllowInvalidCertificates=true`;
        }
        
        client = new MongoClient(finalUri, {
          serverSelectionTimeoutMS: 30000,
          connectTimeoutMS: 30000,
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

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
    
    // Adicionar database name se não estiver presente
    const finalUri = uri.includes('mongodb.net/') && !uri.includes('mongodb.net/?') 
      ? uri.replace('mongodb.net/', 'mongodb.net/tempmail')
      : uri.includes('mongodb.net/?')
      ? uri.replace('mongodb.net/?', 'mongodb.net/tempmail?')
      : uri;
    
    client = new MongoClient(finalUri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    await client.connect();
    db = client.db();
    
    console.log('✅ Conectado ao MongoDB com sucesso');
    
    // Criar índices
    await createIndexes(db);
    
    return db;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
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

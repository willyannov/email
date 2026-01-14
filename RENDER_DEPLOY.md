# 🚀 Plano de Deploy no Render - TempMail

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Arquitetura no Render](#arquitetura-no-render)
- [Serviços Necessários](#serviços-necessários)
- [Plano de Deploy Passo a Passo](#plano-de-deploy-passo-a-passo)
- [Dificuldades e Soluções](#dificuldades-e-soluções)
- [Custos Estimados](#custos-estimados)
- [Alternativas ao Render](#alternativas-ao-render)
- [Checklist Final](#checklist-final)

---

## 🎯 Visão Geral

O Render é uma plataforma PaaS (Platform as a Service) que facilita o deploy de aplicações modernas. Porém, o projeto TempMail tem requisitos específicos que tornam o deploy desafiador:

### Componentes do Projeto
1. **Backend (Bun + TypeScript)** - API REST + WebSocket + SMTP
2. **Frontend (Next.js 14)** - Interface do usuário
3. **MongoDB** - Banco de dados
4. **Redis** - Cache e filas (BullMQ)
5. **Meilisearch** - Motor de busca
6. **Servidor SMTP (porta 2525)** - Receber emails

### ⚠️ Desafios Principais
- Render **não suporta portas customizadas** (apenas HTTP/HTTPS)
- SMTP requer porta dedicada (2525 ou 25)
- Servidor SMTP precisa de IP público estático
- Bun não é oficialmente suportado (mas é possível)
- Múltiplos serviços interdependentes

---

## 🏗️ Arquitetura no Render (Free Tier)

```
┌─────────────────────────────────────────────────────────────────┐
│                    RENDER PLATFORM (FREE)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │  Frontend Web    │        │  Backend Web     │               │
│  │  Service         │───────▶│  Service         │               │
│  │  (Next.js)       │        │  (Bun)           │               │
│  │  Port: 3000      │        │  Port: 3000      │               │
│  │  FREE            │        │  FREE            │               │
│  │  ⚠️ Spin down    │        │  ⚠️ Spin down    │               │
│  │  após 15min      │        │  após 15min      │               │
│  └──────────────────┘        └──────────────────┘               │
│                                                                   │
│  ⏱️ 750 horas/mês por serviço (suficiente para 1 serviço 24/7)  │
│  🚀 Cold start: 30-60s                                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐        ┌──────────────────┐               │
│  │  MongoDB Atlas   │        │  Railway.app     │               │
│  │  (Free Tier)     │        │  (Meilisearch)   │               │
│  │  512MB           │        │  $5/mês          │               │
│  └──────────────────┘        └──────────────────┘               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EMAIL ROUTING                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Emails externos ───▶ Cloudflare Worker ───▶ Backend Webhook    │
│  (mediavid.site)      (Gratuito)              (POST /webhook)    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Serviços Necessários

### 1. Backend Web Service (Render) - **PRIORITÁRIO**
- **Tipo**: Web Service
- **Repositório**: Link para o GitHub (branch: main)
- **Root Directory**: `backend`
- **Build Command**: `curl -fsSL https://bun.sh/install | bash && export PATH=$HOME/.bun/bin:$PATH && bun install`
- **Start Command**: `$HOME/.bun/bin/bun src/server.ts`
- **Plano**: **FREE** (750 horas/mês)
- ⚠️ **Limitação**: Spin down após 15min inatividade
- ✅ **Solução**: Usar cron-job.org gratuito para manter acordado

### 2. Frontend Web Service (Render) - **OPCIONAL**

**Opção A - Render Free** (Recomendado apenas para teste):
- **Tipo**: Web Service
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plano**: **FREE** (mas consome 750h/mês)
- ⚠️ **Problema**: 2 serviços free = apenas 31 dias de 1 serviço ativo

**Opção B - Vercel** (RECOMENDADO para Free Tier):
- **Plataforma**: Vercel (gratuito)
- **Build**: Automático (Next.js nativo)
- **Deploy**: `vercel --prod`
- **Custo**: $0
- ✅ **Vantagem**: Não consome horas do Render

**Opção C - Cloudflare Pages** (Alternativa):
- **Plataforma**: Cloudflare Pages (gratuito)
- **Build**: Automático
- **Deploy**: Git push
- **Custo**: $0

### 3. MongoDB (Atlas - Externo)
- **Provider**: MongoDB Atlas
- **Tier**: M0 (Free, 512MB)
- **Região**: Escolher próxima ao Render (ex: us-east-1)
- **URL**: `mongodb+srv://user:pass@cluster.mongodb.net/tempmail`

### 4. Redis (Render Managed)
- **Tipo**: Redis Instance
- **Plano**: Starter ($10/mês, 256MB)
- **OU Alternativa**: Upstash Redis (Free tier disponível)

### 5. Meilisearch (Railway/Outro)
- **Provider**: Railway.app ou Meilisearch Cloud
- **Plano**: $5/mês (Railway) ou $0.02/hora (Meilisearch Cloud)
- **Alternativa**: Self-hosted no Render (Web Service adicional)

### 6. ~~Servidor SMTP~~ → **Cloudflare Email Routing**
- **Problema**: Render não permite porta 2525
- **Solução**: Usar Cloudflare Email Routing + Worker + Webhook
- **Custo**: Gratuito

---

## ⚠️ IMPORTANTE: Limitações do Free Tier

### Cálculo de Horas Render Free
- **750 horas/mês por serviço**
- 1 mês = ~730 horas
- **Backend 24/7 = 730h ✅** (cabe em 1 free service)
- **Frontend 24/7 = 730h ❌** (não cabe junto com backend)

### Estratégias para Free Tier

#### Estratégia 1: Backend no Render + Frontend no Vercel (RECOMENDADA)
```
✅ Backend Render Free (750h) = Sempre ativo com cron
✅ Frontend Vercel Free = Ilimitado
✅ MongoDB Atlas Free = 512MB
✅ Upstash Redis Free = 10k comandos/dia
✅ Meilisearch (opcional) = Desabilitar ou self-host
💰 CUSTO TOTAL: $0/mês
```

#### Estratégia 2: Tudo no Render com Spin Down (Não Recomendada)
```
⚠️ Backend Render Free = Spin down após 15min
⚠️ Frontend Render Free = Spin down após 15min
❌ Cold start de 30-60s em cada acesso
❌ Não é viável para uso real
```

#### Estratégia 3: Backend Sempre Ativo (Com Cron Gratuito)
```
✅ Backend Render Free + Cron-job.org (grátis)
✅ Ping a cada 14 minutos = Nunca dorme
✅ 750h/mês suficiente para 1 serviço
✅ Frontend no Vercel/Cloudflare Pages
💰 CUSTO TOTAL: $0/mês
```

---

## 📝 Plano de Deploy Passo a Passo

### Fase 0: Configurar Keep-Alive Gratuito (Para Free Tier)

#### 0.1 Criar Conta no Cron-Job.org

1. Acesse [cron-job.org](https://cron-job.org)
2. Criar conta gratuita
3. **Create Cronjob**:
   - **Title**: Keep TempMail Backend Alive
   - **Address**: `https://tempmail-backend.onrender.com/health`
   - **Schedule**: Every 14 minutes (*/14 * * * *)
   - **Notifications**: Enabled (email se falhar)

**Alternativas Gratuitas**:
- [UptimeRobot.com](https://uptimerobot.com) - 50 monitores grátis, ping a cada 5min
- [Freshping.io](https://freshping.io) - Ilimitado, ping a cada 1min
- [Hetrix Tools](https://hetrixtools.com) - 15 monitores, ping a cada 5min

#### 0.2 Configurar Backend para Health Check

O backend já tem rota `/health`, mas vamos melhorar:

```typescript
// backend/src/router.ts
if (pathname === '/health' || pathname === '/api/health') {
  return addCorsHeaders(
    Response.json({ 
      status: 'ok', 
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      keepAlive: true // Indicador de keep-alive
    }),
    origin
  );
}
```

### Fase 1: Preparação do Código

#### 1.1 Ajustar Backend para Produção

**Criar arquivo**: `backend/.env.example`
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/tempmail

# Redis
REDIS_URL=redis://red-xxx.render.com:6379

# Meilisearch
MEILISEARCH_HOST=https://meilisearch-xxx.railway.app
MEILISEARCH_MASTER_KEY=your-master-key

# Server
PORT=3000
NODE_ENV=production

# Email
EMAIL_WEBHOOK_SECRET=random-secret-key-here
DEFAULT_MAILBOX_TTL=3600000

# CORS
FRONTEND_URL=https://tempmail.onrender.com
```

#### 1.2 Modificar Backend para Webhook (sem SMTP)

**Arquivo**: `backend/src/server.ts`
- Remover inicialização do servidor SMTP
- Adicionar rota POST `/api/webhook/email` (já existe)

**Arquivo**: `backend/src/routes/webhook.routes.ts`
- Já implementado! ✅

#### 1.3 Adicionar Health Check Robusto

**Criar**: `backend/src/routes/health.routes.ts`
```typescript
export async function handleHealthCheck(): Promise<Response> {
  const checks = {
    status: 'ok',
    timestamp: new Date(),
    services: {
      mongodb: false,
      redis: false,
      meilisearch: false,
    },
  };

  try {
    // Test MongoDB
    const db = getDatabase();
    await db.admin().ping();
    checks.services.mongodb = true;
  } catch {}

  try {
    // Test Redis
    const redis = getRedisClient();
    await redis.ping();
    checks.services.redis = true;
  } catch {}

  try {
    // Test Meilisearch
    const client = getMeilisearchClient();
    await client.health();
    checks.services.meilisearch = true;
  } catch {}

  const allHealthy = Object.values(checks.services).every(v => v);
  return Response.json(checks, { 
    status: allHealthy ? 200 : 503 
  });
}
```

#### 1.4 Configurar Build no package.json

**Backend**: `backend/package.json`
```json
{
  "scripts": {
    "dev": "bun --watch src/server.ts",
    "build": "bun build src/server.ts --outdir=dist --target=bun",
    "start": "NODE_ENV=production bun src/server.ts",
    "test": "bun test"
  }
}
```

**Frontend**: `frontend/package.json` (já configurado ✅)

### Fase 2: Configuração de Serviços Externos

#### 2.1 MongoDB Atlas

1. Criar conta em [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Criar cluster M0 (Free)
3. Criar usuário de banco de dados
4. Whitelist IP: `0.0.0.0/0` (permitir todas as IPs do Render)
5. Copiar connection string

#### 2.2 Redis (Upstash - Recomendado)

1. Criar conta em [upstash.com](https://upstash.com)
2. Criar Redis database (Free tier: 10,000 comandos/dia)
3. Copiar `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`

**Modificar**: `backend/src/config/redis.ts`
```typescript
import { Redis } from '@upstash/redis';

export function getRedisClient() {
  if (process.env.UPSTASH_REDIS_REST_URL) {
    // Upstash (produção)
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  } else {
    // Redis normal (desenvolvimento)
    return new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
}
```

**Instalar**: `bun add @upstash/redis`

#### 2.3 Meilisearch (Railway)

1. Criar conta em [railway.app](https://railway.app)
2. New Project → Deploy Meilisearch
3. Configurar variável `MEILI_MASTER_KEY`
4. Expor serviço (gerar URL pública)
5. Copiar URL e Master Key

**Alternativa**: Meilisearch Cloud ($0.02/hora, ~$15/mês)

### Fase 3: Deploy no Render

#### 3.1 Criar Backend Web Service

1. Acesse [dashboard.render.com](https://dashboard.render.com)
2. **New → Web Service**
3. Conectar repositório GitHub
4. Configurações:
   - **Name**: `tempmail-backend`
   - **Region**: Oregon (US West) - mais barato
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Shell (Docker usa mais recursos)
   - **Build Command**:
     ```bash
     curl -fsSL https://bun.sh/install | bash && \
     export PATH=$HOME/.bun/bin:$PATH && \
     bun install
     ```
   - **Start Command**: 
     ```bash
     $HOME/.bun/bin/bun src/server.ts
     ```
   - **Plan**: **FREE** ⚠️
   - **Auto-Deploy**: Yes (redeploy on git push)
   - **Health Check Path**: `/health`

5. **Environment Variables** (criar todas):
   ```
   MONGODB_URI=mongodb+srv://...
   REDIS_URL=redis://... (ou UPSTASH_REDIS_REST_URL)
   MEILISEARCH_HOST=https://...
   MEILISEARCH_MASTER_KEY=...
   PORT=3000
   NODE_ENV=production
   FRONTEND_URL=https://tempmail-frontend.onrender.com
   EMAIL_WEBHOOK_SECRET=<gerar-senha-forte>
   DEFAULT_MAILBOX_TTL=3600000
   ```

6. Clicar **Create Web Service**

#### 3.2 Deploy Frontend (Recomendado: Vercel)

**OPÇÃO A: Vercel (RECOMENDADO para Free Tier)**

1. Acesse [vercel.com](https://vercel.com)
2. Fazer login com GitHub
3. **New Project** → Importar repositório
4. Configurações:
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (automático)
   - **Output Directory**: `.next` (automático)

5. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://tempmail-backend.onrender.com/api
   NEXT_PUBLIC_WS_URL=wss://tempmail-backend.onrender.com/ws
   ```

6. Clicar **Deploy**

7. Após deploy, copiar URL: `https://tempmail-xxxx.vercel.app`

**OPÇÃO B: Cloudflare Pages**

1. Acesse [pages.cloudflare.com](https://pages.cloudflare.com)
2. **Create a project** → Connect to Git
3. Selecionar repositório
4. Configurações:
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `cd frontend && npm install && npm run build`
   - **Build output directory**: `frontend/out`
   - **Root directory**: `/`

5. **Environment variables**: (mesmo da Vercel)

**OPÇÃO C: Render Free (NÃO RECOMENDADO)**

⚠️ Consome suas 750h/mês, deixando backend vulnerável a spin down

1. **New → Web Service**
2. Mesmo repositório GitHub
3. Configurações:
   - **Name**: `tempmail-frontend`
   - **Region**: Oregon (mesmo do backend)
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: **FREE**

4. **Environment Variables**: (mesmo da Vercel)

5. Clicar **Create Web Service**

#### 3.3 Configurar Cloudflare Worker

Seguir guia em `CLOUDFLARE_SETUP.md`, mas modificar o Worker:

**Cloudflare Worker** (`cloudflare-worker.js`):
```javascript
export default {
  async email(message, env, ctx) {
    const rawEmail = await streamToString(message.raw);
    
    // Enviar para webhook do backend
    const response = await fetch('https://tempmail-backend.onrender.com/api/webhook/cloudflare', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBHOOK_SECRET, // Configurar no Worker
      },
      body: JSON.stringify({
        to: message.to,
        from: message.from,
        raw: rawEmail,
      }),
    });

    if (response.ok) {
      console.log('Email enviado para backend');
    } else {
      console.error('Erro ao enviar email:', await response.text());
    }
  }
};

async function streamToString(stream) {
  const chunks = [];
  const reader = stream.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return new TextDecoder().decode(await new Blob(chunks).arrayBuffer());
}
```

**Configurar Secret no Worker**:
```bash
wrangler secret put WEBHOOK_SECRET
# Inserir o mesmo valor de EMAIL_WEBHOOK_SECRET do backend
```

### Fase 4: Configuração DNS

#### 4.1 Cloudflare DNS (Email Routing)
```
# MX Records (adicionados automaticamente pelo Email Routing)
MX  10  route1.mx.cloudflare.net
MX  20  route2.mx.cloudflare.net
MX  30  route3.mx.cloudflare.net

# SPF
TXT  v=spf1 include:_spf.mx.cloudflare.net ~all
```

#### 4.2 Domínio Customizado (Opcional)

**Frontend**: `tempmail.mediavid.site`
```
CNAME  tempmail  tempmail-frontend.onrender.com
```

**Backend**: `api.mediavid.site`
```
CNAME  api  tempmail-backend.onrender.com
```

No Render:
1. Settings → Custom Domain
2. Adicionar `tempmail.mediavid.site`
3. Seguir instruções de verificação

### Fase 5: Testes

#### 5.1 Testar Backend
```bash
# Health check
curl https://tempmail-backend.onrender.com/health

# Criar mailbox
curl -X POST https://tempmail-backend.onrender.com/api/mailbox/create \
  -H "Content-Type: application/json"
```

#### 5.2 Testar Frontend
- Acessar `https://tempmail-frontend.onrender.com`
- Criar mailbox
- Verificar se lista carrega

#### 5.3 Testar Recebimento de Email
```bash
# Enviar email de teste para: test@mediavid.site
# Verificar se aparece na mailbox
```

---

## 🚧 Dificuldades e Soluções

### 1. ❌ Servidor SMTP não funciona no Render

**Problema**: Render não permite bind em portas customizadas (2525)

**Solução**: 
- ✅ **Usar Cloudflare Email Routing + Worker**
  - Emails recebidos via Cloudflare
  - Worker envia para webhook do backend
  - Backend processa via HTTP (porta 3000)
  
**Implementação**:
- Modificar `backend/src/routes/webhook.routes.ts`
- Remover servidor SMTP do `server.ts`
- Criar rota POST `/api/webhook/cloudflare`

**Código já existe**: ✅ `handleCloudflareEmail()` em `webhook.routes.ts`

---

### 2. ⚠️ Bun não é oficialmente suportado

**Problema**: Render não tem runtime oficial para Bun

**Solução**: 
- Instalar Bun no build command
- Usar Dockerfile (alternativa mais robusta)

**Dockerfile** (criar em `backend/Dockerfile`):
```dockerfile
FROM oven/bun:1.0

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "src/server.ts"]
```

**No Render**:
- Environment → Docker
- Dockerfile Path: `backend/Dockerfile`

---

### 3. 💾 Anexos de Email (Storage)

**Problema**: Render usa **filesystem efêmero** (dados perdidos ao reiniciar)

**Solução**: 
- ✅ **Usar Cloudflare R2** (S3-compatible, $0.015/GB)
- ✅ **Usar AWS S3**
- ✅ **Usar Render Disks** ($0.25/GB/mês, persistente)

**Implementação**: Modificar `backend/src/utils/attachmentStorage.ts`

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function saveAttachment(buffer: Buffer, filename: string): Promise<string> {
  const key = `attachments/${Date.now()}-${filename}`;
  
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    Body: buffer,
  }));
  
  return key; // Salvar este path no MongoDB
}

export async function getAttachment(key: string): Promise<Buffer> {
  const response = await s3.send(new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }));
  
  return Buffer.from(await response.Body!.transformToByteArray());
}
```

**Instalar**: `bun add @aws-sdk/client-s3`

**Variáveis**:
```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tempmail-attachments
```

---

### 4. 🔄 WebSocket e Scaling

**Problema**: Render pode ter múltiplas instâncias (horizontal scaling)

**Solução**: 
- ✅ Usar **Redis Pub/Sub** para sincronizar WebSocket entre instâncias
- Modificar `websocket.service.ts`

```typescript
import { getRedisClient } from '../config/redis';

export class WebSocketService {
  private rooms = new Map<string, Set<WebSocket>>();
  private redisSubscriber: Redis;
  private redisPublisher: Redis;

  constructor() {
    this.redisSubscriber = getRedisClient();
    this.redisPublisher = getRedisClient();
    
    // Inscrever em eventos de outros servidores
    this.redisSubscriber.subscribe('ws:broadcast', (message) => {
      const { token, event } = JSON.parse(message);
      this.localBroadcast(token, event);
    });
  }

  broadcast(token: string, event: any) {
    // Publicar para outros servidores via Redis
    this.redisPublisher.publish('ws:broadcast', JSON.stringify({ token, event }));
    
    // Broadcast local
    this.localBroadcast(token, event);
  }
  
  private localBroadcast(token: string, event: any) {
    const clients = this.rooms.get(token);
    if (clients) {
      for (const client of clients) {
        client.send(JSON.stringify(event));
      }
    }
  }
}
```

---

### 5. � Desabilitar Meilisearch (Para Free Tier)

**Problema**: Meilisearch requer servidor dedicado ($5-15/mês)

**Solução**: Desabilitar busca avançada e usar busca simples do MongoDB

**Modificar**: `backend/src/config/meilisearch.ts`
```typescript
export function getMeilisearchClient() {
  // Desabilitar em produção free tier
  if (process.env.DISABLE_MEILISEARCH === 'true') {
    return null;
  }
  
  return new MeiliSearch({
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_MASTER_KEY,
  });
}

export async function setupMeilisearchIndexes() {
  if (process.env.DISABLE_MEILISEARCH === 'true') {
    console.log('⚠️  Meilisearch desabilitado (FREE TIER)');
    return;
  }
  // ... código existente
}
```

**Modificar**: `backend/src/routes/email.routes.ts`
```typescript
export async function handleSearchEmails(req: Request, token: string): Promise<Response> {
  // Fallback para busca simples se Meilisearch desabilitado
  if (process.env.DISABLE_MEILISEARCH === 'true') {
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    
    const mailbox = await mailboxService.getMailboxByToken(token);
    if (!mailbox) {
      return Response.json({ error: 'Mailbox not found' }, { status: 404 });
    }
    
    // Busca simples no MongoDB usando text index
    const db = getDatabase();
    const emails = await db.collection('emails')
      .find({
        mailboxId: mailbox._id,
        $or: [
          { subject: { $regex: query, $options: 'i' } },
          { from: { $regex: query, $options: 'i' } },
          { textBody: { $regex: query, $options: 'i' } },
        ]
      })
      .limit(20)
      .toArray();
    
    return Response.json({ results: emails });
  }
  
  // ... código existente com Meilisearch
}
```

**Adicionar variável de ambiente no Render**:
```
DISABLE_MEILISEARCH=true
```

**Criar índice de texto no MongoDB** (para busca simples):
```javascript
// Executar uma vez no MongoDB Atlas
db.emails.createIndex({
  subject: "text",
  from: "text",
  textBody: "text"
});
```

**Resultado**: Busca funcional sem custos extras, mas menos sofisticada.

---

### 6. �💰 Custos de Cold Start

**Problema**: Render free tier hiberna após inatividade (spin down)

**Solução**:
- ✅ Usar plano Starter ($7/mês) - sempre ativo
- ✅ Configurar cron job para manter acordado (render.yaml)

**render.yaml** (criar na raiz):
```yaml
services:
  - type: web
    name: tempmail-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    plan: starter
    healthCheckPath: /health
    
    envVars:
      - key: PORT
        value: 3000
      - key: NODE_ENV
        value: production
    
  - type: web
    name: tempmail-frontend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    plan: starter
    
    envVars:
      - key: NODE_ENV
        value: production

  - type: cron
    name: keep-alive
    schedule: "*/14 * * * *"  # A cada 14 minutos
    command: curl https://tempmail-backend.onrender.com/health
```

---

### 6. 🔐 Segurança do Webhook

**Problema**: Webhook público pode receber spam

**Solução**:
- ✅ Validar secret no header
- ✅ Validar origem (Cloudflare Worker IP ranges)
- ✅ Rate limiting

```typescript
// backend/src/routes/webhook.routes.ts
export async function handleCloudflareEmail(req: Request): Promise<Response> {
  // Validar secret
  const secret = req.headers.get('X-Webhook-Secret');
  if (secret !== process.env.EMAIL_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Validar Cloudflare IP (opcional)
  const ip = req.headers.get('CF-Connecting-IP');
  // ... validação de IP ranges do Cloudflare
  
  // Processar email
  // ...
}
```

---

### 7. 📊 Monitoramento e Logs

**Problema**: Difícil debugar sem logs centralizados

**Solução**:
- ✅ Usar logs do Render (Dashboard → Logs)
- ✅ Integrar com Sentry (erros)
- ✅ Integrar com LogTail (logs estruturados)

```typescript
// backend/src/config/monitoring.ts
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
}

export { Sentry };
```

**Instalar**: `bun add @sentry/node`

---

## 💰 Custos Estimados

### Opção 1: 100% Free Tier (RECOMENDADO para Aprendizado/MVP)

| Serviço | Plano | Custo Mensal |
|---------|-------|--------------|
| **Backend Web Service** | Starter | $7 |
| **Frontend Web Service** | Starter | $7 |
| **MongoDB Atlas** | M0 (Free) | $0 |
| **Upstash Redis** | Free Tier | $0 (até 10k comandos/dia) |
| **Meilisearch (Railway)** | Starter | $5 |
| **Cloudflare Email Routing** | Free | $0 |
| **Cloudflare R2 (Storage)** | Pay-as-you-go | ~$1 (100GB transferências) |
| **Domínio** | Existente | $0 |
| **TOTAL** | | **$20/mês** |

### Opção 2: Render com Managed Services

| Serviço | Plano | Custo Mensal |
|---------|-------|--------------|
| **Backend Web Service** | Starter | $7 |
| **Frontend Web Service** | Starter | $7 |
| **Redis (Render)** | Starter (256MB) | $10 |
| **PostgreSQL (Render)** | Starter (256MB) | $7 |
| **Meilisearch Cloud** | Basic | $15 |
| **Cloudflare** | Free | $0 |
| **TOTAL** | | **$46/mês** |

| Serviço | Plano | Custo Mensal |
|---------|-------|--------------|
| **Backend (Render)** | Free + Cron Keep-Alive | $0 |
| **Frontend (Vercel)** | Free (Hobby) | $0 |
| **MongoDB Atlas** | M0 (512MB) | $0 |
| **Upstash Redis** | Free (10k cmds/dia) | $0 |
| **Meilisearch** | ❌ Desabilitado* | $0 |
| **Cloudflare Email Routing** | Free | $0 |
| **Cloudflare Worker** | Free (100k req/dia) | $0 |
| **Cron-Job.org** | Free (ping service) | $0 |
| **TOTAL** | | **$0/mês** |

**Características do Free Tier**:
- ✅ Backend sempre ativo (com cron keep-alive)
- ✅ Frontend serverless (Vercel = sem cold start)
- ✅ Banco de dados persistente (MongoDB Atlas)
- ✅ Cache funcional (Upstash 10k/dia é suficiente)
- ✅ Emails funcionando (Cloudflare Email Routing)
- ⚠️ Sem busca avançada (Meilisearch desabilitado)
- ⚠️ Performance compartilhada (mas aceitável)
- ⚠️ Limites de requests (Vercel: 100GB bandwidth/mês)

**\*Alternativas para Busca**:
- Busca simples no MongoDB (regex, text indexes)
- Meilisearch self-hosted (consumiria 750h do Render)
- Atualizar para Railway ($5/mês) apenas para Meilisearch

### Opção 2: Free Tier Otimizado + Busca ($5/mês)

| Serviço | Plano | Custo Mensal |
|---------|-------|--------------|
| **Backend (Render)** | Free + Cron | $0 |
| **Frontend (Vercel)** | Free | $0 |
| **MongoDB Atlas** | M0 | $0 |
| **Upstash Redis** | Free | $0 |
| **Meilisearch (Railway)** | Starter | $5 |
| **Cloudflare** | Free | $0 |
| **TOTAL** | | **$5/mês** |

### Opção 3: Render Completo + Serviços Externos

---

## 🔄 Alternativas ao Render

### 1. Railway.app
**Prós**: 
- Suporta Bun nativamente
- Filesystem persistente
- Melhor para WebSocket
- $5 crédito inicial

**Contras**: 
- Mais caro ($5-20/mês por serviço)
- Menos documentação

**Custo estimado**: $15-30/mês

---

### 2. Fly.io
**Prós**: 
- Permite portas customizadas (SMTP funcionaria!)
- Bom para WebSocket
- Dockerfile nativo
- Global edge network

**Contras**: 
- Configuração mais complexa
- Requer Dockerfile

**Custo estimado**: $10-25/mês

---

### 3. DigitalOcean App Platform
**Prós**: 
- Simples
- Preços fixos
- Bom suporte

**Contras**: 
- Não suporta Bun
- Sem porta customizada (SMTP não funciona)

**Custo estimado**: $12-25/mês

---

### 4. VPS (DigitalOcean Droplet / Linode)
**Prós**: 
- Controle total (SMTP funcionaria!)
- Mais barato para múltiplos serviços
- Pode usar Docker Compose direto

**Contras**: 
- Requer gerenciamento (SSH, security, updates)
- Não é PaaS (mais trabalho)

**Custo estimado**: $6-12/mês (1 droplet)

**Recomendado para**: Quem tem experiência com servidores

---

### 5. AWS / Google Cloud (Overkill)
**Prós**: 
- Máxima escalabilidade
- Todos os serviços disponíveis

**Contras**: 
- Complexidade extrema
- Custos imprevisíveis
- Overkill para este projeto

**Não recomendado** para projetos pequenos.

---

## ✅ Checklist Final

### Pré-Deploy
- [ ] Código no GitHub (repositório público ou privado)
- [ ] `.env.example` criado (não commitar `.env`)
- [ ] Dockerfile criado (opcional, mas recomendado)
- [ ] render.yaml criado (opcional)
- [ ] SMTP removido do backend
- [ ] Webhook implementado
- [ ] Storage migrado para R2/S3 (se usar anexos)
- [ ] Health check implementado
- [ ] CORS configurado com domínio correto

### Serviços Externos
- [ ] MongoDB Atlas criado e configurado
- [ ] Upstash Redis criado
- [ ] Meilisearch (Railway) criado
- [ ] Cloudflare Email Routing ativado
- [ ] Cloudflare Worker criado e deployado
- [ ] Cloudflare R2 bucket criado (se usar)

### Render
- [ ] Backend Web Service criado
- [ ] Frontend Web Service criado
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Health check passando
- [ ] Logs sem erros críticos
- [ ] Custom domain configurado (opcional)

### Cloudflare
- [ ] MX records configurados
- [ ] Email Routing ativado
- [ ] Worker deployado
- [ ] Secret WEBHOOK_SECRET configurado
- [ ] Teste de recebimento de email

### Testes
- [ ] Frontend carrega
- [ ] Criar mailbox funciona
- [ ] Lista de emails carrega
- [ ] Enviar email externo funciona
- [ ] Email aparece na caixa
- [ ] WebSocket conecta
- [ ] Notificações em tempo real funcionam
- [ ] Busca funciona
- [ ] Download de anexos funciona (se implementado)
- [ ] Expiração funciona (aguardar TTL)

### Monitoramento
- [ ] Sentry configurado (opcional)
- [ ] Logs sendo coletados
- [ ] Alertas configurados (opcional)

---

## 🎯 Recomendação Final

### Para Começar/MVP: **100% Free Tier** ⭐
- **Backend**: Render Free + Cron-Job.org
- **Frontend**: Vercel Free
- **Custos**: $0/mês
- **Viabilidade**: ✅ Totalmente funcional
- **Limitações**: Sem busca avançada (usar busca simples)
- **Ideal para**: Portfólio, testes, validação de ideia

### Para Projeto Pessoal: **Free + Busca ($5/mês)**
- Adicionar apenas Meilisearch (Railway)
- Backend e Frontend continuam free
- Experiência completa
- Custo muito baixo

### Para Uso Moderado: **Render Starter ($20/mês)**
- Backend e Frontend sempre ativos
- Performance consistente
- Sem preocupação com cold starts
- Ideal para: Side projects com usuários reais

### Para Produção Real: **Railway.app ou Fly.io ($15-30/mês)**
- Melhor suporte para Bun
- WebSocket mais estável
- Filesystem persistente
- Ideal para: Produto em crescimento

### Para Máximo Controle: **VPS ($6-12/mês)**
- Controle total
- SMTP nativo
- Docker Compose
- Ideal para: DevOps experientes

---

## 📚 Próximos Passos

1. **Decidir plataforma**: Render, Railway, Fly.io ou VPS
2. **Criar contas**: Serviços externos (MongoDB, Redis, etc.)
3. **Preparar código**: Remover SMTP, adicionar webhook
4. **Deploy backend**: Primeiro para testar API
5. **Deploy frontend**: Conectar ao backend
6. **Configurar Cloudflare**: Email Routing + Worker
7. **Testar**: Enviar email real
8. **Monitorar**: Verificar logs e performance
9. **Otimizar**: Ajustar baseado em métricas

---

**Boa sorte com o deploy! 🚀**

Se precisar de ajuda específica em alguma etapa, consulte a documentação oficial de cada plataforma.

# 📧 TempMail - Sistema de Email Temporário

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green.svg)

Sistema completo de email temporário descartável, similar ao [tuamaeaquelaursa.com](https://tuamaeaquelaursa.com). Permite criar endereços de email temporários que expiram automaticamente, ideal para testes, cadastros temporários e proteção de privacidade.

## 🎯 Funcionalidades

### Core
- ✅ **Criação de Mailboxes**: Gere emails aleatórios ou personalizados
- ✅ **Recebimento de Emails**: Servidor SMTP integrado (porta 2525)
- ✅ **Visualização em Tempo Real**: WebSocket para notificações instantâneas
- ✅ **Busca Avançada**: Powered by Meilisearch
- ✅ **Expiração Automática**: Mailboxes expiram após 1 hora (extensível)
- ✅ **Anexos**: Suporte completo para arquivos anexados

### Frontend
- 📱 **Design Responsivo**: Mobile-first com Tailwind CSS
- 🎨 **UI Moderna**: Componentes shadcn/ui (Radix UI)
- ⚡ **Server-Side Rendering**: React SSR com Bun
- 🔔 **Notificações Toast**: Feedback visual para todas as ações
- ✨ **Animações Suaves**: Transições fluidas com Tailwind

### Backend
- 🚀 **Performance**: Bun runtime (até 3x mais rápido que Node.js)
- 🔄 **Background Jobs**: BullMQ para limpeza e indexação
- 🔍 **Full-Text Search**: Meilisearch para busca instantânea
- 📊 **Banco de Dados**: MongoDB com índices otimizados
- 🔌 **WebSocket**: Atualizações em tempo real

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │  React SSR + Tailwind + shadcn/ui
│   (Bun Server)  │  Porta: 5173
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  REST API + WebSocket
│   (Bun Server)  │  Porta: 3000
└────────┬────────┘
         │
    ┌────┴────┬────────┬──────────┐
    ▼         ▼        ▼          ▼
┌────────┐ ┌─────┐ ┌────────┐ ┌──────────┐
│MongoDB │ │Redis│ │Meili   │ │SMTP      │
│:27017  │ │:6379│ │search  │ │Server    │
│        │ │     │ │:7700   │ │:2525     │
└────────┘ └─────┘ └────────┘ └──────────┘
```

## 📋 Pré-requisitos

- **Bun** v1.0.0 ou superior ([Instalar Bun](https://bun.sh))
- **Docker** e **Docker Compose** (para serviços)
- **Git** (para clonar o repositório)

### Instalação do Bun (Windows)

```powershell
# PowerShell (Administrador)
powershell -c "irm bun.sh/install.ps1 | iex"
```

### Instalação do Docker Desktop

Baixe e instale: [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/)

## 🚀 Instalação e Configuração

### 1. Clone o Repositório

```bash
git clone <seu-repositorio>
cd email
```

### 2. Inicie os Serviços com Docker

```bash
docker-compose up -d
```

Isso irá iniciar:
- **MongoDB** (porta 27017)
- **Redis** (porta 6379)
- **Meilisearch** (porta 7700)

Verifique se os serviços estão rodando:
```bash
docker-compose ps
```

### 3. Configure o Backend

```bash
cd backend

# Instale as dependências
bun install

# Inicie o servidor em modo desenvolvimento
bun run dev
```

O backend estará disponível em: `http://localhost:3000`

### 4. Configure o Frontend

Abra um novo terminal:

```bash
cd frontend

# Instale as dependências
bun install

# Inicie o servidor em modo desenvolvimento
bun run dev
```

O frontend estará disponível em: `http://localhost:5173`

## 🎮 Como Usar

### 1. Acesse a Aplicação

Abra seu navegador e acesse: `http://localhost:5173`

### 2. Crie uma Mailbox

- **Email Aleatório**: Clique em "Gerar Email Aleatório" - um email com prefixo aleatório será criado
- **Email Personalizado**: Digite um nome de usuário (3-20 caracteres) e clique em "Criar Email"
- **Acesso Direto**: Digite a URL `http://localhost:5173/mailbox/seunome` - uma mailbox será criada automaticamente

**Importante**: O prefixo do email sempre será convertido para minúsculas. Por exemplo:
- `http://localhost:5173/mailbox/ABC123` → cria/acessa `abc123@tempmail.local`
- `http://localhost:5173/mailbox/meuEmail` → cria/acessa `meuemail@tempmail.local`

### 3. Receba Emails

Use o endereço gerado para receber emails. Você pode testar enviando emails para o servidor SMTP local:

```bash
# Usando telnet (exemplo)
telnet localhost 2525
EHLO localhost
MAIL FROM: <sender@example.com>
RCPT TO: <seu-email@tempmail.local>
DATA
Subject: Teste

Conteudo do email
.
QUIT
```

### 4. Visualize e Gerencie

- 📧 Veja emails recebidos em tempo real
- 🔍 Use a busca para encontrar emails específicos
- 🕐 Estenda o tempo de vida da mailbox (botão "Estender")
- 🗑️ Delete a mailbox quando não precisar mais

## 🛠️ Estrutura do Projeto

```
email/
├── backend/
│   ├── src/
│   │   ├── config/          # Configurações (MongoDB, Redis, Meilisearch, SMTP)
│   │   ├── models/          # Modelos de dados (Email, TempMailbox)
│   │   ├── services/        # Lógica de negócio
│   │   ├── routes/          # Rotas da API
│   │   ├── middleware/      # Middlewares (CORS, errorHandler)
│   │   ├── jobs/            # Background jobs (cleanup, indexer)
│   │   ├── utils/           # Utilidades
│   │   ├── server.ts        # Servidor principal
│   │   └── router.ts        # Configuração de rotas
│   ├── tests/
│   │   ├── unit/            # Testes unitários
│   │   └── integration/     # Testes de integração
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   │   ├── ui/          # Componentes base (shadcn/ui)
│   │   │   ├── EmailList.tsx
│   │   │   ├── EmailViewer.tsx
│   │   │   ├── EmailGenerator.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ...
│   │   ├── pages/           # Páginas (Home, Mailbox)
│   │   ├── services/        # API Client, WebSocket
│   │   ├── stores/          # Zustand stores
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utilidades e formatadores
│   │   ├── styles/          # CSS global
│   │   ├── App.tsx          # Componente raiz
│   │   ├── client.tsx       # Entry point cliente
│   │   └── server.tsx       # Entry point SSR
│   ├── public/              # Assets estáticos
│   ├── index.html           # Template HTML
│   └── package.json
│
├── docker-compose.yml       # Configuração Docker
├── README.md                # Este arquivo
└── desenvolvimento.MD       # Documentação de desenvolvimento
```

## 🧪 Executar Testes

### Backend

```bash
cd backend

# Executar todos os testes
bun test

# Executar testes unitários
bun test tests/unit

# Executar testes de integração (requer serviços rodando)
bun test tests/integration

# Modo watch
bun test --watch
```

### Cobertura de Testes

- ✅ Testes unitários: `emailParser`, `emailGenerator`, `validation`
- ✅ Testes de integração: API endpoints, banco de dados
- 📊 Cobertura: ~85% do código backend

## 📡 API Endpoints

### Mailbox

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/mailbox` | Criar nova mailbox |
| GET | `/api/mailbox/:token` | Obter dados da mailbox |
| PUT | `/api/mailbox/:token/extend` | Estender tempo de vida |
| DELETE | `/api/mailbox/:token` | Deletar mailbox |

### Emails

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/mailbox/:token/emails` | Listar emails |
| GET | `/api/mailbox/:token/emails/:id` | Obter email específico |
| GET | `/api/mailbox/:token/emails/:id/attachments/:filename` | Download de anexo |
| GET | `/api/search?token=:token&q=:query` | Buscar emails |

### WebSocket

```
ws://localhost:3000/ws/mailbox/:token
```

Mensagens:
- `{ type: 'connected', message: '...' }` - Conexão estabelecida
- `{ type: 'new_email' }` - Novo email recebido

## ⚙️ Configuração Avançada

### Variáveis de Ambiente

Crie arquivos `.env` (opcional - valores padrão estão configurados no código):

**backend/.env**
```env
MONGODB_URI=mongodb://localhost:27017/tempmail
REDIS_URL=redis://localhost:6379
MEILISEARCH_URL=http://localhost:7700
SMTP_PORT=2525
API_PORT=3000
DOMAIN=tempmail.com
```

**frontend/.env**
```env
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
PORT=3001
```

### Ajustar TTL (Time To Live)

Edite `backend/src/services/mailbox.service.ts`:

```typescript
const expiresAt = new Date(Date.now() + 3600000); // 1 hora (padrão)
// Para 2 horas:
const expiresAt = new Date(Date.now() + 7200000);
```

### Configurar Background Jobs

Edite `backend/src/jobs/cleanup.job.ts`:

```typescript
// Executar limpeza a cada 10 minutos (padrão)
repeat: { pattern: '*/10 * * * *' }

// Para executar a cada 5 minutos:
repeat: { pattern: '*/5 * * * *' }
```

## 🐳 Docker Compose

### Comandos Úteis

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Parar e remover volumes (limpa dados)
docker-compose down -v

# Reiniciar serviço específico
docker-compose restart mongodb
```

### Acessar MongoDB

```bash
# Via MongoDB Compass
mongodb://localhost:27017

# Via CLI
docker exec -it email-mongodb-1 mongosh
```

### Acessar Meilisearch Dashboard

```
http://localhost:7700
```

## 🔧 Troubleshooting

### Backend não inicia

1. Verifique se os serviços Docker estão rodando:
   ```bash
   docker-compose ps
   ```

2. Verifique as portas:
   ```bash
   netstat -ano | findstr "27017 6379 7700"
   ```

3. Veja os logs do backend:
   ```bash
   cd backend
   bun run dev
   ```

### Frontend não carrega

1. Limpe o cache do Bun:
   ```bash
   rm -rf node_modules
   bun install
   ```

2. Verifique se o backend está rodando:
   ```bash
   curl http://localhost:3000/api/mailbox
   ```

### WebSocket não conecta

1. Verifique se o backend está rodando na porta 3000
2. Abra o console do navegador (F12) e veja erros
3. Teste a conexão WebSocket:
   ```javascript
   const ws = new WebSocket('ws://localhost:3000/ws/mailbox/test');
   ws.onopen = () => console.log('Conectado!');
   ws.onerror = (e) => console.error('Erro:', e);
   ```

### Emails não aparecem

1. Verifique se o servidor SMTP está rodando:
   ```bash
   telnet localhost 2525
   ```

2. Veja logs do backend para erros SMTP

3. Confirme que o Meilisearch está indexando:
   ```bash
   curl http://localhost:7700/indexes
   ```

## 🚀 Deploy para Produção

### Backend

```bash
cd backend
bun run build
bun run start
```

### Frontend

```bash
cd frontend
bun run build
# Servir com Bun ou Nginx
```

### Recomendações

- Use variáveis de ambiente para configurações sensíveis
- Configure reverse proxy (Nginx) para HTTPS
- Use MongoDB Atlas ou serviço gerenciado
- Configure Redis Cloud para cache distribuído
- Use CDN para assets estáticos
- Configure rate limiting para API
- Implemente monitoramento (Sentry, DataDog)

## 📝 Scripts Disponíveis

### Backend

```json
{
  "dev": "bun --watch src/server.ts",      // Desenvolvimento
  "test": "bun test",                       // Testes
  "build": "bun build src/server.ts --outdir=dist --target=bun",
  "start": "bun dist/server.js"             // Produção
}
```

### Frontend

```json
{
  "dev": "bun run server.tsx",              // Desenvolvimento
  "build": "bun build ./src/client.tsx --outdir=dist/public",
  "preview": "bun run dist/server.js"       // Preview produção
}
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

### Padrões de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [Bun](https://bun.sh) - Runtime JavaScript ultrarrápido
- [React](https://react.dev) - Biblioteca UI
- [shadcn/ui](https://ui.shadcn.com) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [MongoDB](https://www.mongodb.com) - Banco de dados
- [Meilisearch](https://www.meilisearch.com) - Motor de busca
- [BullMQ](https://bullmq.io) - Processamento de filas

## 📧 Contato

Para dúvidas ou sugestões, abra uma [issue](https://github.com/seu-usuario/email/issues).

---

**Desenvolvido com ❤️ usando Bun + React + TypeScript**

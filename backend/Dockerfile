# ========================================
# Dockerfile para Backend com Node.js
# (Usa Debian slim para melhor compatibilidade SSL)
# ========================================

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Instalar OpenSSL e certificados CA
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Copiar package files
COPY package.json ./
COPY tsconfig.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm install

# Copiar código fonte
COPY src ./src

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Instalar OpenSSL, certificados CA e atualizar
RUN apt-get update && apt-get install -y \
    ca-certificates \
    openssl \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copiar apenas package.json e package-lock.json (se existir)
COPY package.json ./

# Instalar apenas production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copiar código compilado do stage anterior
COPY --from=builder /app/dist ./dist

# Variáveis de ambiente (defaults)
ENV NODE_ENV=production \
    PORT=3000

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de start
CMD ["node", "dist/server.js"]

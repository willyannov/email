# Build stage
FROM oven/bun:1.1.38-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package.json ./

# Instalar dependências
RUN bun install --frozen-lockfile

# Copiar código fonte
COPY . .

# Build (se necessário)
# RUN bun run build

# Production stage
FROM oven/bun:1.1.38-alpine

WORKDIR /app

# Copiar dependências instaladas
COPY --from=builder /app/node_modules ./node_modules

# Copiar código
COPY --from=builder /app .

# Expor porta
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD bun --eval "fetch('http://localhost:3000/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Comando de início
CMD ["bun", "run", "src/server.ts"]

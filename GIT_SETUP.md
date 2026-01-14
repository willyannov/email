# 🚀 Guia Rápido: Subir Projeto para GitHub

## ✅ Arquivos Já Configurados

- `.gitignore` - Atualizado com todas as exclusões necessárias
- `.env.example` - Template de variáveis de ambiente (será commitado)
- `.env` - Ignorado (não será commitado - SEGURANÇA)

## 📦 Preparação Local

### 1. Verificar o que será commitado

```powershell
git status
```

**Arquivos que SERÃO incluídos**:
- ✅ `README.md` (documentação principal)
- ✅ `RENDER_DEPLOY.md` (guia de deploy)
- ✅ `STATE_MACHINES.md` (diagramas)
- ✅ `CLOUDFLARE_SETUP.md` (configuração email)
- ✅ `desenvolvimento.MD` (planejamento)
- ✅ `iniciarprojeto.md` (instruções)
- ✅ `docker-compose.yml` (infraestrutura)
- ✅ `cloudflare-worker.js` (worker)
- ✅ `.env.example` (template)
- ✅ Todo código em `backend/` e `frontend/`

**Arquivos que NÃO serão incluídos** (ignorados):
- ❌ `.env` (credenciais sensíveis)
- ❌ `node_modules/` (dependências)
- ❌ `.vscode/` (configurações IDE)
- ❌ `logs/` (arquivos de log)
- ❌ `uploads/` (anexos de email)
- ❌ `dist/`, `build/`, `.next/` (arquivos compilados)
- ❌ Volumes do Docker (`mongo_data/`, etc.)

### 2. Limpar arquivos não rastreados (OPCIONAL)

```powershell
# Ver o que seria deletado (não deleta ainda)
git clean -n -d

# Se quiser deletar arquivos não rastreados
git clean -f -d
```

## 🔧 Criar Repositório no GitHub

### Via Web (Recomendado)

1. Acesse [github.com/new](https://github.com/new)
2. Configurações:
   - **Repository name**: `tempmail` ou `temp-email-service`
   - **Description**: `Sistema de email temporário com Next.js, Bun, MongoDB e WebSocket`
   - **Visibility**: Public ou Private
   - **❌ NÃO inicializar com README** (já temos)
   - **❌ NÃO adicionar .gitignore** (já temos)
   - **❌ NÃO adicionar license** (adicione depois se quiser)
3. Clicar **Create repository**

## 📤 Push Inicial

### Se já existe repositório local (.git)

```powershell
# Ver repositórios remotos atuais
git remote -v

# Remover remote antigo (se existir)
git remote remove origin

# Adicionar novo remote
git remote add origin https://github.com/SEU_USUARIO/tempmail.git

# Verificar branch atual
git branch

# Renomear para main (se estiver em master)
git branch -M main

# Ver status
git status

# Adicionar todos os arquivos
git add .

# Commit inicial
git commit -m "feat: initial commit - TempMail system with Next.js, Bun, and WebSocket"

# Push para GitHub
git push -u origin main
```

### Se NÃO existe repositório local

```powershell
# Inicializar Git
git init

# Configurar nome e email (se não configurado globalmente)
git config user.name "Seu Nome"
git config user.email "seu@email.com"

# Criar branch main
git checkout -b main

# Adicionar todos os arquivos
git add .

# Verificar o que será commitado
git status

# Commit inicial
git commit -m "feat: initial commit - TempMail system with Next.js, Bun, and WebSocket"

# Adicionar remote do GitHub
git remote add origin https://github.com/SEU_USUARIO/tempmail.git

# Push para GitHub
git push -u origin main
```

## 🔑 Autenticação GitHub

Se pedir senha, use **Personal Access Token** (PAT):

### Criar Token

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. **Generate new token (classic)**
3. Configurações:
   - **Note**: `TempMail Deploy`
   - **Expiration**: 90 days ou No expiration
   - **Scopes**: 
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)
4. Copiar token (salvar em local seguro!)

### Usar Token

```powershell
# Quando pedir senha, cole o token (não a senha do GitHub)
Username: seu_usuario
Password: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Ou configurar credenciais permanentes**:

```powershell
# Windows (Git Credential Manager)
git config --global credential.helper wincred

# Ou usar SSH (mais seguro)
# 1. Gerar chave SSH
ssh-keygen -t ed25519 -C "seu@email.com"

# 2. Adicionar ao ssh-agent
ssh-add ~/.ssh/id_ed25519

# 3. Copiar chave pública
Get-Content ~/.ssh/id_ed25519.pub | Set-Clipboard

# 4. Adicionar no GitHub: Settings → SSH and GPG keys → New SSH key
# 5. Usar remote SSH
git remote set-url origin git@github.com:SEU_USUARIO/tempmail.git
```

## 📝 Convenções de Commit (Recomendadas)

Use commits semânticos:

```bash
feat: adicionar nova funcionalidade
fix: corrigir bug
docs: atualizar documentação
style: formatação de código
refactor: refatoração de código
test: adicionar testes
chore: tarefas gerais (deps, config, etc.)
```

**Exemplos**:
```bash
git commit -m "feat: add real-time email notifications via WebSocket"
git commit -m "fix: resolve SMTP authentication issue"
git commit -m "docs: update deploy guide for Render"
git commit -m "chore: add missing dependencies to package.json"
```

## 🔍 Verificar Antes de Push

### Checklist

- [ ] `.env` NÃO está sendo commitado (verificar com `git status`)
- [ ] `node_modules/` NÃO está sendo commitado
- [ ] Arquivos de build (`.next/`, `dist/`) NÃO estão sendo commitados
- [ ] `.env.example` ESTÁ sendo commitado (template)
- [ ] `README.md` está atualizado
- [ ] Todos os `.md` de documentação estão incluídos

### Comandos de Verificação

```powershell
# Ver arquivos que serão commitados
git status

# Ver diff de mudanças
git diff

# Ver arquivos ignorados
git status --ignored

# Ver tamanho do repositório
git count-objects -vH
```

## 🚨 Problemas Comuns

### 1. `.env` foi commitado acidentalmente

```powershell
# Remover do histórico
git rm --cached .env

# Commit da remoção
git commit -m "chore: remove .env from tracking"

# Push
git push
```

### 2. Repositório muito grande (node_modules commitado)

```powershell
# Remover node_modules do histórico
git rm -r --cached node_modules/
git rm -r --cached frontend/node_modules/
git rm -r --cached backend/node_modules/

# Commit
git commit -m "chore: remove node_modules from tracking"

# Push
git push
```

### 3. Erro "remote origin already exists"

```powershell
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/tempmail.git
```

### 4. Erro "refusing to merge unrelated histories"

```powershell
git pull origin main --allow-unrelated-histories
```

## 📦 Próximos Passos Após Push

1. **Proteger branch main**:
   - GitHub → Settings → Branches → Add rule
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging

2. **Adicionar descrição do repositório**:
   - Editar descrição no GitHub
   - Adicionar topics: `nextjs`, `bun`, `mongodb`, `websocket`, `email`, `typescript`

3. **Adicionar badges ao README**:
   ```markdown
   ![License](https://img.shields.io/badge/license-MIT-blue.svg)
   ![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)
   ![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
   ```

4. **Configurar GitHub Actions** (CI/CD):
   - Adicionar `.github/workflows/ci.yml` depois

5. **Deploy**:
   - Seguir guia em `RENDER_DEPLOY.md`

## 🎉 Pronto!

Seu projeto está no GitHub e pronto para ser deployado seguindo o [RENDER_DEPLOY.md](RENDER_DEPLOY.md)!

**URL do Repositório**: `https://github.com/SEU_USUARIO/tempmail`

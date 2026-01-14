# Configuração Cloudflare Email Routing

Este guia explica como configurar o Cloudflare Email Routing para receber emails no seu domínio `mediavid.site` e processar no TempMail.

## 📋 Pré-requisitos

- Domínio `mediavid.site` configurado no Cloudflare
- Conta Cloudflare (plano Free funciona)
- Backend TempMail rodando (localmente ou em servidor público)

## 🔧 Passo 1: Adicionar Domínio ao Cloudflare

Se ainda não está no Cloudflare:

1. Acesse [dash.cloudflare.com](https://dash.cloudflare.com)
2. Clique em **"Add a Site"**
3. Digite `mediavid.site`
4. Escolha o plano **Free**
5. Cloudflare mostrará 2 nameservers, exemplo:
   ```
   emma.ns.cloudflare.com
   roan.ns.cloudflare.com
   ```

6. Vá ao seu **provedor de domínio** (onde comprou mediavid.site)
7. Procure por "Nameservers" ou "DNS Servers"
8. Altere para os nameservers da Cloudflare
9. Aguarde propagação (15min - 24h)

## 📧 Passo 2: Ativar Email Routing

1. No Cloudflare Dashboard, selecione `mediavid.site`
2. Menu lateral → **Email** → **Email Routing**
3. Clique em **"Get Started"** ou **"Enable Email Routing"**
4. Cloudflare configurará automaticamente os registros DNS:
   ```
   MX 10 route1.mx.cloudflare.net
   MX 20 route2.mx.cloudflare.net
   MX 30 route3.mx.cloudflare.net
   TXT "v=spf1 include:_spf.mx.cloudflare.net ~all"
   ```
5. Aguarde alguns minutos para propagação DNS

## 🔨 Passo 3: Criar Cloudflare Worker

### 3.1 Criar Worker

1. No Cloudflare Dashboard → **Workers & Pages**
2. Clique em **"Create Application"**
3. **"Create Worker"**
4. Nome: `tempmail-email-handler`
5. Clique em **"Deploy"**

### 3.2 Editar Código do Worker

1. Após criar, clique em **"Edit Code"**
2. Apague todo o código existente
3. Cole o conteúdo do arquivo `cloudflare-worker.js`
4. Clique em **"Save and Deploy"**

### 3.3 Configurar Variável de Ambiente

**Para desenvolvimento local:**

1. No Worker, vá em **Settings** → **Variables**
2. Adicione:
   - Nome: `API_URL`
   - Valor: `http://SEU_IP_PUBLICO:3000` (ex: `http://187.84.0.5:3000`)
   - Clique em **"Encrypt"** se for senha
3. Clique em **"Save and Deploy"**

**Para produção (recomendado):**

Use um túnel ou serviço como:
- **Cloudflare Tunnel** (grátis)
- **ngrok** (grátis até 1 túnel)
- **VPS/Cloud** (DigitalOcean, AWS, etc.)

## 🔄 Passo 4: Criar Rota de Email

1. No Cloudflare Dashboard → `mediavid.site` → **Email** → **Email Routing**
2. Vá na aba **"Routing Rules"** ou **"Custom Addresses"**
3. Clique em **"Create Address"** ou **"Create Rule"**
4. Configure:
   ```
   Endereço: *@mediavid.site (catch-all)
   Ação: Send to a Worker
   Worker: tempmail-email-handler
   ```
5. Clique em **"Save"**

## 🚀 Passo 5: Expor sua API (Apenas para Desenvolvimento)

### Opção A: Ngrok (Mais Fácil)

```powershell
# Instalar ngrok
choco install ngrok
# ou baixar de https://ngrok.com/download

# Expor porta 3000
ngrok http 3000
```

Copie a URL `https://xxxx-xxx-xxx-xxx-xxx.ngrok-free.app` e use como `API_URL` no Worker.

### Opção B: Cloudflare Tunnel (Recomendado)

```powershell
# Instalar cloudflared
winget install Cloudflare.cloudflared

# Criar túnel
cloudflared tunnel login
cloudflared tunnel create tempmail
cloudflared tunnel route dns tempmail api.mediavid.site
cloudflared tunnel run --url http://localhost:3000 tempmail
```

Use `https://api.mediavid.site` como `API_URL` no Worker.

### Opção C: Port Forwarding (Apenas se tiver IP fixo)

1. Acesse configurações do seu router (geralmente 192.168.1.1)
2. Procure "Port Forwarding" ou "Redirecionamento de Porta"
3. Adicione regra:
   - Porta externa: 3000
   - Porta interna: 3000
   - IP interno: [Seu IP local]
4. Use `http://187.84.0.5:3000` como `API_URL`

⚠️ **Atenção**: Expor porta 3000 diretamente não é seguro. Use HTTPS em produção.

## ✅ Passo 6: Testar

### 6.1 Criar Mailbox

1. Acesse http://localhost:5173
2. Crie um email: `teste@mediavid.site`
3. Copie o email criado

### 6.2 Enviar Email de Teste

Use qualquer serviço de email (Gmail, Outlook, etc.) e envie para `teste@mediavid.site`.

### 6.3 Verificar Recebimento

1. Acesse http://localhost:5173/mailbox/teste
2. O email deve aparecer em alguns segundos

### 6.4 Logs para Debug

**Cloudflare Worker Logs:**
1. Workers & Pages → tempmail-email-handler
2. Clique em **"Begin log stream"**
3. Envie um email de teste
4. Veja os logs em tempo real

**Backend Logs:**
```powershell
cd backend
# Os logs aparecerão no terminal onde está rodando
```

## 🐛 Solução de Problemas

### Email não chega

1. **Verifique DNS**: Use https://mxtoolbox.com/domain/mediavid.site
   - Deve mostrar 3 registros MX da Cloudflare
   
2. **Verifique Worker Logs**: 
   - Veja se o Worker está recebendo o email
   
3. **Verifique Backend**: 
   - Mailbox existe e está ativa?
   - Logs mostram requisição chegando?

### Worker retorna erro

1. **API_URL correta?**
   - Deve ser acessível publicamente
   - Teste: `curl http://SEU_IP:3000/api/health`

2. **CORS habilitado?**
   - O backend já tem CORS configurado

3. **Firewall bloqueando?**
   - Windows Defender pode bloquear conexões externas
   - Adicione exceção para a porta 3000

### Mailbox não encontrado

1. **Crie a mailbox ANTES** de enviar o email
2. Mailbox deve estar ativa (não expirada)
3. Email deve ser exatamente `usuario@mediavid.site`

## 📊 Monitoramento

### Cloudflare Analytics

1. Email Routing → Analytics
2. Veja quantos emails foram recebidos/processados

### Teste de Entrega

Envie email para: `teste@mediavid.site`

Se tudo estiver correto:
- ✅ Cloudflare aceita o email
- ✅ Worker processa e envia para API
- ✅ Backend salva no MongoDB
- ✅ Frontend mostra o email

## 🔒 Segurança em Produção

Para usar em produção:

1. **HTTPS obrigatório**: Use Cloudflare Tunnel ou VPS com SSL
2. **Autenticação no Webhook**: Adicione token secreto
3. **Rate Limiting**: Limite requisições por IP
4. **Validação de origem**: Verifique se request vem do Cloudflare

## 🎯 Próximos Passos

- [ ] Configurar domínio no Cloudflare
- [ ] Ativar Email Routing
- [ ] Criar Worker
- [ ] Expor API (ngrok ou Cloudflare Tunnel)
- [ ] Testar envio de email
- [ ] (Opcional) Deploy em VPS para produção

## 📚 Links Úteis

- [Cloudflare Email Routing Docs](https://developers.cloudflare.com/email-routing/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Ngrok Download](https://ngrok.com/download)
- [MX Toolbox](https://mxtoolbox.com/) - Testar DNS

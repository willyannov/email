/**
 * Cloudflare Email Worker
 * 
 * Este Worker recebe emails via Cloudflare Email Routing
 * e encaminha para sua API Ta Duro? Dorme!
 * 
 * Configuração:
 * 1. No Cloudflare Dashboard: Email → Email Routing → Email Workers
 * 2. Criar novo Worker e colar este código
 * 3. Configurar variável de ambiente: API_URL = https://seu-dominio.com
 * 4. Criar rota: *@mediavid.site → Este Worker
 */

export default {
  async email(message, env, ctx) {
    try {
      // URL da sua API (configure nas variáveis de ambiente)
      const apiUrl = env.API_URL || 'http://localhost:3000';
      const webhookUrl = `${apiUrl}/api/webhook/cloudflare-email`;

      // Extrair informações do email
      const rawEmail = await streamToString(message.raw);
      
      const emailData = {
        to: message.to,
        from: message.from,
        subject: message.headers.get('subject') || '(Sem assunto)',
        headers: Object.fromEntries(message.headers),
        content: {
          text: rawEmail,
          html: '', // Será parseado pelo backend
        },
      };

      console.log('📧 Recebendo email:', {
        to: message.to,
        from: message.from,
        subject: emailData.subject,
        apiUrl: webhookUrl,
      });

      // Enviar para sua API
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro ao enviar para API:', response.status, error);
        message.setReject(`Erro ao processar: ${response.status}`);
        return;
      }

      const result = await response.json();
      console.log('✅ Email processado:', result);

      // Importante: não fazer forward, apenas aceitar
      // O email já foi processado e salvo no banco
      
    } catch (error) {
      console.error('❌ Erro no Worker:', error.message, error.stack);
      message.setReject('Erro interno ao processar email');
    }
  },
};

// Helper para converter stream em string
async function streamToString(stream) {
  const chunks = [];
  const reader = stream.getReader();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Concatenar Uint8Arrays
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  // Converter para string
  return new TextDecoder('utf-8').decode(result);
}

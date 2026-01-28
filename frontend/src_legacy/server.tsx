import React from 'react';
import { renderToString } from 'react-dom/server';
import { App } from './App';

const server = Bun.serve({
  port: 5173,
  async fetch(req) {
    const url = new URL(req.url);
    
    // Serve static files
    if (url.pathname.startsWith('/dist/')) {
      const filePath = `./public${url.pathname}`;
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
    }
    
    // Read CSS file
    let cssContent = '';
    try {
      const cssFile = Bun.file('./public/dist/styles.css');
      if (await cssFile.exists()) {
        cssContent = await cssFile.text();
      }
    } catch (e) {
      console.error('CSS file not found, styles will not be loaded');
    }
    
    // Render HTML with current path
    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ta Duro? Dorme! - Sua Privacidade em Primeiro Lugar</title>
  <meta name="description" content="Crie um email temporário em segundos. Sem cadastro, sem rastreamento, 100% anônimo.">
  <style>${cssContent}</style>
</head>
<body>
  <div id="root">${renderToString(<App url={url.pathname} />)}</div>
  <script type="module" src="/dist/client.js"></script>
</body>
</html>`;
    
    // Serve HTML for all other routes
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
});

console.log(`Frontend server running on http://localhost:${server.port}`);

import {
  handleCreateMailbox,
  handleGetMailbox,
  handleExtendMailbox,
  handleDeleteMailbox,
} from './routes/mailbox.routes.js';
import {
  handleListEmails,
  handleGetEmail,
  handleDeleteEmail,
  handleMarkAsRead,
  handleSearchEmails,
  handleDownloadAttachment,
} from './routes/email.routes.js';
import { handleCloudflareEmail } from './routes/webhook.routes.js';
import { corsMiddleware, addCorsHeaders } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { WebSocketService } from './services/websocket.service.js';

export function createRouter(wsService?: WebSocketService) {
  return async function handleRequest(req: Request): Promise<Response> {
    const origin = req.headers.get('origin') || '*';
    try {
      const url = new URL(req.url);
      const { pathname } = url;
      const method = req.method;

      // Handle CORS preflight
      const corsResponse = corsMiddleware(req);
      if (corsResponse) {
        return corsResponse;
      }

      // Health check
      if (pathname === '/health' || pathname === '/api/health') {
        return addCorsHeaders(
          Response.json({ status: 'ok', timestamp: new Date() }),
          origin
        );
      }

      // Routes
      const match = pathname.match(/^\/api\/(.*)$/);
      if (!match) {
        return addCorsHeaders(
          Response.json({ error: 'Not Found' }, { status: 404 }),
          origin
        );
      }

      const route = match[1];

      // Mailbox routes
      if (route === 'mailbox/create' && method === 'POST') {
        const response = await handleCreateMailbox(req);
        return addCorsHeaders(response, origin);
      }

      const mailboxMatch = route.match(/^mailbox\/([^/]+)$/);
      if (mailboxMatch) {
        const token = mailboxMatch[1];

        if (method === 'GET') {
          const response = await handleGetMailbox(req, token);
          return addCorsHeaders(response, origin);
        }
        if (method === 'DELETE') {
          const response = await handleDeleteMailbox(req, token);
          return addCorsHeaders(response, origin);
        }
      }

      const extendMatch = route.match(/^mailbox\/([^/]+)\/extend$/);
      if (extendMatch && method === 'PATCH') {
        const token = extendMatch[1];
        const response = await handleExtendMailbox(req, token);
        return addCorsHeaders(response, origin);
      }

      // Email routes
      const emailsMatch = route.match(/^mailbox\/([^/]+)\/emails$/);
      if (emailsMatch && method === 'GET') {
        const token = emailsMatch[1];
        const response = await handleListEmails(req, token);
        return addCorsHeaders(response, origin);
      }

      // Search emails
      const searchMatch = route.match(/^mailbox\/([^/]+)\/emails\/search$/);
      if (searchMatch && method === 'GET') {
        const token = searchMatch[1];
        const response = await handleSearchEmails(req, token);
        return addCorsHeaders(response, origin);
      }

      const emailDetailMatch = route.match(/^mailbox\/([^/]+)\/emails\/([^/]+)$/);
      if (emailDetailMatch) {
        const [, token, emailId] = emailDetailMatch;

        if (method === 'GET') {
          const response = await handleGetEmail(req, token, emailId);
          return addCorsHeaders(response, origin);
        }
        if (method === 'DELETE') {
          const response = await handleDeleteEmail(req, token, emailId);
          return addCorsHeaders(response, origin);
        }
      }

      const emailReadMatch = route.match(/^mailbox\/([^/]+)\/emails\/([^/]+)\/read$/);
      if (emailReadMatch && method === 'PATCH') {
        const [, token, emailId] = emailReadMatch;
        const response = await handleMarkAsRead(req, token, emailId);
        return addCorsHeaders(response, origin);
      }

      // Download attachment
      const attachmentMatch = route.match(/^mailbox\/([^/]+)\/emails\/([^/]+)\/attachments\/([^/]+)$/);
      if (attachmentMatch && method === 'GET') {
        const [, token, emailId, attachmentIndex] = attachmentMatch;
        const response = await handleDownloadAttachment(req, token, emailId, attachmentIndex);
        return addCorsHeaders(response, origin);
      }

      // Cloudflare Email Webhook
      if (route === 'webhook/cloudflare-email' && method === 'POST') {
        const response = await handleCloudflareEmail(req, wsService);
        return addCorsHeaders(response, origin);
      }

      return addCorsHeaders(
        Response.json({ error: 'Not Found' }, { status: 404 }),
        origin
      );
    } catch (error: any) {
      return addCorsHeaders(errorHandler(error), origin);
    }
  };
}

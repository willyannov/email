type WebSocketMessage = {
  type: string;
  data?: any;
  message?: string;
};

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: MessageHandler[] = [];
  private isManualClose = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatIntervalMs = 25000;

  /**
   * Connect to WebSocket server
   */
  connect(token: string, onMessage?: MessageHandler): void {
    // Se já temos uma conexão ativa com o mesmo token, apenas adiciona o handler
    if (this.ws && this.token === token) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        if (onMessage && !this.messageHandlers.includes(onMessage)) {
          this.messageHandlers.push(onMessage);
        }
        return;
      }
    }

    // Se temos uma conexão com token diferente ou não está fechada, desconecta primeiro
    if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
      this.disconnect();
    }

    this.token = token;
    this.isManualClose = false;

    if (onMessage) {
      if (!this.messageHandlers.includes(onMessage)) {
        this.messageHandlers.push(onMessage);
      }
    }

    // Construir URL do WebSocket a partir da URL da API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace('/api', '');
    const wsUrl = `${wsProtocol}://${wsHost}/ws/mailbox/${token}`;
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          // Failed to parse WebSocket message
        }
      };

      this.ws.onerror = (error) => {
        // WebSocket error
      };

      this.ws.onclose = (event) => {
        this.stopHeartbeat();
        this.ws = null;
        
        // Try to reconnect if not manually closed
        if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
    } catch (error) {
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.token = null;
    this.reconnectAttempts = 0;
    this.messageHandlers = [];
  }

  /**
   * Send message to server
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Send ping to keep connection alive
   */
  ping(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Add message handler
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Remove message handler
   */
  offMessage(handler: MessageHandler): void {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Call all registered handlers
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        // Error in message handler
      }
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      if (this.token && !this.isManualClose) {
        this.connect(this.token);
      }
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.isManualClose && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ping();
      }
    }, this.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// Export class for testing or custom instances
export { WebSocketClient };

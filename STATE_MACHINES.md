# 🔄 Diagramas de Máquina de Estados - TempMail

## 📋 Índice
- [Frontend - Mailbox Store](#frontend---mailbox-store)
- [Frontend - WebSocket Connection](#frontend---websocket-connection)
- [Frontend - Email Viewer](#frontend---email-viewer)
- [Backend - Mailbox Lifecycle](#backend---mailbox-lifecycle)
- [Backend - Email Processing](#backend---email-processing)
- [Backend - SMTP Server](#backend---smtp-server)
- [Backend - WebSocket Service](#backend---websocket-service)

---

## Frontend - Mailbox Store

```mermaid
stateDiagram-v2
    [*] --> Idle: App Start
    
    Idle --> CreatingMailbox: User clicks "Create Mailbox"
    CreatingMailbox --> MailboxCreated: API Success
    CreatingMailbox --> Error: API Failure
    Error --> Idle: User retries
    
    MailboxCreated --> LoadingMailbox: Navigate to /{token}
    LoadingMailbox --> MailboxLoaded: Mailbox data fetched
    LoadingMailbox --> Error: Fetch failed
    
    MailboxLoaded --> ConnectingWebSocket: Auto-connect
    ConnectingWebSocket --> Connected: WS Connected
    ConnectingWebSocket --> MailboxLoaded: WS Failed (fallback to polling)
    
    Connected --> LoadingEmails: Fetch email list
    LoadingEmails --> EmailsLoaded: Emails fetched
    LoadingEmails --> Error: Fetch failed
    
    EmailsLoaded --> Idle_WS: Listening for events
    Idle_WS --> EmailsLoaded: New email event
    Idle_WS --> Idle_WS: Periodic refresh (5s)
    
    EmailsLoaded --> ViewingEmail: User clicks email
    ViewingEmail --> LoadingEmailDetail: Fetch full email
    LoadingEmailDetail --> EmailDetailLoaded: Detail fetched
    LoadingEmailDetail --> Error: Fetch failed
    
    EmailDetailLoaded --> ViewingEmail: Email rendered
    ViewingEmail --> EmailsLoaded: User closes email
    
    EmailsLoaded --> Searching: User types search query
    Searching --> SearchResults: Filtered results
    SearchResults --> EmailsLoaded: Clear search
    
    MailboxLoaded --> ExtendingTTL: User extends mailbox
    ExtendingTTL --> MailboxLoaded: Extension success
    ExtendingTTL --> Error: Extension failed
    
    MailboxLoaded --> DeletingMailbox: User deletes mailbox
    DeletingMailbox --> [*]: Deletion success
    DeletingMailbox --> Error: Deletion failed
    
    Error --> MailboxLoaded: Dismiss error
```

**Estados:**
- `Idle`: Nenhuma ação em andamento
- `CreatingMailbox`: POST /api/mailbox/create
- `MailboxCreated`: Token recebido, redirecionando
- `LoadingMailbox`: GET /api/mailbox/{token}
- `MailboxLoaded`: Dados da mailbox carregados
- `ConnectingWebSocket`: Estabelecendo conexão WS
- `Connected`: WebSocket ativo
- `LoadingEmails`: GET /api/mailbox/{token}/emails
- `EmailsLoaded`: Lista de emails em memória
- `ViewingEmail`: Email selecionado
- `LoadingEmailDetail`: GET /api/mailbox/{token}/emails/{id}
- `EmailDetailLoaded`: Detalhes completos carregados
- `Searching`: Filtrando emails localmente
- `SearchResults`: Resultados da busca exibidos
- `ExtendingTTL`: PATCH /api/mailbox/{token}/extend
- `DeletingMailbox`: DELETE /api/mailbox/{token}
- `Error`: Erro ocorreu, exibindo mensagem

---

## Frontend - WebSocket Connection

```mermaid
stateDiagram-v2
    [*] --> Disconnected: Initial State
    
    Disconnected --> Connecting: wsClient.connect(token)
    Connecting --> Connected: onopen event
    Connecting --> Failed: onerror / timeout
    
    Connected --> Listening: Ready to receive
    Listening --> ProcessingMessage: Message received
    ProcessingMessage --> Listening: Message handled
    
    Listening --> Reconnecting: Connection lost
    Failed --> Reconnecting: Auto-retry
    Reconnecting --> Connecting: Retry attempt
    Reconnecting --> Disconnected: Max retries exceeded
    
    Connected --> Disconnected: wsClient.disconnect()
    Listening --> Disconnected: Component unmount
    
    Disconnected --> [*]: Cleanup complete
```

**Eventos:**
- `onopen`: WebSocket conectado
- `onmessage`: Nova mensagem recebida
  - `type: "connected"` → Recarregar emails
  - `type: "new_email"` → Atualizar lista
- `onerror`: Erro de conexão
- `onclose`: Conexão fechada
- Auto-reconnect: 3 tentativas com backoff

---

## Frontend - Email Viewer

```mermaid
stateDiagram-v2
    [*] --> Empty: No email selected
    
    Empty --> Loading: Email selected from list
    Loading --> Loaded: Email detail fetched
    Loading --> Error: Fetch failed
    
    Loaded --> RenderingHTML: Has htmlBody
    Loaded --> RenderingText: Only textBody
    
    RenderingHTML --> Sanitizing: DOMPurify processing
    Sanitizing --> Rendered: Safe HTML displayed
    
    RenderingText --> Rendered: Plain text displayed
    
    Rendered --> ViewingAttachment: User clicks attachment
    ViewingAttachment --> Downloading: GET /api/.../attachments/{id}
    Downloading --> Downloaded: File downloaded
    Downloading --> Error: Download failed
    Downloaded --> Rendered: Back to email
    
    Rendered --> Deleting: User clicks delete
    Deleting --> Deleted: DELETE success
    Deleting --> Error: Delete failed
    Deleted --> Empty: Back to list
    
    Rendered --> Empty: User selects another email
    Error --> Rendered: Retry
```

**Estados:**
- `Empty`: Nenhum email selecionado (placeholder exibido)
- `Loading`: Buscando detalhes do email
- `Loaded`: Dados recebidos, processando
- `RenderingHTML`: Preparando HTML para exibição
- `Sanitizing`: Removendo scripts/XSS
- `RenderingText`: Formatando texto plano
- `Rendered`: Email totalmente exibido
- `ViewingAttachment`: Modal/preview de anexo
- `Downloading`: Download em progresso
- `Downloaded`: Arquivo salvo
- `Deleting`: Removendo email
- `Deleted`: Email removido com sucesso

---

## Backend - Mailbox Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Creating: POST /api/mailbox/create
    
    Creating --> ValidatingInput: Check customPrefix
    ValidatingInput --> GeneratingEmail: Prefix valid/random
    ValidatingInput --> Error: Invalid prefix
    
    GeneratingEmail --> CheckingAvailability: Query MongoDB
    CheckingAvailability --> Available: Not exists
    CheckingAvailability --> Error: Already taken
    
    Available --> GeneratingToken: Create access token
    GeneratingToken --> Saving: Insert to DB
    Saving --> Active: isActive: true
    Saving --> Error: DB error
    
    Active --> ReceivingEmails: SMTP accepts emails
    ReceivingEmails --> Active: Email saved
    
    Active --> Extending: PATCH /extend
    Extending --> Active: expiresAt updated
    Extending --> Error: Extension failed
    
    Active --> CheckingExpiration: Cleanup job runs
    CheckingExpiration --> Expired: expiresAt < now
    CheckingExpiration --> Active: Still valid
    
    Expired --> CleaningEmails: Delete all emails
    CleaningEmails --> CleaningAttachments: Delete files
    CleaningAttachments --> Deactivating: Set isActive: false
    Deactivating --> Inactive: Soft delete
    
    Active --> Deleting: DELETE /api/mailbox/{token}
    Deleting --> CleaningEmails: Manual deletion
    
    Inactive --> [*]: Permanently removed (optional)
    
    Error --> [*]: Return error response
```

**Estados:**
- `Creating`: Processando requisição de criação
- `ValidatingInput`: Zod validation
- `GeneratingEmail`: Criar endereço (random ou custom)
- `CheckingAvailability`: Verificar se já existe
- `Available`: Email disponível
- `GeneratingToken`: Criar token único (32 bytes hex)
- `Saving`: Inserir documento no MongoDB
- `Active`: Mailbox operacional (isActive: true)
- `ReceivingEmails`: Aceitando emails via SMTP
- `Extending`: Aumentando TTL
- `CheckingExpiration`: Verificação periódica (10min)
- `Expired`: TTL ultrapassado
- `CleaningEmails`: Deletando documentos da collection 'emails'
- `CleaningAttachments`: Removendo arquivos físicos
- `Deactivating`: Marcando isActive: false
- `Inactive`: Não aceita mais emails
- `Deleting`: Remoção manual pelo usuário

---

## Backend - Email Processing

```mermaid
stateDiagram-v2
    [*] --> Receiving: SMTP DATA command
    
    Receiving --> ParsingStream: mailparser.simpleParser()
    ParsingStream --> Parsed: Email object created
    ParsingStream --> Error: Parse failed
    
    Parsed --> ValidatingRecipient: Check each 'to' address
    ValidatingRecipient --> RecipientValid: Mailbox exists & active
    ValidatingRecipient --> RecipientInvalid: Not found or expired
    
    RecipientInvalid --> Error: Reject email
    
    RecipientValid --> ProcessingAttachments: Has attachments?
    RecipientValid --> BuildingDocument: No attachments
    
    ProcessingAttachments --> SavingFiles: Write to disk
    SavingFiles --> AttachmentsSaved: Files written
    SavingFiles --> Error: Write failed
    
    AttachmentsSaved --> BuildingDocument: Create Email object
    BuildingDocument --> SavingToDB: insertOne()
    SavingToDB --> Saved: Email in MongoDB
    SavingToDB --> Error: DB error
    
    Saved --> NotifyingWebSocket: wsService.broadcast()
    NotifyingWebSocket --> Notified: Clients updated
    
    Notified --> QueuingIndexing: indexerQueue.add()
    QueuingIndexing --> Queued: Job enqueued
    Queued --> [*]: Processing complete
    
    Queued --> Indexing: Worker picks job
    Indexing --> Indexed: Meilisearch updated
    Indexing --> Error: Index failed
    Indexed --> [*]: Searchable
    
    Error --> [*]: Return SMTP error code
```

**Estados:**
- `Receiving`: Recebendo stream de dados do SMTP
- `ParsingStream`: Convertendo raw email em objeto
- `Parsed`: Email parseado com sucesso
- `ValidatingRecipient`: Verificar se mailbox existe
- `RecipientValid`: Destinatário válido
- `RecipientInvalid`: Rejeitar email
- `ProcessingAttachments`: Detectar anexos
- `SavingFiles`: Gravar em `/uploads/{mailboxId}/{filename}`
- `AttachmentsSaved`: Arquivos persistidos
- `BuildingDocument`: Criar objeto Email
- `SavingToDB`: Inserir no MongoDB
- `Saved`: Email armazenado
- `NotifyingWebSocket`: Enviar evento para clientes conectados
- `Notified`: WebSocket broadcast enviado
- `QueuingIndexing`: Adicionar job BullMQ
- `Queued`: Job na fila
- `Indexing`: Worker processando
- `Indexed`: Email no Meilisearch

---

## Backend - SMTP Server

```mermaid
stateDiagram-v2
    [*] --> Listening: server.listen(2525)
    
    Listening --> ClientConnected: onConnect event
    ClientConnected --> AwaitingMAIL: EHLO received
    
    AwaitingMAIL --> ProcessingMAIL: MAIL FROM command
    ProcessingMAIL --> AwaitingRCPT: Sender accepted
    
    AwaitingRCPT --> ValidatingRCPT: RCPT TO command
    ValidatingRCPT --> CheckingMailbox: Validate recipient
    CheckingMailbox --> RecipientAccepted: Mailbox valid
    CheckingMailbox --> RecipientRejected: Mailbox not found
    
    RecipientRejected --> AwaitingRCPT: 550 Error
    RecipientAccepted --> AwaitingDATA: 250 OK
    
    AwaitingDATA --> ReceivingDATA: DATA command
    ReceivingDATA --> ProcessingEmail: Stream complete
    ProcessingEmail --> EmailProcessed: Email saved
    ProcessingEmail --> ProcessingError: Save failed
    
    EmailProcessed --> Completed: 250 Message accepted
    ProcessingError --> Completed: 550 Error
    
    Completed --> AwaitingMAIL: Ready for next email
    Completed --> Disconnecting: QUIT command
    
    ClientConnected --> Timeout: No activity (60s)
    Timeout --> Disconnecting: Close connection
    
    Disconnecting --> [*]: Connection closed
```

**Estados:**
- `Listening`: Aguardando conexões na porta 2525
- `ClientConnected`: Cliente SMTP conectado
- `AwaitingMAIL`: Esperando MAIL FROM
- `ProcessingMAIL`: Validando remetente
- `AwaitingRCPT`: Esperando RCPT TO
- `ValidatingRCPT`: Verificando destinatário
- `CheckingMailbox`: Query no MongoDB
- `RecipientAccepted`: Destinatário OK (250)
- `RecipientRejected`: Destinatário inválido (550)
- `AwaitingDATA`: Esperando DATA
- `ReceivingDATA`: Recebendo corpo do email
- `ProcessingEmail`: Parsear e salvar
- `EmailProcessed`: Sucesso
- `ProcessingError`: Erro ao processar
- `Completed`: Transação finalizada
- `Timeout`: Inatividade detectada
- `Disconnecting`: Encerrando conexão

---

## Backend - WebSocket Service

```mermaid
stateDiagram-v2
    [*] --> Ready: Service initialized
    
    Ready --> ClientConnecting: Upgrade request /ws/mailbox/{token}
    ClientConnecting --> Authenticating: Extract token from URL
    Authenticating --> Authenticated: Token valid
    Authenticating --> Rejected: Invalid token
    
    Rejected --> [*]: Connection refused
    
    Authenticated --> Subscribing: Add to room Map
    Subscribing --> Subscribed: Client in room
    
    Subscribed --> SendingConnected: Send 'connected' event
    SendingConnected --> Listening: Ready to receive events
    
    Listening --> BroadcastingNewEmail: Email received for mailbox
    BroadcastingNewEmail --> Listening: Event sent to all in room
    
    Listening --> ReceivingPing: Client sends ping
    ReceivingPing --> SendingPong: Respond with pong
    SendingPong --> Listening: Keep-alive maintained
    
    Listening --> ClientDisconnecting: onclose event
    ClientDisconnecting --> Unsubscribing: Remove from room
    Unsubscribing --> [*]: Cleanup complete
    
    Listening --> ConnectionError: onerror event
    ConnectionError --> ClientDisconnecting: Force disconnect
```

**Estados:**
- `Ready`: WebSocket service pronto
- `ClientConnecting`: Cliente solicitando upgrade
- `Authenticating`: Validar token no URL
- `Authenticated`: Token corresponde a mailbox válida
- `Rejected`: Token inválido ou expirado
- `Subscribing`: Adicionar à sala (`Map<token, Set<WebSocket>>`)
- `Subscribed`: Cliente registrado
- `SendingConnected`: Enviar confirmação de conexão
- `Listening`: Aguardando eventos
- `BroadcastingNewEmail`: Notificar todos clientes da sala
- `ReceivingPing`: Heartbeat do cliente
- `SendingPong`: Responder heartbeat
- `ClientDisconnecting`: Cliente desconectou
- `Unsubscribing`: Remover da sala
- `ConnectionError`: Erro de comunicação

---

## 🔄 Fluxo Completo: Recebimento de Email

```mermaid
sequenceDiagram
    participant External as Email Externo
    participant SMTP as SMTP Server
    participant Parser as Email Parser
    participant FS as File System
    participant DB as MongoDB
    participant WS as WebSocket Service
    participant Client as Frontend Client
    participant Queue as BullMQ
    participant Search as Meilisearch

    External->>SMTP: Enviar email (porta 2525)
    SMTP->>SMTP: RCPT TO: Validar destinatário
    SMTP->>DB: Query mailbox por endereço
    DB-->>SMTP: Mailbox encontrada (ativa)
    SMTP->>SMTP: 250 OK - Aceitar email
    
    External->>SMTP: DATA: Corpo do email
    SMTP->>Parser: Processar stream
    Parser-->>SMTP: Email parseado
    
    alt Tem anexos
        SMTP->>FS: Salvar anexos em /uploads
        FS-->>SMTP: Arquivos salvos
    end
    
    SMTP->>DB: insertOne(email)
    DB-->>SMTP: Email salvo (ObjectId)
    
    SMTP->>WS: broadcast("new_email", mailboxId)
    WS->>Client: Send evento via WebSocket
    Client->>Client: Atualizar lista de emails
    
    SMTP->>Queue: indexerQueue.add(emailId)
    Queue->>Search: Indexar email
    Search-->>Queue: Indexado
    
    SMTP->>External: 250 Message accepted
```

---

## 📊 Resumo dos Estados por Componente

| Componente | Total de Estados | Estados Principais |
|------------|------------------|-------------------|
| **Mailbox Store (Frontend)** | 15 | Idle, LoadingEmails, Connected, ViewingEmail |
| **WebSocket Client (Frontend)** | 6 | Disconnected, Connecting, Connected, Listening |
| **Email Viewer (Frontend)** | 10 | Empty, Loading, Rendered, Downloading |
| **Mailbox Lifecycle (Backend)** | 13 | Creating, Active, Expired, Inactive |
| **Email Processing (Backend)** | 14 | Receiving, Parsed, Saved, Indexed |
| **SMTP Server (Backend)** | 11 | Listening, ValidatingRCPT, ProcessingEmail |
| **WebSocket Service (Backend)** | 10 | Ready, Subscribed, Broadcasting |

---

## 🎯 Transições Críticas

### Alta Frequência
- `Listening → ProcessingMessage` (WebSocket Frontend)
- `ReceivingEmails → Active` (Mailbox Backend)
- `Listening → BroadcastingNewEmail` (WebSocket Backend)

### Alta Importância
- `CheckingMailbox → RecipientRejected` (SMTP - previne spam)
- `Active → Expired` (Cleanup - libera recursos)
- `Parsed → ValidatingRecipient` (Email Processing - segurança)

### Pontos de Falha
- `SavingToDB → Error` (MongoDB indisponível)
- `Connecting → Failed` (WebSocket não conecta)
- `Downloading → Error` (Anexo corrompido/não encontrado)

---

## 🔧 Melhorias Sugeridas

1. **Circuit Breaker**: Adicionar estado `CircuitOpen` para falhas repetidas
2. **Retry Logic**: Estado `Retrying` com backoff exponencial
3. **Rate Limiting**: Estado `RateLimited` para proteger API
4. **Health Checks**: Estado `Degraded` quando serviços externos falham
5. **Graceful Degradation**: Fallback para polling quando WebSocket falha

---

## 📝 Notas Técnicas

- **Frontend**: Utiliza Zustand para gerenciar estados complexos
- **Backend**: Estados são implícitos (async/await), não máquinas de estado explícitas
- **Transições assíncronas**: Maioria das transições envolve I/O (network, disk, database)
- **Idempotência**: Algumas operações (criação de mailbox) não são idempotentes
- **Consistência eventual**: WebSocket pode falhar, mas polling garante atualização

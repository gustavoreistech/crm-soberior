# 🏛️ Plano de Arquitetura — Soberior OS

## 1. Visão Geral

**Soberior OS** é um CRM B2B autônomo com ciclo completo: Prospecção → Auditoria → Fechamento → Onboarding → MRR.

### Stack Tecnológica

| Camada                  | Tecnologia                                                    |
| ----------------------- | ------------------------------------------------------------- |
| Frontend + Backend      | Next.js 14+ (App Router) + TypeScript                         |
| Estilização             | Tailwind CSS + Shadcn/ui                                      |
| Banco de Dados          | Google Sheets API (`google-spreadsheet`)                      |
| Armazenamento de Config | Google Sheets (aba "Configuracoes") + localStorage (fallback) |
| IA                      | DeepSeek API                                                  |
| WhatsApp                | Evolution API                                                 |
| Pagamentos              | Asaas Webhook                                                 |
| Automação               | n8n Webhook                                                   |
| Hospedagem              | Vercel (preparado)                                            |

---

## 2. Estrutura de Diretórios

```
crm-soberior/
├── .env.local                      # APENAS Google Sheets credentials (bootstrap)
├── .env.example                    # Template para documentação
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── src/
│   ├── app/
│   │   ├── layout.tsx              # RootLayout com providers globais
│   │   ├── page.tsx                # Dashboard / Kanban principal
│   │   ├── globals.css             # Estilos globais + variáveis CSS
│   │   │
│   │   ├── api/
│   │   │   ├── webhook/
│   │   │   │   ├── n8n/route.ts        # POST - Receber leads raspados
│   │   │   │   └── asaas/route.ts      # POST - Alertas de pagamento
│   │   │   ├── signature/
│   │   │   │   ├── generate-2fa/route.ts   # POST - Gerar código 2FA
│   │   │   │   └── validate-2fa/route.ts   # POST - Validar código 2FA
│   │   │   ├── ai/
│   │   │   │   └── enrich-lead/route.ts    # POST - DeepSeek enrichment
│   │   │   └── config/
│   │   │       └── route.ts               # GET/PUT - Gerenciar configurações
│   │   │
│   │   ├── leads/
│   │   │   └── new/page.tsx          # Formulário de entrada rápida
│   │   └── settings/
│   │       └── page.tsx              # Página de configuração das integrações
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx           # Sidebar de navegação
│   │   │   └── header.tsx            # Header com stats rápidos
│   │   ├── kanban/
│   │   │   ├── kanban-board.tsx      # Board principal (DnD container)
│   │   │   ├── kanban-column.tsx     # Coluna individual
│   │   │   ├── kanban-card.tsx       # Card de lead
│   │   │   └── lead-detail-modal.tsx # Modal de detalhes do lead
│   │   ├── ui/                       # Componentes Shadcn/ui
│   │   ├── forms/
│   │   │   └── lead-form.tsx         # Formulário de novo lead
│   │   └── settings/
│   │       ├── google-settings.tsx   # Config Google Sheets
│   │       ├── evolution-settings.tsx # Config Evolution API
│   │       ├── deepseek-settings.tsx # Config DeepSeek
│   │       ├── asaas-settings.tsx    # Config Asaas
│   │       └── n8n-settings.tsx      # Config n8n
│   │
│   ├── lib/
│   │   ├── google-sheets.ts          # Service Layer - Google Sheets
│   │   ├── sheets/
│   │   │   ├── leads.ts              # CRUD da aba "Leads"
│   │   │   ├── signature-logs.ts     # CRUD da aba "Logs_Assinatura"
│   │   │   └── config.ts            # CRUD da aba "Configuracoes"
│   │   ├── evolution-api.ts          # Client para Evolution API
│   │   ├── deepseek-api.ts           # Client para DeepSeek API
│   │   ├── config-manager.ts         # Gerenciador de config (lê sheets ou env)
│   │   └── utils.ts                  # Helpers genéricos
│   │
│   ├── types/
│   │   ├── lead.ts                   # Interfaces de Lead
│   │   ├── signature.ts              # Interfaces de Assinatura
│   │   ├── config.ts                 # Interfaces de Configuração
│   │   └── api.ts                    # Tipos de resposta das APIs
│   │
│   └── config/
│       └── constants.ts              # Constantes (cores, status, etc.)
│
├── public/
│   └── fonts/                        # Work Sans + Space Mono
│
└── plans/                            # Documentação do plano
```

---

## 3. Sistema de Configuração via UI

### 3.1 Filosofia

O sistema usa **duas camadas de configuração**:

| Camada                            | O que armazena                                                 | Onde          | Editável via UI?  |
| --------------------------------- | -------------------------------------------------------------- | ------------- | :---------------: |
| **Bootstrap** (`.env.local`)      | `GOOGLE_CLIENT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID` | .env.local    | ❌ (via servidor) |
| **Runtime** (aba "Configuracoes") | DeepSeek key, Evolution URL/Key, Asaas key, n8n secret         | Google Sheets |        ✅         |

### 3.2 Aba "Configuracoes" (3ª worksheet)

| Coluna        | Tipo              | Exemplo                 |
| ------------- | ----------------- | ----------------------- |
| Chave         | `string` (UNIQUE) | `DEEPSEEK_API_KEY`      |
| Valor         | `string`          | `sk-xxxx`               |
| Descricao     | `string`          | "Chave da API DeepSeek" |
| Atualizado_Em | `timestamp`       | `2026-05-28T18:00:00Z`  |

**Chaves obrigatórias**: `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `ASAAS_API_KEY`, `N8N_WEBHOOK_SECRET`

### 3.3 Fluxo de Inicialização

```mermaid
flowchart TD
    A[App Inicia] --> B{Existem configs<br/>no Google Sheets?}
    B -->|Sim| C[Carregar configs<br/>em cache na API]
    B -->|Não| D[Verificar .env.local]
    D --> E{Configs runtime<br/>no .env.local?}
    E -->|Sim| F[Injetar no Sheets<br/>via bootstrap]
    E -->|Não| G[Redirect para<br/>/settings]
    F --> H[UI Settings<br/>disponível]
    G --> H
    C --> H
    H --> I[Usuário pode editar<br/>a qualquer momento]
```

### 3.4 API de Configuração

**`GET /api/config`** — Retorna todas as configurações (valores mascarados para segurança)

```typescript
// Response 200
{
  configured: boolean;
  services: {
    deepseek: {
      configured: boolean;
      key_preview: string | null;
    }
    evolution: {
      configured: boolean;
      url_preview: string | null;
    }
    asaas: {
      configured: boolean;
      key_preview: string | null;
    }
    n8n: {
      configured: boolean;
      secret_preview: string | null;
    }
  }
}
```

**`PUT /api/config`** — Atualiza configurações

```typescript
// Request Body
{
  deepseek?: { apiKey: string; model?: string };
  evolution?: { apiUrl: string; apiKey: string };
  asaas?: { apiKey: string };
  n8n?: { webhookSecret: string };
}
// Response 200: { success: true }
```

### 3.5 Página `/settings`

- **Layout**: Painel dividido em cards (accordion/tabs) por serviço
- **Google Sheets**: Exibe status da conexão (OK / Falha)
- **DeepSeek**: Input para API Key + modelo, botão "Testar Conexão"
- **Evolution API**: Input para URL + API Key, botão "Testar Conexão"
- **Asaas**: Input para API Key, botão "Testar Conexão"
- **n8n**: Input para Webhook Secret (para validar requisições recebidas)
- **Indicadores visuais**: 🔴 Não configurado / 🟢 Configurado / 🟡 Testando

---

## 4. Banco de Dados — Google Sheets

### Aba: `Leads`

| Coluna           | Tipo          | Descrição                          |
| ---------------- | ------------- | ---------------------------------- | ---------------- | ---------------- | ------------- | ---------- | ------------ |
| ID               | `string`      | UUID v4 único                      |
| Nome             | `string`      | Nome do lead                       |
| Empresa          | `string`      | Empresa do lead                    |
| Telefone         | `string`      | WhatsApp (formato internacional)   |
| Email            | `string`      | E-mail corporativo                 |
| Status_Funil     | `enum`        | Prospecção                         | Audit Solicitado | Proposta Enviada | Fechado/Ganho | Onboarding | Inadimplente |
| Investimento_Ads | `number`      | Investimento em anúncios (R$)      |
| Conversoes       | `number`      | Conversões reportadas              |
| ROAS             | `number`      | Retorno sobre investimento         |
| Perda_Estimada   | `number`      | (Calculado)                        |
| Valor_Perdido    | `number`      | (Calculado)                        |
| Data_Criacao     | `timestamp`   | ISO string                         |
| Data_Atualizacao | `timestamp`   | ISO string                         |
| Dados_DeepSeek   | `json string` | JSON stringified do enriquecimento |

### Aba: `Logs_Assinatura`

| Coluna     | Tipo        | Descrição                              |
| ---------- | ----------- | -------------------------------------- | -------- | ------- |
| ID_Lead    | `string`    | FK para Leads.ID                       |
| IP         | `string`    | IP do cliente no momento da assinatura |
| Timestamp  | `timestamp` | ISO string                             |
| Telefone   | `string`    | WhatsApp do cliente                    |
| Codigo_2FA | `string`    | Código de 6 dígitos gerado             |
| Status     | `enum`      | pending                                | verified | expired |

### Aba: `Configuracoes`

| Coluna        | Tipo              | Descrição                     |
| ------------- | ----------------- | ----------------------------- |
| Chave         | `string` (UNIQUE) | Identificador da configuração |
| Valor         | `string`          | Valor (API key, URL, etc.)    |
| Descricao     | `string`          | Descrição amigável            |
| Atualizado_Em | `timestamp`       | ISO string                    |

---

## 5. Fluxos de Dados (Diagramas)

### 5.1 Fluxo de Kanban (Drag & Drop)

```mermaid
sequenceDiagram
    participant User as Usuário
    participant UI as Kanban Board
    participant API as Next.js API
    participant GS as Google Sheets

    User->>UI: Arrasta card para nova coluna
    UI->>API: PATCH /api/leads/:id/status { novoStatus }
    API->>GS: Atualiza Status_Funil na linha
    GS-->>API: Confirma atualização
    API-->>UI: 200 OK + lead atualizado
    UI-->>User: Renderiza card na nova coluna
```

### 5.2 Fluxo de Assinatura Digital (2FA)

```mermaid
sequenceDiagram
    participant Client as Cliente (WhatsApp)
    participant API as Next.js API
    participant CFG as Config Manager
    participant GS as Google Sheets
    participant Evo as Evolution API

    Note over API: POST /api/signature/generate-2fa
    API->>CFG: Busca Evolution credentials
    CFG-->>API: URL + Key
    API->>API: Gera código aleatório de 6 dígitos
    API->>GS: Salva em Logs_Assinatura { pending }
    API->>Evo: Envia WhatsApp com código 2FA
    Evo-->>Client: Mensagem com código
    Client->>Client: Digita código no sistema
    Note over API: POST /api/signature/validate-2fa
    API->>GS: Verifica código e status
    GS-->>API: Código válido?
    alt Código válido
        API->>GS: Atualiza Status = verified + IP + Timestamp
        API-->>Client: 200 OK - Aceite registrado
    else Código inválido/expirado
        API-->>Client: 401 Unauthorized
    end
```

### 5.3 Fluxo de Webhooks

```mermaid
flowchart LR
    A[n8n] -->|POST /api/webhook/n8n| B[API Next.js]
    B --> C{Valida secret}
    C -->|OK| D[Google Sheets<br/>Aba: Leads]

    E[Asaas] -->|POST /api/webhook/asaas| F[API Next.js]
    F --> G[Google Sheets<br/>Aba: Leads]

    H[Evolution API] -->|POST /api/signature/generate-2fa| I[API Next.js]
    I --> J[Busca config<br/>Evolution]
    J --> K[Google Sheets<br/>Aba: Logs_Assinatura]
    K --> H

    L[DeepSeek] -->|POST /api/ai/enrich-lead| M[API Next.js]
    M --> N[Busca config<br/>DeepSeek]
    N --> O[Google Sheets<br/>Aba: Leads]
```

---

## 6. Design System — Tema Soberior

### Paleta de Cores

```css
:root {
  /* Fundos */
  --color-bg-primary: #0b1320; /* Deep Navy */
  --color-bg-secondary: #143d59; /* Midnight Blue */

  /* Acentos */
  --color-accent-primary: #f2c14e; /* Sunglow / Amarelo */
  --color-accent-secondary: #1f7a8c; /* Teal */

  /* Texto */
  --color-text-primary: #ffffff;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  /* Bordas / Dividers */
  --color-border: #1e293b;

  /* Status Kanban (gradientes de fundo) */
  --color-prospeccao: #1e3a5f;
  --color-audit: #1f7a8c;
  --color-proposta: #f2c14e;
  --color-fechado: #22c55e;
  --color-onboarding: #3b82f6;
  --color-inadimplente: #ef4444;
}
```

### Tipografia

- **Work Sans**: Textos gerais, labels, headers (importado do Google Fonts)
- **Space Mono**: Exclusivo para valores monetários (R$), números, códigos

### Componentes Shadcn/ui a serem instalados

`Button`, `Card`, `Dialog` (Modal), `Input`, `Label`, `Select`, `Badge`, `Sheet` (Sidebar), `DropdownMenu`, `Toast`, `Skeleton`, `Tabs`, `Switch`, `Separator`

---

## 7. Especificação das API Routes

### `POST /api/webhook/n8n`

**Receber leads de sistemas externos (raspagem de dados)**

```typescript
// Request Body
{
  nome: string;
  empresa: string;
  telefone: string;
  email?: string;
  investimento_ads?: number;
  conversoes?: number;
  roas?: number;
}
// Response 201: { success: true, leadId: string }
```

### `POST /api/webhook/asaas`

**Receber notificações de pagamento/inadimplência**

```typescript
// Request Body (Asaas)
{
  event: "PAYMENT_RECEIVED" | "PAYMENT_OVERDUE";
  payment: { id: string; value: number; customer: string; };
  subscription?: { id: string; };
}
// Response 200: { success: true, newStatus: Status_Funil }
```

### `POST /api/signature/generate-2fa`

**Gerar código 2FA e disparar WhatsApp**

```typescript
// Request Body
{
  leadId: string;
  telefone: string;
}
// Response 201: { message: "Código enviado", expiresIn: 300 }
```

### `POST /api/signature/validate-2fa`

**Validar código 2FA e registrar aceite**

```typescript
// Request Body
{ leadId: string; codigo: string; ip?: string; }
// Response 200: { success: true, message: "Assinatura registrada" }
// Response 401: { success: false, message: "Código inválido ou expirado" }
```

### `POST /api/ai/enrich-lead`

**Enriquecer lead com DeepSeek**

```typescript
// Request Body
{
  leadId: string;
  url: string;
}
// Response 200: { success: true, enrichedData: {...} }
```

### `GET /api/config` + `PUT /api/config`

**Gerenciar configurações do sistema via UI**

---

## 8. Estrutura do `.env.local` (Mínimo)

```env
# APENAS Google Sheets - necessário para bootstrap do sistema
GOOGLE_CLIENT_EMAIL=seu-servico@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1abc123...sheet-id
```

> Todas as demais credenciais (DeepSeek, Evolution, Asaas, n8n) são gerenciadas via UI em `/settings` e persistem na aba "Configuracoes" do Google Sheets.

---

## 9. Pacotes NPM Necessários

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "google-spreadsheet": "^4.1.0",
    "googleapis": "^137.0.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "lucide-react": "^0.400.0",
    "uuid": "^9.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "next-themes": "^0.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/uuid": "^9.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 10. Considerações de Segurança

1. **Validação de Webhooks**:
   - `POST /api/webhook/asaas`: Validar IP de origem do Asaas (range fixo)
   - `POST /api/webhook/n8n`: Usar header secreto `x-webhook-secret` (configurado via UI)

2. **Config Manager**: As credenciais sensíveis (API keys) são armazenadas no Google Sheets (aba Configuracoes), nunca expostas no frontend diretamente; a API retorna apenas previews mascarados (ex: `sk-****abcd`)

3. **Google Sheets**: A chave privada (`GOOGLE_PRIVATE_KEY`) deve ser escapada com `\n` no `.env.local`. No deploy da Vercel, usar Environment Variables criptografadas

4. **CORS**: Como é webhook-first, CORS aberto para origens confiáveis ou desabilitado em ambiente serverless

---

## 11. Passos de Implementação (Ordem de Execução)

1. **Setup Inicial** — Inicializar Next.js, instalar dependências, configurar Tailwind + fonts, criar estrutura de pastas
2. **Camada de Dados** — Service do Google Sheets + CRUD das abas (Leads, Logs_Assinatura, Configuracoes)
3. **Config Manager** — Sistema que lê configurações do Sheets e as disponibiliza para as APIs
4. **Página /settings** — UI para configurar DeepSeek, Evolution, Asaas, n8n com salvamento no Sheets
5. **UI Base** — Layout (Sidebar + Header) com tema escuro, página de leads
6. **Kanban Board** — Componente com drag-and-drop usando `@dnd-kit`
7. **Formulário de Lead** — Modal de entrada rápida
8. **API de Assinatura** — `generate-2fa` + `validate-2fa` + Evolution API
9. **Webhooks** — `n8n` + `asaas` endpoints
10. **Integração DeepSeek** — `enrich-lead` endpoint

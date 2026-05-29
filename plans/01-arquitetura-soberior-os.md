# Soberior OS — Arquitetura do Sistema

## 1. Visão Geral

O **Soberior OS** é um CRM B2B Autônomo construído com Next.js 16 (App Router), Prisma 7 com PostgreSQL, NextAuth v4 e diversas integrações (DeepSeek AI, Evolution API, Asaas, n8n).

O sistema substituiu o modelo original baseado em Google Sheets por uma arquitetura moderna com banco de dados relacional, autenticação JWT e UI componentizada com shadcn/ui.

### Stack Tecnológica

| Camada     | Tecnologia                                   |
| ---------- | -------------------------------------------- |
| Framework  | Next.js 16 (App Router) + Turbopack          |
| Linguagem  | TypeScript 5                                 |
| Database   | PostgreSQL via Prisma 7 + @prisma/adapter-pg |
| Auth       | NextAuth v4 (Credentials Provider + JWT)     |
| UI         | React 19 + shadcn/ui + Tailwind CSS 4        |
| DnD        | @dnd-kit v6 (core, sortable, utilities)      |
| AI         | DeepSeek via OpenAI SDK                      |
| Testes     | n8n (automação de onboarding)                |
| Pagamentos | Asaas (subscriptions, webhooks)              |
| WhatsApp   | Evolution API (2FA, notificações)            |

## 2. Estrutura de Diretórios

```
src/
├── app/
│   ├── (admin)/          # Rotas administrativas (protegidas)
│   │   ├── page.tsx      # Dashboard admin (Kanban)
│   │   ├── leads/new/    # Cadastro de leads
│   │   └── settings/     # Configurações de integrações
│   ├── (portal)/         # Portal do cliente (protegido)
│   │   ├── dashboard/     # Dashboard do cliente
│   │   ├── documentos/    # Documentos do projeto
│   │   └── faturas/       # Faturas e assinaturas
│   ├── api/              # API Routes
│   │   ├── ai/enrich-lead/        # DeepSeek enrichment
│   │   ├── auth/[...nextauth]/     # Autenticação
│   │   ├── config/                 # Configurações (CRUD via Prisma)
│   │   ├── leads/                  # CRUD de leads
│   │   ├── leads/[id]/status/      # Atualização de status
│   │   ├── portal/                 # API do portal do cliente
│   │   ├── projects/trigger-onboarding/ # Onboarding n8n
│   │   ├── signature/              # 2FA para assinatura digital
│   │   └── webhook/               # Webhooks (n8n, Asaas)
│   └── login/            # Página de login
├── components/
│   ├── forms/            # Formulários (LeadForm)
│   ├── kanban/           # Kanban board (DnD)
│   ├── layout/           # Sidebar, Header
│   ├── settings/         # Cards de configuração por serviço
│   └── ui/               # shadcn/ui components
├── config/               # Constantes do sistema
├── lib/                  # Utilitários e serviços
│   ├── prisma.ts         # Cliente Prisma singleton
│   ├── config-manager.ts # Gerenciamento de config (persistido no DB)
│   ├── deepseek-api.ts   # Integração DeepSeek
│   ├── evolution-api.ts  # Integração Evolution API
│   └── code-store.ts     # Armazenamento de códigos 2FA
├── types/                # Tipos TypeScript
│   ├── lead.ts           # StatusFunil, Lead, OrganizationSummary
│   ├── config.ts         # ConfigKey, ConfigStatusResponse
│   ├── api.ts            # Payloads de API
│   └── next-auth.d.ts    # Extensão de tipos do NextAuth
└── proxy.ts              # Middleware (Next.js 16: proxy.ts)
```

## 3. Sistema de Configuração

### 3.1 Filosofia

Diferentemente da arquitetura original (Google Sheets), as configurações são **persistidas no PostgreSQL** via tabela `SystemConfig`, com cache em memória e fallback para variáveis de ambiente.

### 3.2 Fluxo de Inicialização

1. A página `/settings` carrega e faz `GET /api/config`
2. `/api/config` chama `checkConfigStatus()` no `config-manager.ts`
3. `getConfigValue()` usa lookup em 3 níveis:
   - Cache em memória (`configCache`)
   - `process.env` (fallback)
   - Prisma → tabela `SystemConfig` (fonte da verdade)

### 3.3 API de Configuração

- **GET /api/config** → Retorna `ConfigStatusResponse` com status de todos os serviços
- **PUT /api/config** → Recebe `ConfigUpdatePayload`, persiste via `prisma.systemConfig.upsert()` e sincroniza com cache + `process.env`

### 3.4 Chaves de Configuração

```typescript
type ConfigKey =
  | "DEEPSEEK_API_KEY"
  | "DEEPSEEK_MODEL"
  | "EVOLUTION_API_URL"
  | "EVOLUTION_API_KEY"
  | "ASAAS_API_KEY"
  | "N8N_WEBHOOK_SECRET";
```

## 4. Modelo de Dados (Prisma)

### Schema

```prisma
model Organization {
  id            String   @id @default(uuid())
  name          String
  cnpj          String?  @unique
  domain        String?
  email         String?    // <-- NOVO: e-mail de contato
  telefone      String?    // <-- NOVO: telefone de contato
  stapeId       String?
  isActive      Boolean  @default(true)
  users         User[]
  leads         Lead[]
  projects      Project[]
  subscriptions Subscription[]
}

model Lead {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation
  status         String       @default("PROSPECT")
  score          Int?
  lostRevenue    Float?
}

model Project {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation
  stage          String       @default("ONBOARDING")
  uptimeStatus   Float        @default(100.0)
  lastQBR        DateTime?
}

model Subscription {
  id             String       @id @default(uuid())
  organizationId String
  organization   Organization @relation
  asaasId        String       @unique
  planType       String
  mrrValue       Float
  status         String
  dueDate        DateTime
}

model SystemConfig {
  key       String   @id
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model User {
  id                    String       @id @default(uuid())
  email                 String       @unique
  passwordHash          String
  role                  String       @default("CLIENT")
  organizationId        String?
  organization          Organization? @relation
  twoFactorCode         String?
  twoFactorCodeExpiresAt DateTime?
}
```

### Mapeamento de Status (Funil)

Os status são armazenados em inglês no banco e convertidos para português na API:

| Banco (EN)      | Exibição (PT)    |
| --------------- | ---------------- |
| PROSPECT        | Prospecção       |
| AUDIT_REQUESTED | Audit Solicitado |
| PROPOSAL_SENT   | Proposta Enviada |
| CLOSED_WON      | Fechado/Ganho    |
| ONBOARDING      | Onboarding       |
| DELINQUENT      | Inadimplente     |

## 5. Fluxos Principais

### 5.1 Fluxo de Kanban (Drag & Drop)

1. `KanbanBoard` faz `GET /api/leads` ao montar
2. Os leads são agrupados em colunas por status (via `CANVAS_ORDER`)
3. Drag & drop usa `@dnd-kit` com `DndContext` + `SortableContext` por coluna
4. Ao soltar, `handleDragEnd` faz `PATCH /api/leads/[id]/status` com atualização otimista
5. `LeadDetailModal` exibe detalhes e permite:
   - **Analisar com IA** → `POST /api/ai/enrich-lead` (atualiza score/lostRevenue)
   - **Aprovar e Onboarding** → `PATCH /api/leads/[id]/status` + `POST /api/projects/trigger-onboarding`

### 5.2 Fluxo de Assinatura Digital (2FA)

1. `POST /api/signature/generate-2fa` → gera código de 6 dígitos, envia via Evolution API (WhatsApp)
2. Código armazenado em `code-store.ts` (Map em memória) com expiração
3. `POST /api/signature/validate-2fa` → verifica código, retorna sucesso/falha

### 5.3 Fluxo de Webhooks

- **n8n** → `POST /api/webhook/n8n` → recebe leads do n8n, cria Organization + Lead via transação
- **Asaas** → `POST /api/webhook/asaas` → recebe eventos de pagamento/inadimplência, atualiza assinatura
- O sistema implementa "kill switch": quando assinatura fica inadimplente, o cliente é bloqueado

## 6. Autenticação e Autorização

- **NextAuth v4** com `CredentialsProvider`
- Sessões JWT (sem banco de sessões)
- `proxy.ts` (substituto do `middleware.ts` no Next.js 16):
  - Protege rotas admin (`/`, `/leads`, `/settings`) e portal (`/dashboard`, `/documentos`, `/faturas`)
  - Bloqueia usuários `CLIENT` de acessarem rotas admin
- Tipos estendidos via `next-auth.d.ts`:
  - `User` estendido com `role`, `organizationId`, `name`

## 7. Design System

### Paleta de Cores

```css
--background: #0b1320 /* Fundo escuro */ --surface: #143d59
  /* Cards e superfícies */ --border: #1e293b /* Bordas */ --accent: #f2c14e
  /* Dourado (ação principal) */ --text-secondary: #94a3b8 --info: #1f7a8c
  /* Links e badges informativos */ --success: #10b981 --danger: #ef4444;
```

### Tipografia

- Fonte padrão do sistema (Inter via Tailwind)
- `font-mono` para dados técnicos (CNPJ, valores, IDs)
- Tamanhos: `text-xs` (labels), `text-sm` (corpo), `text-lg`/`text-xl` (títulos)

### Componentes Shadcn/ui instalados

Button, Card, Input, Label, Badge, Dialog, Sheet, DropdownMenu, Select, Switch, Tabs, Separator, Skeleton, Sonner (toast)

## 8. API Endpoints

| Método | Rota                               | Descrição                    |
| ------ | ---------------------------------- | ---------------------------- |
| GET    | `/api/leads`                       | Lista todos os leads         |
| POST   | `/api/leads`                       | Cria lead + organização      |
| PATCH  | `/api/leads/[id]/status`           | Atualiza status do lead      |
| POST   | `/api/ai/enrich-lead`              | Enriquecimento com DeepSeek  |
| POST   | `/api/projects/trigger-onboarding` | Dispara onboarding via n8n   |
| POST   | `/api/auth/[...nextauth]`          | NextAuth (credentials)       |
| GET    | `/api/config`                      | Status das configurações     |
| PUT    | `/api/config`                      | Salva configurações          |
| POST   | `/api/signature/generate-2fa`      | Gera código 2FA              |
| POST   | `/api/signature/validate-2fa`      | Valida código 2FA            |
| POST   | `/api/webhook/n8n`                 | Webhook de entrada (n8n)     |
| POST   | `/api/webhook/asaas`               | Webhook de pagamento (Asaas) |
| GET    | `/api/portal/dashboard`            | Dashboard do cliente         |
| GET    | `/api/portal/documents`            | Documentos do cliente        |
| GET    | `/api/portal/invoices`             | Faturas do cliente           |

## 9. Pacotes NPM

**Produção:** `next@16`, `react@19`, `next-auth@4`, `@prisma/client@7`, `@prisma/adapter-pg@7`, `@dnd-kit/*@6`, `openai`, `bcrypt`, `lucide-react`, `sonner`, `google-spreadsheet` (legado), `dotenv`

**Dev:** `prisma@7`, `typescript@5`, `tailwindcss@4`, `eslint@9`, `@types/*`

## 10. Considerações de Segurança

- Senhas hasheadas com bcrypt
- JWT stateless (sem refresh token)
- 2FA via WhatsApp (Evolution API) com expiração de 5 minutos
- Proxy (`proxy.ts`) protege rotas sensíveis
- Webhooks podem ser autenticados via `N8N_WEBHOOK_SECRET`
- Configurações de API armazenadas no banco (não em codebase)

## 11. Passos de Implementação Futuros

1. [ ] Adicionar CRUD de usuários (admin convida clientes)
2. [ ] Implementar painel de QBR (Quarterly Business Review)
3. [ ] Criar modelo `Document` para upload/download no portal
4. [ ] Relatórios de métricas (taxa de conversão, MRR, churn)
5. [ ] Cache Redis para sessões e rate limiting
6. [ ] Testes end-to-end com Playwright
7. [ ] Suporte a múltiplos tenants (organizações)
8. [ ] Pipeline CI/CD com GitHub Actions

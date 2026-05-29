# 📋 SOBERIOR OS — Documentação Completa

> **Versão:** 0.1.0  
> **Stack:** Next.js 16 · React 19 · Prisma 7 · PostgreSQL · NextAuth v4  
> **Repositório:** [`crm-soberior`](./)

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Projeto](#3-arquitetura-do-projeto)
4. [Modelo de Dados](#4-modelo-de-dados)
5. [Autenticação e Autorização](#5-autenticação-e-autorização)
6. [API Endpoints](#6-api-endpoints)
7. [Componentes da UI](#7-componentes-da-ui)
8. [Fluxos do Sistema](#8-fluxos-do-sistema)
9. [Sistema de Configuração](#9-sistema-de-configuração)
10. [Integrações](#10-integrações)
11. [Design System](#11-design-system)
12. [Guia de Desenvolvimento](#12-guia-de-desenvolvimento)
13. [Guia de Implantação](#13-guia-de-implantação)
14. [Segurança](#14-segurança)
15. [Roadmap Futuro](#15-roadmap-futuro)

---

## 1. Visão Geral

O **SOBERIOR OS** é um **CRM B2B Autônomo** que gerencia todo o ciclo de vida do cliente — da prospecção ao onboarding, incluindo faturamento recorrente (MRR) e um portal do cliente.

### Principais Funcionalidades

| Funcionalidade              | Descrição                                                          |
| --------------------------- | ------------------------------------------------------------------ |
| **Kanban de Vendas**        | Quadro visual com drag & drop para gerenciar leads no funil        |
| **Gestão de Leads**         | Cadastro, enriquecimento com IA e alteração de status              |
| **Enriquecimento com IA**   | Análise automática de leads via DeepSeek (score e receita perdida) |
| **Assinatura Digital 2FA**  | Verificação em duas etapas via WhatsApp                            |
| **Portal do Cliente**       | Dashboard, documentos e faturas para clientes                      |
| **Integração Asaas**        | Webhooks de pagamento e Kill Switch por inadimplência              |
| **Automação n8n**           | Criação automática de leads e onboarding                           |
| **Painel de Configurações** | Gerenciamento de integrações via UI                                |

---

## 2. Stack Tecnológica

### Produção

| Tecnologia                                            | Versão  | Finalidade                        |
| ----------------------------------------------------- | ------- | --------------------------------- |
| [`Next.js`](package.json)                             | 16.2.6  | Framework full-stack (App Router) |
| [`React`](package.json)                               | 19.2.4  | Biblioteca de UI                  |
| [`TypeScript`](tsconfig.json)                         | 5+      | Tipagem estática                  |
| [`Prisma`](prisma/schema.prisma)                      | 7.8.0   | ORM e migrations                  |
| [`PostgreSQL`](.env.example)                          | —       | Banco de dados relacional         |
| [`NextAuth`](src/app/api/auth/[...nextauth]/route.ts) | 4.24.14 | Autenticação com JWT              |
| [`@dnd-kit`](src/components/kanban/kanban-board.tsx)  | 6.x     | Drag & drop no Kanban             |
| [`OpenAI SDK`](src/lib/deepseek-api.ts)               | 6.39.1  | Cliente para DeepSeek API         |
| [`Tailwind CSS`](postcss.config.mjs)                  | 4       | Estilização utilitária            |
| [`shadcn/ui`](components.json)                        | —       | Componentes base                  |
| [`bcrypt`](src/app/api/auth/[...nextauth]/route.ts)   | 6.0.0   | Hash de senhas                    |

### Desenvolvimento

| Tecnologia                           | Finalidade        |
| ------------------------------------ | ----------------- |
| [`ESLint`](eslint.config.mjs)        | Linting           |
| [`Prisma CLI`](prisma/schema.prisma) | Migrations e seed |
| [`Turbopack`](next.config.ts)        | Bundler dev       |

---

## 3. Arquitetura do Projeto

### Estrutura de Diretórios

```
📁 crm-soberior/
├── 📁 plans/                          # Documentos de arquitetura
│   └── 01-arquitetura-soberior-os.md  # Documento de arquitetura original
├── 📁 prisma/
│   └── schema.prisma                  # Schema do banco de dados
├── 📁 public/                         # Assets estáticos
├── 📁 src/
│   ├── 📁 app/
│   │   ├── 📁 (admin)/                # Rotas administrativas
│   │   │   ├── page.tsx               # Dashboard com Kanban
│   │   │   ├── 📁 leads/new/          # Cadastro de leads
│   │   │   └── 📁 settings/           # Configurações do sistema
│   │   ├── 📁 (portal)/               # Portal do cliente
│   │   │   ├── 📁 dashboard/          # Dashboard do cliente
│   │   │   ├── 📁 documentos/         # Documentos do projeto
│   │   │   └── 📁 faturas/            # Faturas e assinaturas
│   │   ├── 📁 api/                    # API Routes (Next.js)
│   │   │   ├── 📁 ai/enrich-lead/     # DeepSeek enrichment
│   │   │   ├── 📁 auth/[...nextauth]/ # Autenticação
│   │   │   ├── 📁 config/             # Gerenciamento de config
│   │   │   ├── 📁 leads/              # CRUD de leads
│   │   │   ├── 📁 leads/[id]/status/  # Atualização de status
│   │   │   ├── 📁 portal/             # API do portal cliente
│   │   │   ├── 📁 projects/           # Onboarding
│   │   │   ├── 📁 signature/          # 2FA para assinatura
│   │   │   └── 📁 webhook/            # Webhooks n8n/Asaas
│   │   └── 📁 login/                  # Página de login
│   ├── 📁 components/
│   │   ├── 📁 forms/                  # Formulários
│   │   ├── 📁 kanban/                 # Kanban Board
│   │   ├── 📁 layout/                 # Sidebar, Header
│   │   ├── 📁 providers/              # Providers (Auth)
│   │   ├── 📁 settings/               # Cards de configuração
│   │   └── 📁 ui/                     # shadcn/ui components
│   ├── 📁 config/
│   │   └── constants.ts               # Constantes do sistema
│   ├── 📁 generated/                  # Prisma Client gerado
│   ├── 📁 lib/                        # Utilitários
│   │   ├── prisma.ts                  # Cliente Prisma singleton
│   │   ├── config-manager.ts          # Gerenciamento de config
│   │   ├── deepseek-api.ts            # Integração DeepSeek
│   │   ├── evolution-api.ts           # Integração Evolution API
│   │   ├── code-store.ts              # Armazenamento 2FA
│   │   └── utils.ts                   # Utilitários (cn)
│   ├── 📁 types/                      # Tipos TypeScript
│   │   ├── lead.ts                    # Tipos de Lead/Funil
│   │   ├── config.ts                  # Tipos de Config
│   │   ├── api.ts                     # Payloads de API
│   │   ├── signature.ts               # Tipos de Assinatura
│   │   └── next-auth.d.ts             # Extensão NextAuth
│   └── proxy.ts                       # Middleware de autorização
├── .env.example                       # Template de variáveis
├── components.json                    # Config shadcn/ui
├── next.config.ts                     # Config Next.js
├── package.json                       # Dependências
├── prisma.config.ts                   # Config Prisma
├── seed.ts                            # Seed do banco
└── tsconfig.json                      # Config TypeScript
```

### Convenção de Rotas

O Next.js 16 utiliza o **App Router** com grupos de rotas (Route Groups) para organizar a aplicação:

| Grupo                            | Público         | Proteção                   |
| -------------------------------- | --------------- | -------------------------- |
| [`(admin)`](<src/app/(admin)>)   | Administradores | `proxy.ts` — apenas ADMIN  |
| [`(portal)`](<src/app/(portal)>) | Clientes        | `proxy.ts` — apenas CLIENT |
| [`login`](src/app/login)         | Público         | Sem proteção               |
| [`api`](src/app/api)             | SPA/Webhooks    | Proteção por sessão        |

### Middleware ([`src/proxy.ts`](src/proxy.ts))

O arquivo [`proxy.ts`](src/proxy.ts) substitui o antigo `middleware.ts` do Next.js e é responsável por:

1. **Autenticação**: Verifica se o usuário possui token JWT válido
2. **Autorização por role**: Redireciona usuários `CLIENT` para o portal (`/dashboard`) quando tentam acessar rotas admin
3. **Rotas públicas**: `/login` é sempre acessível

```typescript
// Comportamento principal:
// - CLIENT → rotas admin → redirect para /dashboard
// - Sem token → rotas protegidas → redirect para /login
// - Rotas públicas (/login, /api) → acesso livre
```

---

## 4. Modelo de Dados

### Diagrama ER

```
┌─────────────────┐       ┌──────────────────┐
│    Organization  │───┐   │      User        │
├─────────────────┤   │   ├──────────────────┤
│ id (PK, UUID)   │   │   │ id (PK, UUID)    │
│ name            │   │   │ email (UNIQUE)    │
│ cnpj (UNIQUE)   │   │   │ passwordHash     │
│ domain          │   ├──>│ role              │
│ email           │   │   │ organizationId FK │
│ telefone        │   │   │ twoFactorCode     │
│ stapeId         │   │   │ twoFactorExpiresAt│
│ isActive        │   │   └──────────────────┘
└────────┬────────┘   │
         │            │
         ▼            │
┌──────────────────┐  │
│      Lead        │  │
├──────────────────┤  │
│ id (PK, UUID)    │  │
│ organizationId FK│  │
│ status           │  │
│ score            │  │
│ lostRevenue      │  │
└──────────────────┘  │
                      │
┌──────────────────┐  │
│    Project       │  │
├──────────────────┤  │
│ id (PK, UUID)    │  │
│ organizationId FK│  │
│ stage            │  │
│ uptimeStatus     │  │
│ lastQBR          │  │
└──────────────────┘  │
                      │
┌──────────────────┐  │
│  Subscription    │  │
├──────────────────┤  │
│ id (PK, UUID)    │  │
│ organizationId FK│  │
│ asaasId (UNIQUE) │  │
│ planType         │  │
│ mrrValue         │  │
│ status           │  │
│ dueDate          │  │
└──────────────────┘  │
                      │
┌──────────────────┐  │
│  SystemConfig    │  │
├──────────────────┤  │
│ key (PK)         │  │
│ value            │  │
│ createdAt        │  │
│ updatedAt        │  │
└──────────────────┘  │
```

### Entidades

#### [`Organization`](prisma/schema.prisma:10)

Representa uma empresa/cliente no sistema. É a entidade central que agrega leads, projetos, assinaturas e usuários.

| Campo      | Tipo      | Descrição                            |
| ---------- | --------- | ------------------------------------ |
| `id`       | `UUID`    | Identificador único                  |
| `name`     | `String`  | Nome da empresa                      |
| `cnpj`     | `String?` | CNPJ (único)                         |
| `domain`   | `String?` | Domínio do site                      |
| `email`    | `String?` | E-mail de contato                    |
| `telefone` | `String?` | Telefone de contato                  |
| `stapeId`  | `String?` | ID no sistema Stape (infraestrutura) |
| `isActive` | `Boolean` | Se está ativa (Kill Switch)          |

#### [`Lead`](prisma/schema.prisma:36)

Representa um potencial cliente no funil de vendas.

| Campo            | Tipo     | Descrição                           |
| ---------------- | -------- | ----------------------------------- |
| `id`             | `UUID`   | Identificador único                 |
| `organizationId` | `UUID`   | FK → Organization                   |
| `status`         | `String` | Status no funil (vide mapeamento)   |
| `score`          | `Int?`   | Score de 0-100 (enriquecido por IA) |
| `lostRevenue`    | `Float?` | Receita mensal perdida estimada     |

#### [`Project`](prisma/schema.prisma:45)

Representa o projeto de um cliente após a aprovação do lead.

| Campo            | Tipo        | Descrição                    |
| ---------------- | ----------- | ---------------------------- |
| `id`             | `UUID`      | Identificador único          |
| `organizationId` | `UUID`      | FK → Organization            |
| `stage`          | `String`    | Estágio (`ONBOARDING`, etc.) |
| `uptimeStatus`   | `Float`     | Percentual de uptime         |
| `lastQBR`        | `DateTime?` | Data do último QBR           |

#### [`Subscription`](prisma/schema.prisma:54)

Representa a assinatura/plano de um cliente.

| Campo            | Tipo       | Descrição                          |
| ---------------- | ---------- | ---------------------------------- |
| `id`             | `UUID`     | Identificador único                |
| `organizationId` | `UUID`     | FK → Organization                  |
| `asaasId`        | `String`   | ID no Asaas (único)                |
| `planType`       | `String`   | Tipo do plano                      |
| `mrrValue`       | `Float`    | Valor mensal (MRR)                 |
| `status`         | `String`   | Status (`ACTIVE`, `OVERDUE`, etc.) |
| `dueDate`        | `DateTime` | Data de vencimento                 |

#### [`User`](prisma/schema.prisma:25)

Representa um usuário do sistema (admin ou cliente).

| Campo                    | Tipo        | Descrição               |
| ------------------------ | ----------- | ----------------------- |
| `id`                     | `UUID`      | Identificador único     |
| `email`                  | `String`    | E-mail (único)          |
| `passwordHash`           | `String`    | Hash bcrypt da senha    |
| `role`                   | `String`    | `ADMIN` ou `CLIENT`     |
| `organizationId`         | `String?`   | FK → Organization       |
| `twoFactorCode`          | `String?`   | Código 2FA temporário   |
| `twoFactorCodeExpiresAt` | `DateTime?` | Expiração do código 2FA |

#### [`SystemConfig`](prisma/schema.prisma:65)

Armazena configurações de integrações no banco de dados.

| Campo       | Tipo          | Descrição             |
| ----------- | ------------- | --------------------- |
| `key`       | `String` (PK) | Chave da configuração |
| `value`     | `String`      | Valor da configuração |
| `createdAt` | `DateTime`    | Data de criação       |
| `updatedAt` | `DateTime`    | Data de atualização   |

### Mapeamento de Status (Funil)

Os status são armazenados em **inglês** no banco e convertidos para **português** na API via [`STATUS_MAP`](src/types/lead.ts:19) e [`STATUS_REVERSE_MAP`](src/types/lead.ts:28).

| Banco (EN)        | Exibição (PT)    | Cor       |
| ----------------- | ---------------- | --------- |
| `PROSPECT`        | Prospecção       | `#1E3A5F` |
| `AUDIT_REQUESTED` | Audit Solicitado | `#1F7A8C` |
| `PROPOSAL_SENT`   | Proposta Enviada | `#F2C14E` |
| `CLOSED_WON`      | Fechado/Ganho    | `#22C55E` |
| `ONBOARDING`      | Onboarding       | `#3B82F6` |
| `DELINQUENT`      | Inadimplente     | `#EF4444` |

### Script de Seed ([`seed.ts`](seed.ts))

Cria um ambiente de desenvolvimento inicial:

```bash
npx tsx seed.ts
```

**Dados criados:**

- Organization: "Soberior Admin"
- User ADMIN: `suporte@soberior.com` / `soberior123`

---

## 5. Autenticação e Autorização

### Fluxo de Autenticação

1. **Login**: Usuário envia email + senha via formulário em [`/login`](src/app/login/page.tsx)
2. **Validação**: [`NextAuth`](src/app/api/auth/[...nextauth]/route.ts) busca o usuário no Prisma e compara hash com bcrypt
3. **JWT**: Gera token JWT com `id`, `role` e `organizationId`
4. **Sessão**: Cliente armazena o token e envia em requisições subsequentes

### Roles

| Role     | Acesso                                               |
| -------- | ---------------------------------------------------- |
| `ADMIN`  | Painel admin completo (Kanban, Leads, Configurações) |
| `CLIENT` | Portal do cliente (Dashboard, Documentos, Faturas)   |

### Tipos Estendidos ([`src/types/next-auth.d.ts`](src/types/next-auth.d.ts))

```typescript
interface User {
  role: string;
  organizationId: string | null;
}

interface Session {
  user: {
    id: string;
    email: string;
    role: string;
    organizationId: string | null;
  };
}
```

---

## 6. API Endpoints

### Leads

| Método  | Rota                                                               | Descrição                             | Autenticação |
| ------- | ------------------------------------------------------------------ | ------------------------------------- | ------------ |
| `GET`   | [`/api/leads`](src/app/api/leads/route.ts)                         | Lista todos os leads com organization | Sessão       |
| `POST`  | [`/api/leads`](src/app/api/leads/route.ts)                         | Cria lead + organização em transação  | Sessão       |
| `PATCH` | [`/api/leads/[id]/status`](src/app/api/leads/[id]/status/route.ts) | Atualiza status do lead               | Sessão       |

### Inteligência Artificial

| Método | Rota                                                         | Descrição                                         | Autenticação |
| ------ | ------------------------------------------------------------ | ------------------------------------------------- | ------------ |
| `POST` | [`/api/ai/enrich-lead`](src/app/api/ai/enrich-lead/route.ts) | Enriquece lead com DeepSeek (score + lostRevenue) | Sessão       |

### Configurações

| Método | Rota                                         | Descrição                        | Autenticação |
| ------ | -------------------------------------------- | -------------------------------- | ------------ |
| `GET`  | [`/api/config`](src/app/api/config/route.ts) | Status de todas as configurações | Sessão       |
| `PUT`  | [`/api/config`](src/app/api/config/route.ts) | Salva configurações de serviços  | Sessão       |

### Assinatura Digital (2FA)

| Método | Rota                                                                         | Descrição                            | Autenticação |
| ------ | ---------------------------------------------------------------------------- | ------------------------------------ | ------------ |
| `POST` | [`/api/signature/generate-2fa`](src/app/api/signature/generate-2fa/route.ts) | Gera código 2FA e envia via WhatsApp | —            |
| `POST` | [`/api/signature/validate-2fa`](src/app/api/signature/validate-2fa/route.ts) | Valida código 2FA                    | —            |

### Webhooks

| Método | Rota                                                       | Descrição                            | Autenticação  |
| ------ | ---------------------------------------------------------- | ------------------------------------ | ------------- |
| `POST` | [`/api/webhook/n8n`](src/app/api/webhook/n8n/route.ts)     | Recebe leads do n8n e cria no banco  | Secret header |
| `POST` | [`/api/webhook/asaas`](src/app/api/webhook/asaas/route.ts) | Recebe eventos de pagamento do Asaas | —             |

### Projetos

| Método | Rota                                                                                   | Descrição                 | Autenticação |
| ------ | -------------------------------------------------------------------------------------- | ------------------------- | ------------ |
| `POST` | [`/api/projects/trigger-onboarding`](src/app/api/projects/trigger-onboarding/route.ts) | Dispara onboarding no n8n | Sessão       |

### Portal do Cliente

| Método | Rota                                                             | Descrição             | Autenticação    |
| ------ | ---------------------------------------------------------------- | --------------------- | --------------- |
| `GET`  | [`/api/portal/dashboard`](src/app/api/portal/dashboard/route.ts) | Dashboard do cliente  | Sessão (CLIENT) |
| `GET`  | [`/api/portal/documents`](src/app/api/portal/documents/route.ts) | Documentos do cliente | Sessão (CLIENT) |
| `GET`  | [`/api/portal/invoices`](src/app/api/portal/invoices/route.ts)   | Faturas do cliente    | Sessão (CLIENT) |

### Formato de Resposta Padrão ([`ApiResponse`](src/types/api.ts:1))

```typescript
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## 7. Componentes da UI

### Layout

| Componente                                                   | Arquivo                                                                    | Descrição |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- | --------- |
| [`Sidebar`](src/components/layout/sidebar.tsx)               | Sidebar administrativa com navegação (Dashboard, Novo Lead, Configurações) |
| [`Header`](src/components/layout/header.tsx)                 | Header com título, descrição e ação opcional                               |
| [`AuthProvider`](src/components/providers/auth-provider.tsx) | Wrapper do `SessionProvider` do NextAuth                                   |

### Kanban

| Componente                                                       | Arquivo                                                          | Descrição |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- | --------- |
| [`KanbanBoard`](src/components/kanban/kanban-board.tsx)          | Quadro Kanban completo com DndContext, drag & drop entre colunas |
| [`KanbanColumn`](src/components/kanban/kanban-column.tsx)        | Coluna do Kanban com droppable area e SortableContext            |
| [`KanbanCard`](src/components/kanban/kanban-card.tsx)            | Card de lead arrastável com métricas (score, lostRevenue)        |
| [`LeadDetailModal`](src/components/kanban/lead-detail-modal.tsx) | Modal de detalhes do lead com ações (enriquecer IA, aprovar)     |

### Formulários

| Componente                                       | Arquivo                                      | Descrição |
| ------------------------------------------------ | -------------------------------------------- | --------- |
| [`LeadForm`](src/components/forms/lead-form.tsx) | Formulário de cadastro de lead com validação |

### Configurações

| Componente                                                            | Arquivo                                         | Descrição |
| --------------------------------------------------------------------- | ----------------------------------------------- | --------- |
| [`ServiceCard`](src/components/settings/service-card.tsx)             | Card reutilizável com status e teste de conexão |
| [`DeepSeekSettings`](src/components/settings/deepseek-settings.tsx)   | Configuração da DeepSeek API                    |
| [`EvolutionSettings`](src/components/settings/evolution-settings.tsx) | Configuração da Evolution API (WhatsApp)        |
| [`AsaasSettings`](src/components/settings/asaas-settings.tsx)         | Configuração do Asaas (pagamentos)              |
| [`N8nSettings`](src/components/settings/n8n-settings.tsx)             | Configuração do n8n (automação)                 |

### UI Base (shadcn/ui)

| Componente                                            | Arquivo                          | Descrição |
| ----------------------------------------------------- | -------------------------------- | --------- |
| [`Badge`](src/components/ui/badge.tsx)                | Badge com variantes              |
| [`Button`](src/components/ui/button.tsx)              | Botão com variantes              |
| [`Card`](src/components/ui/card.tsx)                  | Card com header, content, footer |
| [`Dialog`](src/components/ui/dialog.tsx)              | Modal dialog                     |
| [`DropdownMenu`](src/components/ui/dropdown-menu.tsx) | Menu dropdown                    |
| [`Input`](src/components/ui/input.tsx)                | Campo de input                   |
| [`Label`](src/components/ui/label.tsx)                | Label de formulário              |
| [`Select`](src/components/ui/select.tsx)              | Select dropdown                  |
| [`Separator`](src/components/ui/separator.tsx)        | Linha separadora                 |
| [`Sheet`](src/components/ui/sheet.tsx)                | Painel lateral                   |
| [`Skeleton`](src/components/ui/skeleton.tsx)          | Skeleton loader                  |
| [`Sonner`](src/components/ui/sonner.tsx)              | Toast notifications              |
| [`Switch`](src/components/ui/switch.tsx)              | Toggle switch                    |
| [`Tabs`](src/components/ui/tabs.tsx)                  | Abas de navegação                |

---

## 8. Fluxos do Sistema

### 8.1 Fluxo de Kanban (Drag & Drop)

```
[KanbanBoard] carrega leads via GET /api/leads
       │
       ▼
Leads agrupados em colunas por status (CANVAS_ORDER)
       │
       ▼
Usuário arrasta card para nova coluna
       │
       ▼
handleDragEnd → optimistic update no state
       │
       ▼
PATCH /api/leads/[id]/status { status: "NovoStatus" }
       │
       ▼
Sucesso? → mantém alteração
Erro?   → reverte optimistic update + toast
```

### 8.2 Fluxo de Enriquecimento com IA

```
Usuário clica em "Analisar com IA" no LeadDetailModal
       │
       ▼
POST /api/ai/enrich-lead { leadId }
       │
       ▼
1. Busca Lead + Organization no Prisma
2. Simula scraping do site (gera HTML simulado)
3. Chama DeepSeek API via OpenAI SDK
4. DeepSeek retorna { score, lostRevenue }
5. Persiste no banco via Prisma
       │
       ▼
KanbanBoard atualiza card com novos dados
```

### 8.3 Fluxo de Aprovação e Onboarding

```
Usuário clica em "Aprovar e Iniciar Onboarding"
       │
       ├── 1. PATCH /api/leads/[id]/status { status: "Fechado/Ganho" }
       │
       ├── 2. POST /api/projects/trigger-onboarding { organizationId }
       │        │
       │        ├── Busca Organization + Leads + Subscriptions
       │        ├── Envia webhook para n8n (GENERATE_DOCS)
       │        └── Cria Project com stage "ONBOARDING"
       │
       └── 3. Toast de sucesso + atualização do board
```

### 8.4 Fluxo de Assinatura Digital (2FA)

```
1. POST /api/signature/generate-2fa
   ├── Gera código de 6 dígitos
   ├── Salva no User.twoFactorCode com expiração (5 min)
   └── Envia código via Evolution API (WhatsApp)

2. POST /api/signature/validate-2fa
   ├── Busca código armazenado
   ├── Verifica expiração
   ├── Compara código
   └── Retorna sucesso/erro
```

### 8.5 Fluxo de Kill Switch (Inadimplência)

```
Asaas envia webhook PAYMENT_OVERDUE
       │
       ▼
POST /api/webhook/asaas
       │
       ├── Busca Subscription pelo asaasId
       ├── Calcula dias úteis de atraso
       │
       ├── ≤ 5 dias → ignora (limiar não atingido)
       │
       └── > 5 dias → KILL SWITCH
            ├── Desativa Organization (isActive = false)
            ├── Atualiza Subscription para OVERDUE
            └── Notifica n8n (fire-and-forget)
```

### 8.6 Fluxo de Criação de Lead via Webhook n8n

```
n8n envia POST /api/webhook/n8n
       │
       ├── Valida webhook secret (header x-webhook-secret)
       ├── Valida campos obrigatórios (nome, empresa, telefone)
       ├── Cria Organization + Lead em transação Prisma
       └── Retorna leadId criado
```

---

## 9. Sistema de Configuração

### Arquitetura

O sistema de configuração substituiu o modelo original baseado em Google Sheets por um sistema persistido em banco de dados.

### Fluxo de Leitura ([`getConfigValue()`](src/lib/config-manager.ts:38))

```
Solicitação de valor para chave X
       │
       ├── 1. Cache em memória (configCache Map)
       │   └── Se existe → retorna
       │
       ├── 2. process.env (fallback)
       │   └── Se existe → popula cache e retorna
       │
       └── 3. Tabela SystemConfig no PostgreSQL
           └── Se existe → popula cache + process.env e retorna
```

### Fluxo de Escrita ([`saveConfigs()`](src/lib/config-manager.ts:114))

```
PUT /api/config recebe payload
       │
       ├── Para cada chave:
       │   ├── prisma.systemConfig.upsert()
       │   ├── Atualiza cache em memória
       │   └── Sincroniza process.env
       │
       └── Retorna sucesso
```

### Chaves de Configuração ([`ConfigKey`](src/types/config.ts:15))

| Chave                | Descrição                           |
| -------------------- | ----------------------------------- |
| `DEEPSEEK_API_KEY`   | Chave da API DeepSeek               |
| `DEEPSEEK_MODEL`     | Modelo (ex: deepseek-chat)          |
| `EVOLUTION_API_URL`  | URL da instância Evolution API      |
| `EVOLUTION_API_KEY`  | API Key da Evolution API            |
| `ASAAS_API_KEY`      | API Key do Asaas                    |
| `N8N_WEBHOOK_SECRET` | Secret para validar webhooks do n8n |

---

## 10. Integrações

### DeepSeek AI ([`src/lib/deepseek-api.ts`](src/lib/deepseek-api.ts))

- **SDK**: OpenAI SDK (compatível com DeepSeek)
- **Endpoint**: `https://api.deepseek.com`
- **Funções**:
  - `analyzeLead(htmlContent)` → analisa HTML e retorna `{ score, lostRevenue }`
  - `testDeepSeekConnection(apiKey)` → testa conectividade
- **Timeout**: 30s

### Evolution API (WhatsApp) ([`src/lib/evolution-api.ts`](src/lib/evolution-api.ts))

- **Endpoint**: Configurável via settings
- **Funções**:
  - `sendWhatsAppMessage(phone, text)` → envia mensagem de texto
  - `testEvolutionConnection(apiUrl, apiKey)` → testa conectividade
- **Timeout**: 10s
- **Instância padrão**: `soberior`

### Asaas (Pagamentos)

- **Webhook**: [`POST /api/webhook/asaas`](src/app/api/webhook/asaas/route.ts)
- **Eventos processados**: `PAYMENT_OVERDUE` (Kill Switch)
- **Eventos ignorados**: `PAYMENT_RECEIVED` e outros
- **Funcionalidade**: Kill Switch após 5 dias úteis de atraso

### n8n (Automação)

- **Webhook de entrada**: [`POST /api/webhook/n8n`](src/app/api/webhook/n8n/route.ts) → cria leads automaticamente
- **Webhook de saída**: Dispara onboarding em [`trigger-onboarding`](src/app/api/projects/trigger-onboarding/route.ts)
- **Autenticação**: Header `x-webhook-secret` com secret configurável

---

## 11. Design System

### Paleta de Cores

| Token              | Hex       | Uso                         |
| ------------------ | --------- | --------------------------- |
| `--background`     | `#0B1320` | Fundo escuro principal      |
| `--surface`        | `#143D59` | Cards e superfícies         |
| `--border`         | `#1E293B` | Bordas                      |
| `--accent`         | `#F2C14E` | Dourado (ação principal)    |
| `--text-secondary` | `#94A3B8` | Texto secundário            |
| `--info`           | `#1F7A8C` | Links e badges informativos |
| `--success`        | `#10B981` | Sucesso (verde)             |
| `--danger`         | `#EF4444` | Erro/perigo (vermelho)      |

### Tipografia

- **Fontes**: Work Sans (títulos), Space Mono (dados técnicos)
- **Configuração**: Definida em [`layout.tsx`](src/app/layout.tsx) via Google Fonts com `display: swap`
- **Tamanhos**: `text-xs` (labels), `text-sm` (corpo), `text-lg`/`text-xl` (títulos)
- **`font-mono`**: Para CNPJ, valores monetários, IDs, códigos

### Tema

- Tema **dark** forçado via [`next-themes`](src/app/layout.tsx:42)
- `forcedTheme="dark"` no ThemeProvider
- Classes utilitárias Tailwind CSS 4

---

## 12. Guia de Desenvolvimento

### Pré-requisitos

- Node.js 20+
- PostgreSQL 14+
- npm ou bun

### Setup Inicial

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais PostgreSQL

# 3. Executar migrations Prisma
npx prisma db push

# 4. Gerar Prisma Client
npx prisma generate

# 5. Seed do banco (opcional)
npx tsx seed.ts

# 6. Iniciar dev server
npm run dev
```

### Comandos Disponíveis

| Comando               | Descrição                                        |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Inicia servidor de desenvolvimento com Turbopack |
| `npm run build`       | Build de produção                                |
| `npm run start`       | Inicia servidor de produção                      |
| `npm run lint`        | Executa ESLint                                   |
| `npx prisma db push`  | Sincroniza schema com banco                      |
| `npx prisma generate` | Gera Prisma Client                               |
| `npx prisma studio`   | Abre Prisma Studio (UI do banco)                 |
| `npx tsx seed.ts`     | Executa seed do banco                            |

### Estrutura de um Componente

```typescript
"use client"; // Se precisar de hooks/browser APIs

import { useState } from "react";
// Componentes shadcn/ui
import { Button } from "@/components/ui/button";
// Ícones
import { Plus } from "lucide-react";

interface Props {
  // Props do componente
}

export function MeuComponente({ ...props }: Props) {
  // Lógica do componente

  return (
    // JSX
  );
}
```

### Padrões de API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiResponse } from "@/types/api";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    // Lógica
    return NextResponse.json({ success: true, data: ... });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Mensagem de erro" },
      { status: 500 }
    );
  }
}
```

---

## 13. Guia de Implantação

### Variáveis de Ambiente Obrigatórias ([`.env.example`](.env.example))

```env
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/soberior_os

# Autenticação
NEXTAUTH_SECRET=<gerado via: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

### Variáveis de Ambiente Opcionais

```env
# DeepSeek (fallback se não configurado via UI)
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_MODEL=deepseek-chat

# Evolution API (fallback)
EVOLUTION_API_URL=https://...
EVOLUTION_API_KEY=...

# Asaas (fallback)
ASAAS_API_KEY=$aas_...

# n8n (fallback)
N8N_WEBHOOK_SECRET=...

# URLs de webhook n8n (configuração direta)
N8N_WEBHOOK_URL=https://...
N8N_WEBHOOK_URL_KILLSWITCH=https://...
```

### Passos para Produção

1. Configure o banco PostgreSQL
2. Defina `NEXTAUTH_SECRET` e `NEXTAUTH_URL`
3. Execute `npm run build`
4. Inicie com `npm start`
5. Acesse `/settings` para configurar integrações via UI

---

## 14. Segurança

### Práticas Implementadas

| Prática               | Implementação                                                   |
| --------------------- | --------------------------------------------------------------- |
| **Hash de senhas**    | bcrypt com salt rounds = 10                                     |
| **JWT Stateless**     | NextAuth com estratégia JWT (sem refresh token)                 |
| **Autenticação 2FA**  | Código de 6 dígitos via WhatsApp com expiração de 5 minutos     |
| **Proteção de rotas** | Middleware [`proxy.ts`](src/proxy.ts) verifica token JWT e role |
| **Webhook seguro**    | Header `x-webhook-secret` validado contra config                |
| **Config segura**     | API keys armazenadas no banco (não em código-fonte)             |
| **UUID**              | IDs únicos não enumeráveis                                      |
| **SQL Injection**     | Prevenido pelo Prisma ORM (query parametrizada)                 |

### Boas Práticas Recomendadas

- [ ] Configurar rate limiting nas rotas de API
- [ ] Implementar refresh tokens para sessões longas
- [ ] Adicionar headers de segurança (CSP, HSTS, etc.)
- [ ] Logs de auditoria para ações sensíveis
- [ ] Backup automático do banco PostgreSQL

---

## 15. Roadmap Futuro

### Features Planejadas

1. **CRUD de Usuários** — Admin convida clientes
2. **Painel de QBR** — Quarterly Business Review
3. **Modelo Document** — Upload/download no portal do cliente
4. **Relatórios** — Taxa de conversão, MRR, churn
5. **Cache Redis** — Sessões e rate limiting
6. **Testes E2E** — Playwright
7. **Multi-tenant** — Suporte a múltiplas organizações
8. **CI/CD** — GitHub Actions

---

## Apêndices

### A. Referência de Arquivos

| Arquivo                                        | Descrição                         |
| ---------------------------------------------- | --------------------------------- |
| [`package.json`](package.json)                 | Dependências e scripts            |
| [`tsconfig.json`](tsconfig.json)               | Configuração TypeScript           |
| [`next.config.ts`](next.config.ts)             | Configuração Next.js              |
| [`prisma/schema.prisma`](prisma/schema.prisma) | Schema do banco de dados          |
| [`components.json`](components.json)           | Configuração shadcn/ui            |
| [`.env.example`](.env.example)                 | Template de variáveis de ambiente |
| [`seed.ts`](seed.ts)                           | Script de seed do banco           |
| [`postcss.config.mjs`](postcss.config.mjs)     | Configuração PostCSS              |
| [`eslint.config.mjs`](eslint.config.mjs)       | Configuração ESLint               |

### B. Constantes do Sistema ([`src/config/constants.ts`](src/config/constants.ts))

| Constante                 | Valor                   | Descrição                   |
| ------------------------- | ----------------------- | --------------------------- |
| `APP_NAME`                | `"SOBERIOR"`            | Nome da aplicação           |
| `APP_TAGLINE`             | `"AI & Data Analytics"` | Subtítulo                   |
| `CODE_2FA_LENGTH`         | `6`                     | Tamanho do código 2FA       |
| `CODE_2FA_EXPIRY_SECONDS` | `300`                   | Expiração do código (5 min) |
| `EVOLUTION_API_TIMEOUT`   | `10000`                 | Timeout Evolution API (10s) |
| `DEEPSEEK_API_TIMEOUT`    | `30000`                 | Timeout DeepSeek (30s)      |

### C. Utilitário `cn()` ([`src/lib/utils.ts`](src/lib/utils.ts))

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Usado para combinar classes Tailwind condicionalmente, seguindo o padrão shadcn/ui.

---

> **Documentação gerada em:** Maio 2026  
> **Projeto:** [`crm-soberior`](./) — SOBERIOR OS v0.1.0  
> **Documento de arquitetura original:** [`plans/01-arquitetura-soberior-os.md`](plans/01-arquitetura-soberior-os.md)

# BaitaQuadra.Api

Backend em **.NET 10 (ASP.NET Core)** para o front Angular do BaitaQuadra.
Banco de dados: **Supabase (PostgreSQL)** via Entity Framework Core + Npgsql.
Autenticação: JWT Bearer.

## 1. Preparar o banco no Supabase

1. Abra o projeto no Supabase → **SQL Editor** → *New query*.
2. Cole e execute [`BaitaQuadra.Api/Database/schema.sql`](BaitaQuadra.Api/Database/schema.sql).
   Ele cria as tabelas `usuarios`, `quadras`, `clientes` e `reservas` e liga RLS
   (sem políticas), de modo que a chave *anon* do front não acessa mais as tabelas
   diretamente — todo acesso passa pela API.
   > Em ambiente `Development` a API também aplica esse script sozinha ao iniciar
   > (`Database:AplicarSchema`) e insere dados de exemplo (`Database:Seed`).
   > Se já existirem tabelas antigas `clientes`/`quadras`/`reservas` com outras colunas,
   > renomeie ou remova-as antes, pois o script usa `create table if not exists`.

## 2. Configurar a conexão

Pegue a connection string em Supabase → **Connect** → *Session pooler* (porta 5432)
e grave-a fora do código com user-secrets:

```bash
cd backend/BaitaQuadra.Api
dotnet user-secrets set "ConnectionStrings:Supabase" "Host=aws-0-<regiao>.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<project-ref>;Password=<senha>;SSL Mode=Require"
```

Em produção use variáveis de ambiente:

| Variável | Exemplo |
|---|---|
| `ConnectionStrings__Supabase` | connection string acima |
| `Jwt__Chave` | segredo aleatório com 32+ caracteres |
| `Cors__Origens__0` | `https://seu-front.vercel.app` |

> Evite o *Transaction pooler* (porta 6543): ele não suporta prepared statements usados pelo Npgsql.

## 3. Rodar

```bash
dotnet run --project backend/BaitaQuadra.Api --launch-profile http
```

API em `http://localhost:5080` · OpenAPI em `http://localhost:5080/openapi/v1.json` (Development).
Usuário inicial (seed): `admin@baitaquadra.com` / `admin123` — altere em `Seed:*`.

O front já aponta para a API em `src/app/core/api.config.ts`.

## Endpoints

Todas as rotas exigem `Authorization: Bearer <token>`, exceto `POST /api/auth/login` e `GET /api/health`.
O front envia o token automaticamente (`src/app/core/auth/auth.interceptor.ts`) e volta para
`/login` quando a API responde 401.

| Método | Rota | Uso no front |
|---|---|---|
| POST | `/api/auth/login` (`?lembrar=true`) | Tela Login — `{ email, senha }` → `{ token, expiraEm, usuario }` |
| GET | `/api/auth/me` | Usuário logado |
| GET | `/api/clientes?busca=&nivel=&ordem=nome\|ultimaVisita` | Tela Clientes (formato `Cliente`) |
| GET/POST/PUT/DELETE | `/api/clientes/{id}` | "+ Adicionar Cliente" |
| GET | `/api/quadras?status=` | Tela Quadras (formato `Quadra`, ordenado por nome) |
| GET | `/api/quadras/resumo` | Cards Total / Disponível / Ocupada / Manutenção |
| GET/POST/PUT/DELETE | `/api/quadras/{id}` | "Editar" |
| PATCH | `/api/quadras/{id}/status` | `{ status: "Manutenção" }` |
| GET | `/api/reservas?data=yyyy-MM-dd&quadraId=&clienteId=&status=` | Lista de reservas |
| GET | `/api/reservas/proximos?limite=10` | Dashboard — "Próximos Jogos" |
| GET/POST/PUT/DELETE | `/api/reservas/{id}` | "Nova Reserva" / "Reservar" |
| PATCH | `/api/reservas/{id}/status` | `CONFIRMADO`, `ATRASADO`, `EM ANDAMENTO`, `CANCELADO` |
| GET | `/api/agenda?data=yyyy-MM-dd` | Tela Agenda (horas + quadras com reservas do dia) |
| GET | `/api/dashboard/resumo` | Cards do Dashboard |
| GET | `/api/dashboard/ocupacao?periodo=semana\|mes` | Gráfico "Visão Geral de Ocupação" |

Regras aplicadas nas reservas: sem sobreposição de horário na mesma quadra (409),
quadra em manutenção não aceita reserva, locação exige cliente, valor calculado pelo
`valorHora` da quadra quando não informado e status `EM ANDAMENTO` calculado
automaticamente durante o horário da reserva.

Exemplo de criação de reserva:

```json
POST /api/reservas
{ "quadraId": "…", "clienteId": "…", "tipo": "LOCAÇÃO", "inicio": "2026-10-24T09:00:00", "fim": "2026-10-24T10:30:00", "pago": true }
```

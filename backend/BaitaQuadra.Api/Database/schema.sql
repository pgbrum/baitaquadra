-- =====================================================================
-- BaitaQuadra - schema do banco (Supabase / PostgreSQL)
-- Execute no Supabase: Dashboard > SQL Editor > New query > Run.
-- Script idempotente: pode ser executado mais de uma vez.
-- =====================================================================

create extension if not exists pgcrypto;

create table if not exists public.usuarios (
    id          uuid primary key default gen_random_uuid(),
    nome        text not null,
    email       text not null unique,
    senha_hash  text not null
);

create table if not exists public.quadras (
    id          uuid primary key default gen_random_uuid(),
    nome        varchar(80) not null,
    tipo        text not null default '',
    esporte     text not null default '',
    iluminacao  text not null default '',
    dimensoes   text not null default '',
    status      text not null default 'Disponível'
                check (status in ('Disponível', 'Ocupada', 'Manutenção')),
    valor_hora  numeric(12,2) not null default 0
);

create table if not exists public.clientes (
    id             uuid primary key default gen_random_uuid(),
    nome           varchar(120) not null,
    contato        varchar(60) not null default '',
    nivel          text not null default 'Iniciante'
                   check (nivel in ('Iniciante', 'Intermédio', 'Avançado')),
    membro_desde   date not null default current_date,
    ultima_visita  date,
    saldo          numeric(12,2) not null default 0
);

create table if not exists public.reservas (
    id          uuid primary key default gen_random_uuid(),
    quadra_id   uuid not null references public.quadras(id) on delete cascade,
    cliente_id  uuid references public.clientes(id) on delete set null,
    tipo        text not null default 'LOCAÇÃO'
                check (tipo in ('LOCAÇÃO', 'AULA', 'TORNEIO')),
    titulo      text,
    descricao   text,
    inicio      timestamp without time zone not null,
    fim         timestamp without time zone not null,
    status      text not null default 'CONFIRMADO'
                check (status in ('CONFIRMADO', 'ATRASADO', 'EM ANDAMENTO', 'CANCELADO')),
    valor       numeric(12,2) not null default 0,
    pago        boolean not null default false,
    criado_em   timestamp without time zone not null default now(),
    constraint reservas_periodo_valido check (fim > inicio)
);

create index if not exists ix_reservas_quadra_inicio on public.reservas (quadra_id, inicio);
create index if not exists ix_reservas_cliente on public.reservas (cliente_id);

-- ---------------------------------------------------------------------
-- Segurança: o acesso aos dados passa a ser feito somente pela API .NET,
-- que conecta com o usuário "postgres" (ignora RLS). Com RLS ligado e sem
-- políticas, a chave anon exposta no front não consegue mais ler/escrever
-- estas tabelas diretamente pela API REST do Supabase.
-- ---------------------------------------------------------------------
alter table public.usuarios enable row level security;
alter table public.quadras  enable row level security;
alter table public.clientes enable row level security;
alter table public.reservas enable row level security;

-- =========================================================================
-- Zosa Comunicacao - Planner de Conteudo (Scrum) - schema do banco
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- =========================================================================

begin;

-- ---------- Tipos ----------
create type tipo_conteudo as enum ('reels', 'stories', 'estatico', 'trend');

create type estagio_conteudo as enum (
  'backlog',
  'sprint',
  'producao',
  'edicao',
  'pronto',
  'postado',
  'cancelado'
);

create type etapa_tempo as enum ('producao', 'edicao', 'postagem');

-- ---------- Perfis (as pessoas do time - sem login por e-mail: o acesso
-- e por senha unica compartilhada + escolher o nome, ver src/proxy.ts) ----------
create table profiles (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cor text not null default '#2CA79A',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- Contas de Instagram geridas pelo planner ----------
create table accounts (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  handle text not null unique,
  cor text not null,
  cor_bg text not null,
  created_at timestamptz not null default now()
);

-- ---------- Sprints (semana: sexta pos-almoco -> sexta seguinte pre-almoco) ----------
create table sprints (
  id uuid primary key default gen_random_uuid(),
  data_inicio date not null unique,
  data_fim date not null,
  meta text,
  created_at timestamptz not null default now()
);

-- ---------- Itens de conteudo (o "card" do calendario/quadro) ----------
create table content_items (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id),
  tipo tipo_conteudo not null,
  data_planejada date,
  evento_motivo text,
  ideia text not null,
  referencias text,
  observacoes text,
  responsavel_filmagem_id uuid references profiles (id),
  responsavel_gravacao_id uuid references profiles (id),
  responsavel_edicao_id uuid references profiles (id),
  responsavel_postagem_id uuid references profiles (id),
  estagio estagio_conteudo not null default 'backlog',
  sprint_id uuid references sprints (id),
  ordem bigint not null default 0,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_data_idx on content_items (data_planejada);
create index content_items_sprint_idx on content_items (sprint_id);
create index content_items_estagio_idx on content_items (estagio);
create index content_items_account_idx on content_items (account_id);

create function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger content_items_set_updated_at
  before update on content_items
  for each row execute procedure set_updated_at();

-- ---------- Apontamento de tempo por tarefa/pessoa ----------
create table time_logs (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references content_items (id) on delete cascade,
  user_id uuid not null references profiles (id),
  etapa etapa_tempo not null,
  inicio timestamptz not null default now(),
  fim timestamptz,
  duracao_minutos integer,
  observ text,
  created_at timestamptz not null default now()
);

create index time_logs_content_item_idx on time_logs (content_item_id);
create index time_logs_user_idx on time_logs (user_id);

-- ---------- Daily assincrono (fiz ontem / farei hoje / impedimentos) ----------
create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id),
  data date not null default (now() at time zone 'America/Sao_Paulo')::date,
  fiz_ontem text,
  farei_hoje text,
  impedimentos text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data)
);

create trigger daily_logs_set_updated_at
  before update on daily_logs
  for each row execute procedure set_updated_at();

-- =========================================================================
-- Row Level Security
--
-- Este app nao usa Supabase Auth (acesso e por senha unica + escolher o
-- nome, ver src/proxy.ts), entao toda leitura do navegador acontece com a
-- chave anon, sem sessao - por isso as policies abaixo liberam "public"
-- (cobre o role anon) em vez de "authenticated". Escrita (insert/update/
-- delete) em accounts / sprints / content_items / time_logs / daily_logs
-- acontece so pelas rotas de API do Next.js usando a service role key
-- (que ignora RLS) - ver src/lib/supabase/server.ts.
-- =========================================================================

alter table profiles enable row level security;
alter table accounts enable row level security;
alter table sprints enable row level security;
alter table content_items enable row level security;
alter table time_logs enable row level security;
alter table daily_logs enable row level security;

create policy "profiles: leitura publica"
  on profiles for select to public using (true);

create policy "accounts: leitura publica"
  on accounts for select to public using (true);

create policy "sprints: leitura publica"
  on sprints for select to public using (true);

create policy "content_items: leitura publica"
  on content_items for select to public using (true);

create policy "time_logs: leitura publica"
  on time_logs for select to public using (true);

create policy "daily_logs: leitura publica"
  on daily_logs for select to public using (true);

-- ---------- Realtime ----------
alter publication supabase_realtime add table content_items;
alter publication supabase_realtime add table time_logs;
alter publication supabase_realtime add table sprints;
alter publication supabase_realtime add table daily_logs;

-- ---------- Seed das 3 contas ----------
insert into accounts (nome, handle, cor, cor_bg) values
  ('Igreja Zōsa', '@igrejazosa', '#2CA79A', '#E3F4F1'),
  ('Life Juventude', '@lifejuventude', '#6D5DD3', '#ECE9FB'),
  ('JET School', '@jetschool', '#2E86C1', '#E4F1FA');

-- ---------- Seed do time (edite nomes/cores como preferir; para
-- adicionar/remover alguém depois, use o Table Editor → profiles) ----------
insert into profiles (nome, cor, is_admin) values
  ('Samuel', '#2E86C1', false),
  ('Braian', '#B5540B', false),
  ('Ana', '#6D5DD3', false),
  ('Matheus', '#DB2777', false),
  ('Madu (secretaria)', '#2CA79A', true);

commit;

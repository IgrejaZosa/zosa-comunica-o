-- =========================================================================
-- Migracao: adiciona a entidade "projetos" (eventos, series de pregacoes,
-- chamadas etc) - o conteudo passa a pertencer a um projeto em vez de um
-- texto livre. So adiciona estrutura aqui; a migracao dos dados existentes
-- e a remocao da coluna antiga (evento_motivo) rodam depois, separado.
-- =========================================================================

begin;

create table projetos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  descricao text,
  created_at timestamptz not null default now()
);

alter table content_items add column projeto_id uuid references projetos (id);

alter table projetos enable row level security;
create policy "projetos: leitura publica" on projetos for select to public using (true);

alter publication supabase_realtime add table projetos;

commit;

-- =========================================================================
-- Migracao: permite excluir um projeto mesmo com itens ligados a ele -
-- os itens so perdem a ligacao (projeto_id vira null), nao sao apagados.
-- =========================================================================

begin;

alter table content_items drop constraint content_items_projeto_id_fkey;
alter table content_items
  add constraint content_items_projeto_id_fkey
  foreign key (projeto_id) references projetos (id) on delete set null;

commit;

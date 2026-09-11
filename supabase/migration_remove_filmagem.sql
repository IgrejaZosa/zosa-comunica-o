-- =========================================================================
-- Migracao: "filmagem" e "gravacao" eram a mesma coisa - junta os dois
-- num so campo (gravacao) e remove filmagem. Rode UMA VEZ.
-- =========================================================================

begin;

update content_items
set responsavel_gravacao_id = responsavel_filmagem_id
where responsavel_gravacao_id is null
  and responsavel_filmagem_id is not null;

alter table content_items drop column responsavel_filmagem_id;

commit;

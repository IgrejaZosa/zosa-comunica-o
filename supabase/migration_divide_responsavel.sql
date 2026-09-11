-- =========================================================================
-- Migracao: divide "responsavel pela criacao" em filmagem / gravacao /
-- edicao. Rode isso UMA VEZ no projeto que ja tinha o schema anterior.
-- Os valores ja preenchidos de responsavel_criacao_id viram
-- responsavel_filmagem_id (quem filma é quem mais se aproxima do que
-- "criar o conteúdo" já significava); gravação e edição ficam em branco
-- pra cada item, pra preencher aos poucos.
-- =========================================================================

begin;

alter table content_items rename column responsavel_criacao_id to responsavel_filmagem_id;
alter table content_items add column responsavel_gravacao_id uuid references profiles (id);
alter table content_items add column responsavel_edicao_id uuid references profiles (id);

commit;

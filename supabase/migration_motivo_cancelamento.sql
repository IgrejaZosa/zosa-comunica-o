-- =========================================================================
-- Exclusao com motivo: um item cancelado passa a registrar POR QUE saiu do
-- plano - "perdeu_prazo" (planejado mas nao foi postado a tempo) ou
-- "descartado" (nao fazia mais sentido). Puramente aditivo - nao mexe em
-- nenhuma linha existente. Rode este arquivo inteiro no SQL Editor do
-- seu projeto Supabase.
-- =========================================================================

create type motivo_cancelamento as enum ('perdeu_prazo', 'descartado');

alter table content_items add column motivo_cancelamento motivo_cancelamento;

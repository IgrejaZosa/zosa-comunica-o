-- =========================================================================
-- Adiciona duas novas naturezas de conteudo: Video Institucional e Zosa News.
-- Puramente aditivo (so acrescenta valores ao enum existente) - nao
-- mexe em nenhuma linha ja existente. Rode este arquivo inteiro no SQL
-- Editor do seu projeto Supabase.
-- =========================================================================

alter type tipo_conteudo add value 'institucional';
alter type tipo_conteudo add value 'zosa_news';

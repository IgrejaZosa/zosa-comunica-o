-- =========================================================================
-- Migracao: uma "entrega" agora conta qualquer atribuicao (gravacao,
-- edicao OU postagem), nao so a postagem final. Adiciona o mesmo
-- rastreamento de "responsavel original" (ja existia so pra postagem)
-- tambem pra gravacao e edicao, e substitui o trigger antigo por um que
-- cuida dos 3 papeis.
-- =========================================================================

begin;

alter table content_items add column responsavel_gravacao_original_id uuid references profiles (id);
alter table content_items add column responsavel_edicao_original_id uuid references profiles (id);

-- backfill: sem historico anterior, assume que quem esta la agora foi
-- quem foi definido originalmente
update content_items
set responsavel_gravacao_original_id = responsavel_gravacao_id
where responsavel_gravacao_id is not null;

update content_items
set responsavel_edicao_original_id = responsavel_edicao_id
where responsavel_edicao_id is not null;

drop trigger if exists content_items_capturar_postagem_original on content_items;
drop function if exists capturar_responsavel_postagem_original();

create function capturar_responsaveis_originais()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.responsavel_gravacao_id is not null then
      new.responsavel_gravacao_original_id := new.responsavel_gravacao_id;
    end if;
    if new.responsavel_edicao_id is not null then
      new.responsavel_edicao_original_id := new.responsavel_edicao_id;
    end if;
    if new.responsavel_postagem_id is not null then
      new.responsavel_postagem_original_id := new.responsavel_postagem_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if old.responsavel_gravacao_original_id is not null then
      new.responsavel_gravacao_original_id := old.responsavel_gravacao_original_id;
    elsif new.responsavel_gravacao_id is not null then
      new.responsavel_gravacao_original_id := new.responsavel_gravacao_id;
    end if;

    if old.responsavel_edicao_original_id is not null then
      new.responsavel_edicao_original_id := old.responsavel_edicao_original_id;
    elsif new.responsavel_edicao_id is not null then
      new.responsavel_edicao_original_id := new.responsavel_edicao_id;
    end if;

    if old.responsavel_postagem_original_id is not null then
      new.responsavel_postagem_original_id := old.responsavel_postagem_original_id;
    elsif new.responsavel_postagem_id is not null then
      new.responsavel_postagem_original_id := new.responsavel_postagem_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger content_items_capturar_responsaveis_originais
  before insert or update on content_items
  for each row execute procedure capturar_responsaveis_originais();

commit;

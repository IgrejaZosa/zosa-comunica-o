-- =========================================================================
-- Migracao: guarda quem foi o responsavel pela postagem ORIGINALMENTE
-- definido (a primeira vez que o campo foi preenchido), separado de quem
-- esta la agora - isso permite o indicador de entregas detectar quando
-- a pessoa que realmente postou mudou em relacao ao planejado.
-- =========================================================================

begin;

alter table content_items add column responsavel_postagem_original_id uuid references profiles (id);

-- backfill: para itens que ja tem alguem em "postagem", assume que e
-- tambem quem foi planejado originalmente (nao ha historico anterior)
update content_items
set responsavel_postagem_original_id = responsavel_postagem_id
where responsavel_postagem_id is not null;

create function capturar_responsavel_postagem_original()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if new.responsavel_postagem_id is not null then
      new.responsavel_postagem_original_id := new.responsavel_postagem_id;
    end if;
  elsif TG_OP = 'UPDATE' then
    if old.responsavel_postagem_original_id is not null then
      new.responsavel_postagem_original_id := old.responsavel_postagem_original_id;
    elsif new.responsavel_postagem_id is not null then
      new.responsavel_postagem_original_id := new.responsavel_postagem_id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger content_items_capturar_postagem_original
  before insert or update on content_items
  for each row execute procedure capturar_responsavel_postagem_original();

commit;

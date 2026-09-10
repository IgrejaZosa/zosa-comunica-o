-- =========================================================================
-- Migracao: remove a dependencia do Supabase Auth (o app agora usa senha
-- unica + escolher o nome, nao mais e-mail/senha por pessoa).
-- Rode isso UMA VEZ no projeto que ja tinha o schema antigo aplicado.
-- =========================================================================

begin;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists handle_new_user();

drop trigger if exists profiles_protege_campos_sensiveis on profiles;
drop function if exists proteger_campos_sensiveis_profile();

alter table profiles drop constraint if exists profiles_id_fkey;
alter table profiles alter column id set default gen_random_uuid();
alter table profiles drop column if exists email;

drop policy if exists "profiles: leitura para autenticados" on profiles;
drop policy if exists "profiles: usuario edita o proprio nome/cor" on profiles;
drop policy if exists "accounts: leitura para autenticados" on accounts;
drop policy if exists "sprints: leitura para autenticados" on sprints;
drop policy if exists "content_items: leitura para autenticados" on content_items;
drop policy if exists "time_logs: leitura para autenticados" on time_logs;
drop policy if exists "daily_logs: leitura para autenticados" on daily_logs;

create policy "profiles: leitura publica" on profiles for select to public using (true);
create policy "accounts: leitura publica" on accounts for select to public using (true);
create policy "sprints: leitura publica" on sprints for select to public using (true);
create policy "content_items: leitura publica" on content_items for select to public using (true);
create policy "time_logs: leitura publica" on time_logs for select to public using (true);
create policy "daily_logs: leitura publica" on daily_logs for select to public using (true);

-- adiciona quem ainda nao existe (a secretaria ja foi criada antes)
insert into profiles (nome, cor, is_admin)
select 'Samuel', '#2E86C1', false
where not exists (select 1 from profiles where nome = 'Samuel');

insert into profiles (nome, cor, is_admin)
select 'Braian', '#B5540B', false
where not exists (select 1 from profiles where nome = 'Braian');

insert into profiles (nome, cor, is_admin)
select 'Ana', '#6D5DD3', false
where not exists (select 1 from profiles where nome = 'Ana');

commit;

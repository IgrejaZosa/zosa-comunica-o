# Planejamento de Conteúdo - Comunicação (Zōsa)

Planner visual do conteúdo das redes sociais da Igreja Zōsa (@igrejazosa,
@lifejuventude, @jetschool): calendário, quadro Scrum, backlog mensal,
sprint semanal com daily e meta, apontamento de tempo por tarefa/pessoa e
indicadores de produção. Multiusuário, online, atualiza em tempo real para
todo mundo que estiver com a tela aberta.

## Acesso

Sem login por e-mail: uma **senha única** (compartilhada por WhatsApp, tipo
senha de Wi-Fi) libera o app, e depois cada pessoa escolhe seu nome numa
telinha rápida ("Quem é você?") — isso é só o que aparece como
responsável/quem apontou tempo, não é uma conta de verdade. Pensado pra
poucas pessoas com o link.

## Como o app corresponde ao processo do time

- **Product Backlog** = planejamento mensal (tela **Backlog Mensal**).
- **Sprint** = semana, de sexta-feira pós-almoço à sexta-feira seguinte
  pré-almoço (tela **Sprint Atual**, com meta da sprint e daily).
- **Quadro Scrum** = tela **Quadro**, colunas A Fazer → Em Produção → Em
  Edição → Pronto p/ Postar → Postado. Arraste os cards para mover.
- **Calendário** = visão mensal de tudo que está planejado, com cores por
  tipo de conteúdo (Reels/Stories/Estático/Trend) e por conta.
- **Indicadores** = planejado x postado, tempo gasto por pessoa,
  velocidade por sprint, itens atrasados.

---

## 1. Criar o projeto no Supabase (banco de dados + tempo real)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **SQL Editor**, cole todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e rode. Isso cria as
   tabelas, o RLS, e já cadastra as 3 contas (@igrejazosa, @lifejuventude,
   @jetschool) e as 4 pessoas do time (Samuel, Braian, Ana, secretaria).
   Para adicionar/remover alguém depois, edite direto em **Table Editor →
   profiles** — não precisa de e-mail nem senha por pessoa.
3. Em **Project Settings → API**, copie para `.env.local` (baseado no
   [`.env.example`](.env.example)):
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` / `publishable` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` / `secret` key (⚠️ nunca exponha no navegador) →
     `SUPABASE_SERVICE_ROLE_KEY`
4. Escolha a senha única de acesso ao app e coloque em
   `APP_ACCESS_PASSWORD` no `.env.local`.

---

## 2. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## 3. Deploy (Netlify)

1. Suba este projeto para um repositório novo no GitHub.
2. No Netlify, **Add new site → Import an existing project**, aponte para
   o repositório.
3. Em **Site settings → Environment variables**, cadastre as 4 variáveis
   do `.env.local` (as 3 do Supabase + `APP_ACCESS_PASSWORD`).
4. Deploy automático a cada push na `main`.

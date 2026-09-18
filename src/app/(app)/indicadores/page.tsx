"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAllTimeLogs, useContentItems, useSprints } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { formatarPeriodoSprint } from "@/lib/sprint";
import {
  PERIODICIDADES,
  PERIODICIDADE_LABELS,
  formatarPeriodo,
  fracaoDecorrida,
  navegarPeriodo,
  periodoAtual,
  type Periodicidade,
} from "@/lib/periodo";
import { Velocimetro, type StatusVelocimetro } from "@/components/Velocimetro";
import { AINDA_PRECISA_EDITAR, AINDA_PRECISA_GRAVAR } from "@/lib/prazos";
import {
  ESTAGIO_LABELS,
  ESTAGIO_QUADRO,
  TIPO_COLORS,
  TIPO_LABELS,
  type ContentItem,
  type Estagio,
  type TipoConteudo,
} from "@/lib/types";

/** Uma "entrega" conta qualquer papel atribuído à pessoa - gravação,
 * edição ou postagem - não só quem posta no final. */
const PAPEIS_ENTREGA: {
  atual: "responsavel_gravacao_id" | "responsavel_edicao_id" | "responsavel_postagem_id";
  original: "responsavel_gravacao_original_id" | "responsavel_edicao_original_id" | "responsavel_postagem_original_id";
  label: string;
}[] = [
  { atual: "responsavel_gravacao_id", original: "responsavel_gravacao_original_id", label: "Gravação" },
  { atual: "responsavel_edicao_id", original: "responsavel_edicao_original_id", label: "Edição" },
  { atual: "responsavel_postagem_id", original: "responsavel_postagem_original_id", label: "Postagem" },
];

const RESPONSAVEIS_ITEM = [
  "responsavel_gravacao_id",
  "responsavel_edicao_id",
  "responsavel_postagem_id",
] as const;

export default function IndicadoresPage() {
  const { items } = useContentItems();
  const timeLogs = useAllTimeLogs();
  const sprints = useSprints();
  const { profiles } = useSession();

  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mes");
  const [refIso, setRefIso] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [pessoaFiltro, setPessoaFiltro] = useState<string | null>(null);

  const periodo = useMemo(() => periodoAtual(periodicidade, refIso), [periodicidade, refIso]);
  const labelPeriodo = useMemo(
    () => formatarPeriodo(periodicidade, periodo.inicio, periodo.fim),
    [periodicidade, periodo]
  );

  function trocarPeriodicidade(tipo: Periodicidade) {
    setPeriodicidade(tipo);
    setRefIso(format(new Date(), "yyyy-MM-dd"));
  }

  function navegar(direcao: 1 | -1) {
    setRefIso((atual) => navegarPeriodo(periodicidade, atual, direcao));
  }

  const itemsDoPeriodo = useMemo(
    () => items.filter((i) => i.data_planejada && i.data_planejada >= periodo.inicio && i.data_planejada < periodo.fim),
    [items, periodo]
  );

  const planejadoXPostado = useMemo(() => {
    return (Object.keys(TIPO_LABELS) as TipoConteudo[]).map((tipo) => {
      const doTipo = itemsDoPeriodo.filter((i) => i.tipo === tipo);
      return {
        tipo: TIPO_LABELS[tipo],
        planejado: doTipo.length,
        postado: doTipo.filter((i) => i.estagio === "postado").length,
        cor: TIPO_COLORS[tipo].fg,
      };
    });
  }, [itemsDoPeriodo]);

  const porEstagio = useMemo(() => {
    return ESTAGIO_QUADRO.map((estagio) => ({
      estagio: ESTAGIO_LABELS[estagio],
      total: itemsDoPeriodo.filter((i) => i.estagio === estagio).length,
    }));
  }, [itemsDoPeriodo]);

  const tempoPorPessoa = useMemo(() => {
    const doPeriodo = timeLogs.filter(
      (l) => l.duracao_minutos && l.inicio.slice(0, 10) >= periodo.inicio && l.inicio.slice(0, 10) < periodo.fim
    );
    const mapa = new Map<string, number>();
    for (const log of doPeriodo) {
      mapa.set(log.user_id, (mapa.get(log.user_id) ?? 0) + (log.duracao_minutos ?? 0));
    }
    return profiles
      .filter((p) => !pessoaFiltro || p.id === pessoaFiltro)
      .map((p) => {
        const minutos = mapa.get(p.id) ?? 0;
        return { nome: p.nome, horas: Math.round((minutos / 60) * 10) / 10, minutos };
      })
      .filter((p) => p.minutos > 0);
  }, [timeLogs, profiles, periodo, pessoaFiltro]);

  const velocidadePorSprint = useMemo(() => {
    return sprints
      .slice(0, 8)
      .reverse()
      .map((s) => ({
        sprint: formatarPeriodoSprint(s.data_inicio, s.data_fim),
        concluidos: items.filter((i) => i.sprint_id === s.id && i.estagio === "postado").length,
        total: items.filter((i) => i.sprint_id === s.id).length,
      }));
  }, [sprints, items]);

  const totalMacro = useMemo(
    () => ({
      planejado: itemsDoPeriodo.length,
      postado: itemsDoPeriodo.filter((i) => i.estagio === "postado").length,
      gravacoesPendentes: itemsDoPeriodo.filter((i) => AINDA_PRECISA_GRAVAR.has(i.estagio)).length,
      edicoesPendentes: itemsDoPeriodo.filter((i) => AINDA_PRECISA_EDITAR.has(i.estagio)).length,
    }),
    [itemsDoPeriodo]
  );

  const entregasPorPessoaTudo = useMemo(() => {
    return profiles.map((pessoa) => {
      let previsto = 0;
      let realizado = 0;
      const trocas: { item: ContentItem; papel: string; assumidoPorId: string | null }[] = [];
      for (const item of itemsDoPeriodo) {
        for (const { atual, original, label } of PAPEIS_ENTREGA) {
          if (item[original] !== pessoa.id) continue;
          previsto++;
          if (item.estagio === "postado") realizado++;
          if (item[atual] && item[atual] !== item[original]) {
            trocas.push({ item, papel: label, assumidoPorId: item[atual] });
          }
        }
      }
      return { pessoa, previsto, realizado, trocas };
    });
  }, [itemsDoPeriodo, profiles]);

  const entregasPorPessoa = useMemo(
    () => entregasPorPessoaTudo.filter((p) => (pessoaFiltro ? p.pessoa.id === pessoaFiltro : p.previsto > 0)),
    [entregasPorPessoaTudo, pessoaFiltro]
  );

  const hojeStr = format(new Date(), "yyyy-MM-dd");
  const atrasados = useMemo(
    () =>
      items
        .filter((i) => i.data_planejada && i.data_planejada < hojeStr && !["postado", "cancelado"].includes(i.estagio))
        .filter((i) => !pessoaFiltro || RESPONSAVEIS_ITEM.some((campo) => i[campo] === pessoaFiltro))
        .sort((a, b) => (a.data_planejada! < b.data_planejada! ? -1 : 1)),
    [items, hojeStr, pessoaFiltro]
  );

  // Farol/velocímetro: time todo (planejado x postado) ou, se um filtro
  // de pessoa estiver ativo, o previsto x realizado dela mesma.
  const baseFarol = pessoaFiltro
    ? (() => {
        const p = entregasPorPessoaTudo.find((e) => e.pessoa.id === pessoaFiltro);
        return { previsto: p?.previsto ?? 0, realizado: p?.realizado ?? 0 };
      })()
    : { previsto: totalMacro.planejado, realizado: totalMacro.postado };

  const agora = new Date();
  let statusFarol: StatusVelocimetro;
  let ratioFarol: number;
  if (baseFarol.previsto === 0) {
    statusFarol = "sem-dados";
    ratioFarol = 0;
  } else if (hojeStr < periodo.inicio) {
    statusFarol = "futuro";
    ratioFarol = 0;
  } else {
    const fracao = fracaoDecorrida(periodo.inicio, periodo.fim, agora);
    const esperado = baseFarol.previsto * fracao;
    ratioFarol = esperado > 0 ? baseFarol.realizado / esperado : baseFarol.realizado > 0 ? 1 : 0;
    statusFarol = ratioFarol >= 1 ? "em-dia" : ratioFarol >= 0.7 ? "atencao" : "atrasado";
  }

  return (
    <div className="space-y-6">
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODICIDADES.map((tipo) => (
            <button
              key={tipo}
              onClick={() => trocarPeriodicidade(tipo)}
              className={periodicidade === tipo ? "btn-primary" : "btn-secondary"}
            >
              {PERIODICIDADE_LABELS[tipo]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button className="btn-secondary" onClick={() => navegar(-1)}>
              ←
            </button>
            <h1 className="text-lg font-semibold text-zosa-ink capitalize w-56 text-center">{labelPeriodo}</h1>
            <button className="btn-secondary" onClick={() => navegar(1)}>
              →
            </button>
          </div>
          <div>
            <label className="label">Pessoa</label>
            <select
              className="input min-w-[180px]"
              value={pessoaFiltro ?? ""}
              onChange={(e) => setPessoaFiltro(e.target.value || null)}
            >
              <option value="">Todo mundo</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-start gap-4">
          <div className="shrink-0 text-center px-2">
            <p className={`text-3xl font-bold ${atrasados.length > 0 ? "text-zosa-danger" : "text-zosa-teal"}`}>
              {atrasados.length}
            </p>
            <p className="text-xs text-zosa-muted whitespace-nowrap">itens atrasados</p>
          </div>
          {atrasados.length === 0 ? (
            <p className="text-sm text-zosa-muted self-center">Nada atrasado. 🎉</p>
          ) : (
            <div className="flex-1 min-w-0 flex flex-wrap gap-1.5 content-start pt-1">
              {atrasados.map((item) => (
                <span
                  key={item.id}
                  className="badge bg-zosa-dangerbg text-zosa-danger max-w-[220px] truncate"
                  title={`${item.ideia} (${ESTAGIO_LABELS[item.estagio as Estagio]})`}
                >
                  {format(parseISO(item.data_planejada!), "dd/MM")} · {item.ideia}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        <div className="card p-4 flex flex-col items-center justify-center">
          <h2 className="text-sm font-semibold text-zosa-ink mb-1 self-start">Farol da expectativa</h2>
          <Velocimetro ratio={ratioFarol} status={statusFarol} />
          <p className="text-[11px] text-zosa-muted text-center mt-1">
            {pessoaFiltro
              ? "Entregas dessa pessoa até agora vs. o que já era esperado no período."
              : "Postados até agora vs. o que já era esperado no período."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zosa-ink mb-2">Visão geral do período</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-4 bg-zosa-dark">
                <p className="text-xs font-semibold text-zosa-tealsoft">📤 Total de posts</p>
                <p className="text-2xl font-bold text-white mt-1">{totalMacro.postado}</p>
                <p className="text-xs text-zosa-tealsoft">já publicados</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold text-zosa-ink">📋 Total de demandas</p>
                <p className="text-2xl font-bold text-zosa-ink mt-1">{totalMacro.planejado}</p>
                <p className="text-xs text-zosa-muted">programadas no período</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold" style={{ color: "var(--color-zosa-teal)" }}>
                  🎥 Gravações pendentes
                </p>
                <p className="text-2xl font-bold text-zosa-ink mt-1">{totalMacro.gravacoesPendentes}</p>
                <p className="text-xs text-zosa-muted">ainda precisam ser gravadas</p>
              </div>
              <div className="card p-4">
                <p className="text-xs font-semibold" style={{ color: "var(--color-tipo-trend)" }}>
                  ✂️ Edições pendentes
                </p>
                <p className="text-2xl font-bold text-zosa-ink mt-1">{totalMacro.edicoesPendentes}</p>
                <p className="text-xs text-zosa-muted">ainda precisam ser editadas</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-zosa-ink mb-2">Por tipo de conteúdo</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {planejadoXPostado.map((r) => (
                <div key={r.tipo} className="card p-4">
                  <p className="text-xs font-semibold" style={{ color: r.cor }}>
                    {r.tipo}
                  </p>
                  <p className="text-2xl font-bold text-zosa-ink mt-1">
                    {r.postado}
                    <span className="text-base font-normal text-zosa-muted"> / {r.planejado}</span>
                  </p>
                  <p className="text-xs text-zosa-muted">entregues / programados</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-zosa-ink mb-1">Entregas por pessoa</h2>
        <p className="text-xs text-zosa-muted mb-3">
          Previsto = quantas vezes a pessoa foi atribuída (gravação, edição ou postagem) no período selecionado.
          Trocas = quantas vezes quem assumiu de fato acabou sendo outra pessoa.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs font-semibold text-zosa-muted border-b border-zosa-border">
                <th className="py-1.5 pr-4">Pessoa</th>
                <th className="py-1.5 pr-4">Previsto</th>
                <th className="py-1.5 pr-4">Realizado</th>
                <th className="py-1.5 pr-4">Trocas</th>
              </tr>
            </thead>
            <tbody>
              {entregasPorPessoa.map(({ pessoa, previsto, realizado, trocas }) => (
                <tr key={pessoa.id} className="border-b border-zosa-border last:border-0">
                  <td className="py-1.5 pr-4 font-medium text-zosa-ink">{pessoa.nome}</td>
                  <td className="py-1.5 pr-4">{previsto}</td>
                  <td className="py-1.5 pr-4">{realizado}</td>
                  <td className="py-1.5 pr-4">
                    {trocas.length > 0 ? (
                      <span className="badge bg-zosa-warnbg text-zosa-warn">{trocas.length}</span>
                    ) : (
                      <span className="text-zosa-muted">0</span>
                    )}
                  </td>
                </tr>
              ))}
              {entregasPorPessoa.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-zosa-muted">
                    Nenhuma entrega prevista neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {entregasPorPessoa.some((p) => p.trocas.length > 0) && (
          <ul className="mt-3 space-y-1 text-xs text-zosa-muted border-t border-zosa-border pt-2">
            {entregasPorPessoa.flatMap(({ pessoa, trocas }) =>
              trocas.map(({ item, papel, assumidoPorId }) => {
                const quemAssumiu = profiles.find((p) => p.id === assumidoPorId);
                return (
                  <li key={`${item.id}-${papel}`}>
                    <span className="text-zosa-ink">{item.ideia}</span> — {papel} prevista p/ {pessoa.nome}, quem
                    assumiu: <span className="font-medium text-zosa-ink">{quemAssumiu?.nome ?? "—"}</span>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Itens por estágio ({PERIODICIDADE_LABELS[periodicidade].toLowerCase()})</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porEstagio} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E5EA" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="estagio" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="total" fill="#2CA79A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">
            Tempo gasto por pessoa (horas, {PERIODICIDADE_LABELS[periodicidade].toLowerCase()})
          </h2>
          {tempoPorPessoa.length === 0 ? (
            <p className="text-sm text-zosa-muted">Nenhum apontamento de tempo neste período ainda.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tempoPorPessoa}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5EA" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="horas" fill="#6D5DD3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Velocidade por sprint (últimas 8)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={velocidadePorSprint}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5EA" />
              <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Planejados" fill="#E2E5EA" radius={[4, 4, 0, 0]} />
              <Bar dataKey="concluidos" name="Postados" fill="#1E4A45" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  ESTAGIO_LABELS,
  ESTAGIO_QUADRO,
  TIPO_COLORS,
  TIPO_LABELS,
  type ContentItem,
  type Estagio,
  type TipoConteudo,
} from "@/lib/types";

const PESSOAS_ENTREGA = ["Braian", "Samuel", "Matheus"];

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

export default function IndicadoresPage() {
  const { items } = useContentItems();
  const timeLogs = useAllTimeLogs();
  const sprints = useSprints();
  const { profiles } = useSession();
  const [mesRef, setMesRef] = useState(() => new Date());
  const mesStr = format(mesRef, "yyyy-MM");

  const itemsDoMes = useMemo(() => items.filter((i) => i.data_planejada?.startsWith(mesStr)), [items, mesStr]);

  const planejadoXPostado = useMemo(() => {
    return (Object.keys(TIPO_LABELS) as TipoConteudo[]).map((tipo) => {
      const doTipo = itemsDoMes.filter((i) => i.tipo === tipo);
      return {
        tipo: TIPO_LABELS[tipo],
        planejado: doTipo.length,
        postado: doTipo.filter((i) => i.estagio === "postado").length,
        cor: TIPO_COLORS[tipo].fg,
      };
    });
  }, [itemsDoMes]);

  const porEstagio = useMemo(() => {
    return ESTAGIO_QUADRO.map((estagio) => ({
      estagio: ESTAGIO_LABELS[estagio],
      total: itemsDoMes.filter((i) => i.estagio === estagio).length,
    }));
  }, [itemsDoMes]);

  const tempoPorPessoa = useMemo(() => {
    const doMes = timeLogs.filter((l) => l.duracao_minutos && l.inicio.startsWith(mesStr));
    const mapa = new Map<string, number>();
    for (const log of doMes) {
      mapa.set(log.user_id, (mapa.get(log.user_id) ?? 0) + (log.duracao_minutos ?? 0));
    }
    return profiles
      .map((p) => {
        const minutos = mapa.get(p.id) ?? 0;
        return { nome: p.nome, horas: Math.round((minutos / 60) * 10) / 10, minutos };
      })
      .filter((p) => p.minutos > 0);
  }, [timeLogs, profiles, mesStr]);

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
      planejado: itemsDoMes.length,
      postado: itemsDoMes.filter((i) => i.estagio === "postado").length,
    }),
    [itemsDoMes]
  );

  const entregasPorPessoa = useMemo(() => {
    return PESSOAS_ENTREGA.map((nomePessoa) => {
      const pessoa = profiles.find((p) => p.nome === nomePessoa);
      if (!pessoa) return null;
      let previsto = 0;
      let realizado = 0;
      const trocas: { item: ContentItem; papel: string; assumidoPorId: string | null }[] = [];
      for (const item of itemsDoMes) {
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
    }).filter((p): p is NonNullable<typeof p> => p !== null);
  }, [itemsDoMes, profiles]);

  const hojeStr = format(new Date(), "yyyy-MM-dd");
  const atrasados = useMemo(
    () =>
      items
        .filter((i) => i.data_planejada && i.data_planejada < hojeStr && !["postado", "cancelado"].includes(i.estagio))
        .sort((a, b) => (a.data_planejada! < b.data_planejada! ? -1 : 1)),
    [items, hojeStr]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button className="btn-secondary" onClick={() => setMesRef((m) => addMonths(m, -1))}>
          ←
        </button>
        <h1 className="text-xl font-semibold text-zosa-ink capitalize w-48 text-center">
          {format(mesRef, "MMMM yyyy", { locale: ptBR })}
        </h1>
        <button className="btn-secondary" onClick={() => setMesRef((m) => addMonths(m, 1))}>
          →
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="card p-4 bg-zosa-dark">
          <p className="text-xs font-semibold text-zosa-tealsoft">Total (todos os tipos)</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalMacro.postado}
            <span className="text-base font-normal text-zosa-tealsoft"> / {totalMacro.planejado}</span>
          </p>
          <p className="text-xs text-zosa-tealsoft">entregues / programados</p>
        </div>
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

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-zosa-ink mb-1">Entregas por pessoa (mês)</h2>
        <p className="text-xs text-zosa-muted mb-3">
          Previsto = quantas vezes a pessoa foi atribuída (gravação, edição ou postagem). Trocas = quantas vezes
          quem assumiu de fato acabou sendo outra pessoa.
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
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Itens por estágio (mês)</h2>
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
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Tempo gasto por pessoa (horas, mês)</h2>
          {tempoPorPessoa.length === 0 ? (
            <p className="text-sm text-zosa-muted">Nenhum apontamento de tempo neste mês ainda.</p>
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

      <div className="card p-4">
        <h2 className="text-sm font-semibold text-zosa-ink mb-3">
          Itens atrasados ({atrasados.length})
        </h2>
        {atrasados.length === 0 ? (
          <p className="text-sm text-zosa-muted">Nada atrasado. 🎉</p>
        ) : (
          <ul className="space-y-1">
            {atrasados.map((item) => (
              <li key={item.id} className="text-sm flex items-center gap-2">
                <span className="badge bg-zosa-dangerbg text-zosa-danger">
                  {format(parseISO(item.data_planejada!), "dd/MM")}
                </span>
                <span className="text-zosa-ink truncate">{item.ideia}</span>
                <span className="text-zosa-muted text-xs">({ESTAGIO_LABELS[item.estagio as Estagio]})</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

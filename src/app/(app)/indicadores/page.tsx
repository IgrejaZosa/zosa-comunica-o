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
  type Estagio,
  type TipoConteudo,
} from "@/lib/types";

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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Planejado x Postado (por natureza)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={planejadoXPostado}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E5EA" />
              <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="planejado" name="Planejado" fill="#5B6472" radius={[4, 4, 0, 0]} />
              <Bar dataKey="postado" name="Postado" fill="#2CA79A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

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

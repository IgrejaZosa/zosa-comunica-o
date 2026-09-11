"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContentItems, useProjetos } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { ContentCard } from "@/components/ContentCard";
import { ContentItemModal } from "@/components/ContentItemModal";
import type { ContentItem } from "@/lib/types";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarioPage() {
  const { items } = useContentItems();
  const { accounts } = useSession();
  const projetos = useProjetos();
  const [mesRef, setMesRef] = useState(() => new Date());
  const [contaFiltro, setContaFiltro] = useState<string | null>(null);
  const [projetoFiltro, setProjetoFiltro] = useState<string | null>(null);
  const [itemAberto, setItemAberto] = useState<ContentItem | "novo" | null>(null);
  const [novaData, setNovaData] = useState<string | undefined>(undefined);

  const dias = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesRef));
    const fim = endOfWeek(endOfMonth(mesRef));
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesRef]);

  const itemsFiltrados = useMemo(() => {
    return items.filter((i) => {
      if (contaFiltro && i.account_id !== contaFiltro) return false;
      if (projetoFiltro && i.projeto_id !== projetoFiltro) return false;
      return true;
    });
  }, [items, contaFiltro, projetoFiltro]);

  function itemsDoDia(dia: Date): ContentItem[] {
    return itemsFiltrados.filter((i) => i.data_planejada && isSameDay(new Date(i.data_planejada + "T12:00:00"), dia));
  }

  function abrirNovo(dia: Date) {
    setNovaData(format(dia, "yyyy-MM-dd"));
    setItemAberto("novo");
  }

  return (
    <div className="space-y-4">
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

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zosa-muted w-16 shrink-0">Contas</span>
          <button onClick={() => setContaFiltro(null)} className={!contaFiltro ? "btn" : "btn-secondary"}>
            Todas as contas
          </button>
          {accounts.map((a) => (
            <button
              key={a.id}
              onClick={() => setContaFiltro(a.id)}
              className={contaFiltro === a.id ? "btn" : "btn-secondary"}
              style={contaFiltro === a.id ? { backgroundColor: a.cor, color: "white" } : undefined}
            >
              {a.handle}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zosa-muted w-16 shrink-0">Projetos</span>
          <button onClick={() => setProjetoFiltro(null)} className={!projetoFiltro ? "btn" : "btn-secondary"}>
            Todos os projetos
          </button>
          {projetos.map((p) => (
            <button
              key={p.id}
              onClick={() => setProjetoFiltro(p.id)}
              className={projetoFiltro === p.id ? "btn" : "btn-secondary"}
            >
              {p.nome}
            </button>
          ))}
          {projetos.length === 0 && <span className="text-xs text-zosa-muted">Nenhum projeto criado ainda.</span>}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zosa-muted">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia) => {
          const doDia = itemsDoDia(dia);
          const foraDoMes = !isSameMonth(dia, mesRef);
          return (
            <div
              key={dia.toISOString()}
              className={`rounded-xl border p-1.5 min-h-[110px] flex flex-col gap-1 ${
                foraDoMes ? "bg-zosa-cream/40 border-transparent" : "bg-white border-zosa-border"
              }`}
            >
              <div className="flex items-center justify-between px-0.5">
                <span
                  className={`text-xs font-semibold ${
                    isToday(dia)
                      ? "bg-zosa-dark text-white rounded-full h-5 w-5 flex items-center justify-center"
                      : foraDoMes
                      ? "text-zosa-muted"
                      : "text-zosa-ink"
                  }`}
                >
                  {format(dia, "d")}
                </span>
                <button
                  className="text-zosa-muted hover:text-zosa-teal text-xs leading-none"
                  onClick={() => abrirNovo(dia)}
                  title="Adicionar item"
                >
                  +
                </button>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto max-h-32">
                {doDia.map((item) => (
                  <ContentCard key={item.id} item={item} onClick={() => setItemAberto(item)} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {itemAberto && (
        <ContentItemModal
          item={itemAberto === "novo" ? null : itemAberto}
          defaults={itemAberto === "novo" ? { data_planejada: novaData, estagio: "backlog" } : undefined}
          onClose={() => setItemAberto(null)}
        />
      )}
    </div>
  );
}

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
import { useContentItems } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { AINDA_PRECISA_EDITAR, AINDA_PRECISA_GRAVAR, calcularPrazos } from "@/lib/prazos";
import { ContentItemModal } from "@/components/ContentItemModal";
import type { ContentItem } from "@/lib/types";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function CalendarioPage() {
  const { items } = useContentItems();
  const { accounts, projetos, profiles } = useSession();
  const [mesRef, setMesRef] = useState(() => new Date());
  const [contaFiltro, setContaFiltro] = useState<string | null>(null);
  const [projetoFiltro, setProjetoFiltro] = useState<string | null>(null);
  const [pessoaFiltro, setPessoaFiltro] = useState<string | null>(null);
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

  function ehNoDia(dataIso: string | null, dia: Date): boolean {
    return !!dataIso && isSameDay(new Date(`${dataIso}T12:00:00`), dia);
  }

  function itemsPostamNoDia(dia: Date): ContentItem[] {
    return itemsFiltrados.filter((i) => {
      if (!ehNoDia(i.data_planejada, dia)) return false;
      if (pessoaFiltro && i.responsavel_postagem_id !== pessoaFiltro) return false;
      return true;
    });
  }

  function itemsGravamNoDia(dia: Date): ContentItem[] {
    return itemsFiltrados.filter((i) => {
      if (!i.data_planejada || !AINDA_PRECISA_GRAVAR.has(i.estagio)) return false;
      if (!ehNoDia(calcularPrazos(i.data_planejada).prazoGravacao, dia)) return false;
      if (pessoaFiltro && i.responsavel_gravacao_id !== pessoaFiltro) return false;
      return true;
    });
  }

  function itemsEditamNoDia(dia: Date): ContentItem[] {
    return itemsFiltrados.filter((i) => {
      if (!i.data_planejada || !AINDA_PRECISA_EDITAR.has(i.estagio)) return false;
      if (!ehNoDia(calcularPrazos(i.data_planejada).prazoEdicao, dia)) return false;
      if (pessoaFiltro && i.responsavel_edicao_id !== pessoaFiltro) return false;
      return true;
    });
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

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Contas</label>
          <select
            className="input min-w-[180px]"
            value={contaFiltro ?? ""}
            onChange={(e) => setContaFiltro(e.target.value || null)}
          >
            <option value="">Todas as contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.handle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Projetos</label>
          <select
            className="input min-w-[180px]"
            value={projetoFiltro ?? ""}
            onChange={(e) => setProjetoFiltro(e.target.value || null)}
          >
            <option value="">Todos os projetos</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
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
      {pessoaFiltro && (
        <p className="text-xs text-zosa-muted">
          Mostrando gravação, edição e postagem atribuídas a essa pessoa - em qualquer papel.
        </p>
      )}

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-zosa-muted">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dias.map((dia) => {
          const postam = itemsPostamNoDia(dia);
          const gravam = itemsGravamNoDia(dia);
          const editam = itemsEditamNoDia(dia);
          const foraDoMes = !isSameMonth(dia, mesRef);
          return (
            <div
              key={dia.toISOString()}
              className={`rounded-xl border p-1.5 min-h-[130px] flex flex-col gap-1 ${
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
              <div className="flex-1 space-y-1 overflow-y-auto max-h-36">
                {gravam.map((item) => (
                  <button
                    key={`grav-${item.id}`}
                    onClick={() => setItemAberto(item)}
                    className="w-full text-left rounded px-1.5 py-0.5 text-[11px] bg-zosa-tealbg text-zosa-dark truncate hover:opacity-80"
                    title={`Gravar: ${item.ideia}`}
                  >
                    🎥 {item.ideia}
                  </button>
                ))}
                {editam.map((item) => (
                  <button
                    key={`edit-${item.id}`}
                    onClick={() => setItemAberto(item)}
                    className="w-full text-left rounded px-1.5 py-0.5 text-[11px] truncate hover:opacity-80"
                    style={{ backgroundColor: "var(--color-tipo-trend-bg)", color: "var(--color-tipo-trend)" }}
                    title={`Editar: ${item.ideia}`}
                  >
                    ✂️ {item.ideia}
                  </button>
                ))}
                {postam.map((item) => (
                  <button
                    key={`post-${item.id}`}
                    onClick={() => setItemAberto(item)}
                    className="w-full text-left rounded px-1.5 py-0.5 text-[11px] bg-zosa-warnbg text-zosa-warn truncate hover:opacity-80"
                    title={`Postar: ${item.ideia}`}
                  >
                    📤 {item.ideia}
                  </button>
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

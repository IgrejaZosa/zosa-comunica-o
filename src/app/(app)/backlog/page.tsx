"use client";

import { useMemo, useState } from "react";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContentItems } from "@/lib/hooks";
import { ContentItemModal } from "@/components/ContentItemModal";
import { ContentItemRow } from "@/components/ContentItemRow";
import { api } from "@/lib/api";
import type { ContentItem } from "@/lib/types";

export default function BacklogPage() {
  const { items } = useContentItems();
  const [mesRef, setMesRef] = useState(() => new Date());
  const [itemAberto, setItemAberto] = useState<ContentItem | "novo" | null>(null);

  const mesStr = format(mesRef, "yyyy-MM");

  const doMes = useMemo(
    () => items.filter((i) => i.data_planejada?.startsWith(mesStr)).sort((a, b) => (a.data_planejada! < b.data_planejada! ? -1 : 1)),
    [items, mesStr]
  );
  const semData = useMemo(() => items.filter((i) => !i.data_planejada), [items]);

  /** "+ Sprint atual" significa "vamos fazer isso nesta semana" - a data
   * planejada vira hoje (mesmo que já tivesse outra data), e o sprint_id
   * é recalculado a partir dela no servidor. */
  async function moverParaSprint(item: ContentItem) {
    await api.atualizarItem(item.id, {
      data_planejada: format(new Date(), "yyyy-MM-dd"),
      estagio: item.estagio === "backlog" ? "sprint" : item.estagio,
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <button className="btn-primary" onClick={() => setItemAberto("novo")}>
          + Novo item
        </button>
      </div>

      {semData.length > 0 && (
        <div className="card p-3">
          <p className="text-sm font-semibold text-zosa-ink mb-2">Ideias sem data definida ({semData.length})</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <tbody>
                {semData.map((item) => (
                  <ContentItemRow
                    key={item.id}
                    item={item}
                    onEdit={() => setItemAberto(item)}
                    acaoExtra={
                      item.estagio === "backlog" && (
                        <button className="btn-primary !px-2 !py-1 text-xs" onClick={() => moverParaSprint(item)}>
                          + Sprint atual
                        </button>
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zosa-border text-xs font-semibold text-zosa-muted">
              <th className="px-2 py-2">Dia</th>
              <th className="px-2 py-2">Conta</th>
              <th className="px-2 py-2">Natureza</th>
              <th className="px-2 py-2">Filmagem</th>
              <th className="px-2 py-2">Evento / Motivo</th>
              <th className="px-2 py-2">Ideia</th>
              <th className="px-2 py-2">Estágio</th>
              <th className="px-2 py-2">Postagem</th>
              <th className="px-2 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {doMes.map((item) => (
              <ContentItemRow
                key={item.id}
                item={item}
                onEdit={() => setItemAberto(item)}
                acaoExtra={
                  item.estagio === "backlog" && (
                    <button className="btn-primary !px-2 !py-1 text-xs" onClick={() => moverParaSprint(item)}>
                      + Sprint atual
                    </button>
                  )
                }
              />
            ))}
            {doMes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-2 py-6 text-center text-sm text-zosa-muted">
                  Nenhum item planejado para este mês ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {itemAberto && (
        <ContentItemModal
          item={itemAberto === "novo" ? null : itemAberto}
          defaults={itemAberto === "novo" ? { estagio: "backlog" } : undefined}
          onClose={() => setItemAberto(null)}
        />
      )}
    </div>
  );
}

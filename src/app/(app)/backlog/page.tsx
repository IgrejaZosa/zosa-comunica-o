"use client";

import { useMemo, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContentItems } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { ContentItemModal } from "@/components/ContentItemModal";
import { Badge } from "@/components/Badge";
import { api } from "@/lib/api";
import {
  ESTAGIO_COLORS,
  ESTAGIO_LABELS,
  TIPO_COLORS,
  TIPO_LABELS,
  type ContentItem,
} from "@/lib/types";

export default function BacklogPage() {
  const { items } = useContentItems();
  const { accounts, profiles } = useSession();
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

  function nomeConta(id: string) {
    return accounts.find((a) => a.id === id)?.handle ?? "—";
  }
  function nomePessoa(id: string | null) {
    return profiles.find((p) => p.id === id)?.nome ?? "—";
  }

  function Linha({ item }: { item: ContentItem }) {
    const tipoCor = TIPO_COLORS[item.tipo];
    const estagioCor = ESTAGIO_COLORS[item.estagio];
    return (
      <tr className="border-b border-zosa-border hover:bg-zosa-cream/40">
        <td className="px-2 py-2 text-xs text-zosa-muted whitespace-nowrap">
          {item.data_planejada ? format(parseISO(item.data_planejada), "dd/MM (EEE)", { locale: ptBR }) : "—"}
        </td>
        <td className="px-2 py-2 text-xs whitespace-nowrap">{nomeConta(item.account_id)}</td>
        <td className="px-2 py-2">
          <Badge label={TIPO_LABELS[item.tipo]} fg={tipoCor.fg} bg={tipoCor.bg} />
        </td>
        <td className="px-2 py-2 text-xs whitespace-nowrap">{nomePessoa(item.responsavel_criacao_id)}</td>
        <td className="px-2 py-2 text-xs">{item.evento_motivo ?? "—"}</td>
        <td className="px-2 py-2 text-sm max-w-xs truncate" title={item.ideia}>
          {item.ideia}
        </td>
        <td className="px-2 py-2">
          <Badge label={ESTAGIO_LABELS[item.estagio]} fg={estagioCor.fg} bg={estagioCor.bg} />
        </td>
        <td className="px-2 py-2 text-xs whitespace-nowrap">{nomePessoa(item.responsavel_postagem_id)}</td>
        <td className="px-2 py-2 whitespace-nowrap">
          <div className="flex gap-1">
            <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => setItemAberto(item)}>
              Editar
            </button>
            {item.estagio === "backlog" && (
              <button className="btn-primary !px-2 !py-1 text-xs" onClick={() => moverParaSprint(item)}>
                + Sprint atual
              </button>
            )}
          </div>
        </td>
      </tr>
    );
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
              <tbody>{semData.map((item) => <Linha key={item.id} item={item} />)}</tbody>
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
              <th className="px-2 py-2">Criação</th>
              <th className="px-2 py-2">Evento / Motivo</th>
              <th className="px-2 py-2">Ideia</th>
              <th className="px-2 py-2">Estágio</th>
              <th className="px-2 py-2">Postagem</th>
              <th className="px-2 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {doMes.map((item) => (
              <Linha key={item.id} item={item} />
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { useContentItems } from "@/lib/hooks";
import { ContentItemModal } from "@/components/ContentItemModal";
import { ContentItemRow } from "@/components/ContentItemRow";
import { ContentCard } from "@/components/ContentCard";
import { api } from "@/lib/api";
import { formatarPeriodoSprint } from "@/lib/sprint";
import type { ContentItem, Sprint } from "@/lib/types";

export default function SprintPlanningPage() {
  const { items } = useContentItems();
  const [proximaSprint, setProximaSprint] = useState<Sprint | null>(null);
  const [meta, setMeta] = useState("");
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [itemAberto, setItemAberto] = useState<ContentItem | "novo" | null>(null);

  useEffect(() => {
    api
      .sprintSeguinte()
      .then((s) => {
        const sprint = s as Sprint;
        setProximaSprint(sprint);
        setMeta(sprint.meta ?? "");
      })
      .catch((err) => console.error("sprintSeguinte:", err));
  }, []);

  const jaProgramados = useMemo(
    () => (proximaSprint ? items.filter((i) => i.sprint_id === proximaSprint.id) : []),
    [items, proximaSprint]
  );

  const candidatosBacklog = useMemo(
    () =>
      items
        .filter((i) => i.estagio === "backlog")
        .sort((a, b) => {
          const da = a.data_planejada ?? "9999-99-99";
          const db = b.data_planejada ?? "9999-99-99";
          return da < db ? -1 : 1;
        }),
    [items]
  );

  async function salvarMeta() {
    if (!proximaSprint) return;
    setSalvandoMeta(true);
    try {
      await api.atualizarSprint(proximaSprint.id, { meta });
    } finally {
      setSalvandoMeta(false);
    }
  }

  /** Puxa um item do backlog pra dentro da próxima sprint: a data
   * planejada vira o início dela (o sprint_id é recalculado a partir
   * disso no servidor). */
  async function puxarParaProximaSprint(item: ContentItem) {
    if (!proximaSprint) return;
    await api.atualizarItem(item.id, {
      data_planejada: proximaSprint.data_inicio,
      estagio: "sprint",
    });
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-xl font-semibold text-zosa-ink">Sprint Planning</h1>
            {proximaSprint && (
              <p className="text-sm text-zosa-muted">
                Preparando a semana de {formatarPeriodoSprint(proximaSprint.data_inicio, proximaSprint.data_fim)}
              </p>
            )}
          </div>
          <span className="badge bg-zosa-tealbg text-zosa-teal">{jaProgramados.length} já programados</span>
        </div>
        <label className="label">Meta da próxima sprint</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder="O que queremos fechar na semana que vem"
          />
          <button className="btn-secondary shrink-0" onClick={salvarMeta} disabled={salvandoMeta}>
            Salvar meta
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zosa-ink mb-2">
          Já programado para a semana que vem ({jaProgramados.length})
        </h2>
        {jaProgramados.length === 0 ? (
          <p className="text-sm text-zosa-muted">Nada programado ainda — puxe itens do backlog abaixo.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {jaProgramados.map((item) => (
              <ContentCard key={item.id} item={item} onClick={() => setItemAberto(item)} compact />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zosa-ink">Backlog para escolher ({candidatosBacklog.length})</h2>
          <button className="btn-primary" onClick={() => setItemAberto("novo")}>
            + Nova ideia
          </button>
        </div>
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
              {candidatosBacklog.map((item) => (
                <ContentItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => setItemAberto(item)}
                  acaoExtra={
                    <button
                      className="btn-primary !px-2 !py-1 text-xs"
                      onClick={() => puxarParaProximaSprint(item)}
                      disabled={!proximaSprint}
                    >
                      + Próxima sprint
                    </button>
                  }
                />
              ))}
              {candidatosBacklog.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-2 py-6 text-center text-sm text-zosa-muted">
                    Nenhuma ideia no backlog no momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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

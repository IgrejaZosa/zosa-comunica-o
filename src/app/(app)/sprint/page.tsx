"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContentItems, useDailyLogs } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ContentItemModal } from "@/components/ContentItemModal";
import { ContentItemRow } from "@/components/ContentItemRow";
import { DailyForm } from "@/components/DailyForm";
import { api } from "@/lib/api";
import { formatarPeriodoSprint } from "@/lib/sprint";
import type { ContentItem, Sprint } from "@/lib/types";

export default function SprintPage() {
  const { items } = useContentItems();
  const { profile, profiles } = useSession();
  const dailyLogs = useDailyLogs();
  const [sprintAtual, setSprintAtual] = useState<Sprint | null>(null);
  const [meta, setMeta] = useState("");
  const [salvandoMeta, setSalvandoMeta] = useState(false);
  const [itemAberto, setItemAberto] = useState<ContentItem | "novo" | null>(null);

  const hoje = format(new Date(), "yyyy-MM-dd");
  const meuDailyHoje = dailyLogs.find((d) => d.user_id === profile.id && d.data === hoje);

  useEffect(() => {
    api
      .sprintAtual()
      .then((s) => {
        const sprint = s as Sprint;
        setSprintAtual(sprint);
        setMeta(sprint.meta ?? "");
      })
      .catch((err) => console.error("sprintAtual:", err));
  }, []);

  const itemsDaSprint = useMemo(
    () => (sprintAtual ? items.filter((i) => i.sprint_id === sprintAtual.id) : []),
    [items, sprintAtual]
  );

  const backlogParaEscolher = useMemo(
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

  const concluidos = itemsDaSprint.filter((i) => i.estagio === "postado").length;

  /** Puxa um item do backlog pra dentro da sprint atual: a data
   * planejada vira hoje (o sprint_id é recalculado a partir dela no
   * servidor, o que naturalmente cai na sprint vigente). */
  async function puxarParaSprintAtual(item: ContentItem) {
    await api.atualizarItem(item.id, { data_planejada: hoje, estagio: "sprint" });
  }

  async function salvarMeta() {
    if (!sprintAtual) return;
    setSalvandoMeta(true);
    try {
      await api.atualizarSprint(sprintAtual.id, { meta });
    } finally {
      setSalvandoMeta(false);
    }
  }

  const dailiesRecentes = useMemo(() => {
    const porData = new Map<string, typeof dailyLogs>();
    for (const log of dailyLogs.slice(0, 40)) {
      const lista = porData.get(log.data) ?? [];
      lista.push(log);
      porData.set(log.data, lista);
    }
    return Array.from(porData.entries()).slice(0, 7);
  }, [dailyLogs]);

  function nomeDe(userId: string) {
    return profiles.find((p) => p.id === userId)?.nome ?? "—";
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div>
            <h1 className="text-xl font-semibold text-zosa-ink">Sprint Atual</h1>
            {sprintAtual && (
              <p className="text-sm text-zosa-muted">
                Semana de {formatarPeriodoSprint(sprintAtual.data_inicio, sprintAtual.data_fim)} · sexta pós-almoço
                a sexta pré-almoço
              </p>
            )}
          </div>
          <span className="badge bg-zosa-tealbg text-zosa-teal">
            {concluidos}/{itemsDaSprint.length} postados
          </span>
        </div>
        <label className="label">Meta da sprint</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            placeholder="Ex: fechar todo o conteúdo do Resgate da Família da semana"
          />
          <button className="btn-secondary shrink-0" onClick={salvarMeta} disabled={salvandoMeta}>
            Salvar meta
          </button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zosa-ink">Quadro da sprint</h2>
          <button className="btn-primary" onClick={() => setItemAberto("novo")}>
            + Novo item
          </button>
        </div>
        <KanbanBoard items={itemsDaSprint} onOpenItem={setItemAberto} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zosa-ink mb-2">
          Backlog para escolher ({backlogParaEscolher.length})
        </h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zosa-border text-xs font-semibold text-zosa-muted">
                <th className="px-2 py-2">Dia</th>
                <th className="px-2 py-2">Conta</th>
                <th className="px-2 py-2">Natureza</th>
                <th className="px-2 py-2">Gravação</th>
                <th className="px-2 py-2">Projeto</th>
                <th className="px-2 py-2">Ideia</th>
                <th className="px-2 py-2">Estágio</th>
                <th className="px-2 py-2">Postagem</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {backlogParaEscolher.map((item) => (
                <ContentItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => setItemAberto(item)}
                  acaoExtra={
                    <button className="btn-primary !px-2 !py-1 text-xs" onClick={() => puxarParaSprintAtual(item)}>
                      + Sprint atual
                    </button>
                  }
                />
              ))}
              {backlogParaEscolher.length === 0 && (
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Meu daily de hoje</h2>
          <DailyForm
            key={meuDailyHoje?.id ?? "novo"}
            inicial={{
              fiz_ontem: meuDailyHoje?.fiz_ontem ?? "",
              farei_hoje: meuDailyHoje?.farei_hoje ?? "",
              impedimentos: meuDailyHoje?.impedimentos ?? "",
            }}
          />
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold text-zosa-ink mb-3">Dailies recentes do time</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {dailiesRecentes.map(([data, logs]) => (
              <div key={data}>
                <p className="text-xs font-semibold text-zosa-muted capitalize">
                  {format(parseISO(data), "EEEE, dd/MM", { locale: ptBR })}
                </p>
                <ul className="mt-1 space-y-1.5">
                  {logs.map((log) => (
                    <li key={log.id} className="text-xs bg-zosa-cream/60 rounded-lg p-2">
                      <span className="font-semibold text-zosa-ink">{nomeDe(log.user_id)}</span>
                      {log.farei_hoje && <span className="text-zosa-muted"> · vai fazer: {log.farei_hoje}</span>}
                      {log.impedimentos && (
                        <span className="block text-zosa-danger mt-0.5">⚠ {log.impedimentos}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {dailiesRecentes.length === 0 && (
              <p className="text-sm text-zosa-muted">Ninguém registrou daily ainda.</p>
            )}
          </div>
        </div>
      </div>

      {itemAberto && (
        <ContentItemModal
          item={itemAberto === "novo" ? null : itemAberto}
          defaults={itemAberto === "novo" ? { estagio: "sprint", data_planejada: hoje } : undefined}
          onClose={() => setItemAberto(null)}
        />
      )}
    </div>
  );
}

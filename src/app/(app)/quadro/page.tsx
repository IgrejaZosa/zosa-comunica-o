"use client";

import { useEffect, useMemo, useState } from "react";
import { useContentItems } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ContentItemModal } from "@/components/ContentItemModal";
import { api } from "@/lib/api";
import type { ContentItem, Sprint } from "@/lib/types";

export default function QuadroPage() {
  const { items, carregando } = useContentItems();
  const { accounts } = useSession();
  const [contaFiltro, setContaFiltro] = useState<string | null>(null);
  const [somenteSprint, setSomenteSprint] = useState(true);
  const [itemAberto, setItemAberto] = useState<ContentItem | "novo" | null>(null);
  const [sprintAtual, setSprintAtual] = useState<Sprint | null>(null);

  useEffect(() => {
    api
      .sprintAtual()
      .then((s) => setSprintAtual(s as Sprint))
      .catch((err) => console.error("sprintAtual:", err));
  }, []);

  const filtrados = useMemo(() => {
    return items.filter((i) => {
      if (i.estagio === "backlog" || i.estagio === "cancelado") return false;
      if (contaFiltro && i.account_id !== contaFiltro) return false;
      if (somenteSprint && sprintAtual && i.sprint_id !== sprintAtual.id) return false;
      return true;
    });
  }, [items, contaFiltro, somenteSprint, sprintAtual]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zosa-ink">Quadro Scrum</h1>
          <p className="text-sm text-zosa-muted">Arraste os cards entre as colunas para atualizar o andamento.</p>
        </div>
        <button className="btn-primary" onClick={() => setItemAberto("novo")}>
          + Novo item
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSomenteSprint((v) => !v)}
          className={somenteSprint ? "btn-primary" : "btn-secondary"}
        >
          {somenteSprint ? "Mostrando: sprint atual" : "Mostrando: todas as sprints"}
        </button>
        <span className="w-px h-6 bg-zosa-border mx-1" />
        <button
          onClick={() => setContaFiltro(null)}
          className={!contaFiltro ? "btn-primary" : "btn-secondary"}
        >
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

      {carregando ? (
        <p className="text-sm text-zosa-muted">Carregando...</p>
      ) : (
        <KanbanBoard items={filtrados} onOpenItem={setItemAberto} />
      )}

      {itemAberto && (
        <ContentItemModal
          item={itemAberto === "novo" ? null : itemAberto}
          defaults={
            itemAberto === "novo"
              ? { estagio: "sprint", sprint_id: sprintAtual?.id, account_id: contaFiltro ?? undefined }
              : undefined
          }
          onClose={() => setItemAberto(null)}
        />
      )}
    </div>
  );
}

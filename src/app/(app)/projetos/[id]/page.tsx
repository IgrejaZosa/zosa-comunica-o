"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { useContentItems } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { KanbanBoard } from "@/components/KanbanBoard";
import { ContentItemModal } from "@/components/ContentItemModal";
import { ContentItemRow } from "@/components/ContentItemRow";
import { api } from "@/lib/api";
import type { ContentItem } from "@/lib/types";

export default function ProjetoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { projetos } = useSession();
  const { items } = useContentItems();
  const [itemAberto, setItemAberto] = useState<ContentItem | "novo" | null>(null);
  const [editandoNome, setEditandoNome] = useState(false);
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  const projeto = projetos.find((p) => p.id === id);

  const itensDoProjeto = useMemo(() => items.filter((i) => i.projeto_id === id), [items, id]);
  const emAndamento = useMemo(
    () => itensDoProjeto.filter((i) => i.estagio !== "backlog" && i.estagio !== "cancelado"),
    [itensDoProjeto]
  );
  const backlogDoProjeto = useMemo(
    () => itensDoProjeto.filter((i) => i.estagio === "backlog"),
    [itensDoProjeto]
  );
  const entregues = itensDoProjeto.filter((i) => i.estagio === "postado").length;

  async function salvarNome() {
    if (!projeto || !nome.trim()) return;
    setSalvando(true);
    try {
      await api.atualizarProjeto(projeto.id, { nome: nome.trim() });
      setEditandoNome(false);
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProjeto() {
    if (!projeto) return;
    if (
      !confirm(
        `Excluir o projeto "${projeto.nome}"? Os itens de conteúdo continuam existindo, só perdem a ligação com o projeto.`
      )
    )
      return;
    await api.excluirProjeto(projeto.id);
    router.push("/projetos");
  }

  if (!projeto) {
    return <p className="text-sm text-zosa-muted">Carregando projeto…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projetos" className="text-sm text-zosa-teal hover:underline">
          ← Todos os projetos
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
          {editandoNome ? (
            <div className="flex gap-2 items-center">
              <input
                className="input"
                autoFocus
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    salvarNome();
                  }
                }}
              />
              <button className="btn-primary shrink-0" onClick={salvarNome} disabled={salvando}>
                Salvar
              </button>
              <button className="btn-secondary shrink-0" onClick={() => setEditandoNome(false)}>
                Cancelar
              </button>
            </div>
          ) : (
            <h1
              className="text-xl font-semibold text-zosa-ink cursor-pointer hover:text-zosa-teal"
              onClick={() => {
                setNome(projeto.nome);
                setEditandoNome(true);
              }}
              title="Clique para renomear"
            >
              {projeto.nome}
            </h1>
          )}
          <div className="flex items-center gap-2">
            <span className="badge bg-zosa-tealbg text-zosa-teal">
              {entregues}/{itensDoProjeto.length} entregues
            </span>
            <button className="btn-ghost text-zosa-danger !px-2 !py-1 text-xs" onClick={excluirProjeto}>
              Excluir projeto
            </button>
          </div>
        </div>
        {projeto.descricao && <p className="text-sm text-zosa-muted mt-1">{projeto.descricao}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-zosa-ink">Andamento do projeto</h2>
          <button className="btn-primary" onClick={() => setItemAberto("novo")}>
            + Novo item
          </button>
        </div>
        <KanbanBoard items={emAndamento} onOpenItem={setItemAberto} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-zosa-ink mb-2">
          Ideias no backlog do projeto ({backlogDoProjeto.length})
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
              {backlogDoProjeto.map((item) => (
                <ContentItemRow
                  key={item.id}
                  item={item}
                  onEdit={() => setItemAberto(item)}
                  acaoExtra={
                    <button
                      className="btn-primary !px-2 !py-1 text-xs"
                      onClick={() =>
                        api.atualizarItem(item.id, {
                          data_planejada: format(new Date(), "yyyy-MM-dd"),
                          estagio: "sprint",
                        })
                      }
                    >
                      + Sprint atual
                    </button>
                  }
                />
              ))}
              {backlogDoProjeto.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-2 py-6 text-center text-sm text-zosa-muted">
                    Nenhuma ideia parada no backlog deste projeto.
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
          defaults={itemAberto === "novo" ? { estagio: "backlog", projeto_id: projeto.id } : undefined}
          onClose={() => setItemAberto(null)}
        />
      )}
    </div>
  );
}

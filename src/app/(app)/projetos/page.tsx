"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useContentItems } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { api } from "@/lib/api";

export default function ProjetosPage() {
  const { projetos } = useSession();
  const { items } = useContentItems();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const stats = useMemo(() => {
    const mapa = new Map<string, { total: number; entregues: number }>();
    for (const item of items) {
      if (!item.projeto_id) continue;
      const atual = mapa.get(item.projeto_id) ?? { total: 0, entregues: 0 };
      atual.total++;
      if (item.estagio === "postado") atual.entregues++;
      mapa.set(item.projeto_id, atual);
    }
    return mapa;
  }, [items]);

  async function excluirProjeto(e: React.MouseEvent, projetoId: string, nomeProjeto: string) {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        `Excluir o projeto "${nomeProjeto}"? Os itens de conteúdo continuam existindo, só perdem a ligação com o projeto.`
      )
    )
      return;
    await api.excluirProjeto(projetoId);
  }

  async function criarProjeto(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      await api.criarProjeto({ nome: nome.trim(), descricao: descricao.trim() });
      setNome("");
      setDescricao("");
      setCriando(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar projeto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zosa-ink">Projetos</h1>
          <p className="text-sm text-zosa-muted">
            Eventos, séries de pregações, chamadas… veja o andamento de cada um isolado.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setCriando((v) => !v)}>
          + Novo projeto
        </button>
      </div>

      {criando && (
        <form onSubmit={criarProjeto} className="card p-4 space-y-3">
          <div>
            <label className="label">Nome</label>
            <input
              className="input"
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Resgate da Família, Encontro de Casais…"
            />
          </div>
          <div>
            <label className="label">Descrição (opcional)</label>
            <textarea
              className="input"
              rows={2}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Contexto rápido sobre o projeto"
            />
          </div>
          {erro && <p className="text-sm text-zosa-danger">{erro}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setCriando(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? "Criando..." : "Criar"}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {projetos.map((projeto) => {
          const s = stats.get(projeto.id) ?? { total: 0, entregues: 0 };
          return (
            <Link
              key={projeto.id}
              href={`/projetos/${projeto.id}`}
              className="card p-4 hover:border-zosa-teal transition-colors relative group"
            >
              <button
                type="button"
                onClick={(e) => excluirProjeto(e, projeto.id, projeto.nome)}
                className="absolute top-2 right-2 text-zosa-muted hover:text-zosa-danger opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                title="Excluir projeto"
              >
                ✕
              </button>
              <p className="font-semibold text-zosa-ink pr-4">{projeto.nome}</p>
              {projeto.descricao && <p className="text-xs text-zosa-muted mt-0.5 line-clamp-2">{projeto.descricao}</p>}
              <p className="text-xs text-zosa-muted mt-2">
                {s.entregues} entregue{s.entregues === 1 ? "" : "s"} de {s.total} {s.total === 1 ? "item" : "itens"}
              </p>
            </Link>
          );
        })}
        {projetos.length === 0 && (
          <p className="text-sm text-zosa-muted col-span-full">Nenhum projeto criado ainda.</p>
        )}
      </div>
    </div>
  );
}

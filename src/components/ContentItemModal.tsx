"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";
import { api } from "@/lib/api";
import { TimeTracker } from "@/components/TimeTracker";
import {
  ESTAGIO_LABELS,
  TIPO_LABELS,
  type ContentItem,
  type Estagio,
  type TipoConteudo,
} from "@/lib/types";

type Defaults = Partial<Pick<ContentItem, "account_id" | "data_planejada" | "estagio" | "tipo">>;

const CAMPOS_RESPONSAVEL = [
  { campo: "responsavel_filmagem_id", label: "Responsável pela filmagem" },
  { campo: "responsavel_gravacao_id", label: "Responsável pela gravação" },
  { campo: "responsavel_edicao_id", label: "Responsável pela edição" },
  { campo: "responsavel_postagem_id", label: "Responsável pela postagem" },
] as const;

export function ContentItemModal({
  item,
  defaults,
  onClose,
}: {
  item: ContentItem | null;
  defaults?: Defaults;
  onClose: () => void;
}) {
  const { profiles, accounts } = useSession();
  const [form, setForm] = useState({
    account_id: item?.account_id ?? defaults?.account_id ?? accounts[0]?.id ?? "",
    tipo: (item?.tipo ?? defaults?.tipo ?? "reels") as TipoConteudo,
    data_planejada: item?.data_planejada ?? defaults?.data_planejada ?? "",
    evento_motivo: item?.evento_motivo ?? "",
    ideia: item?.ideia ?? "",
    referencias: item?.referencias ?? "",
    observacoes: item?.observacoes ?? "",
    responsavel_filmagem_id: item?.responsavel_filmagem_id ?? "",
    responsavel_gravacao_id: item?.responsavel_gravacao_id ?? "",
    responsavel_edicao_id: item?.responsavel_edicao_id ?? "",
    responsavel_postagem_id: item?.responsavel_postagem_id ?? "",
    estagio: (item?.estagio ?? defaults?.estagio ?? "backlog") as Estagio,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function setCampo<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!form.ideia.trim()) {
      setErro("Descreva a ideia do conteúdo.");
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        ...form,
        data_planejada: form.data_planejada || null,
        evento_motivo: form.evento_motivo || null,
        referencias: form.referencias || null,
        observacoes: form.observacoes || null,
        responsavel_filmagem_id: form.responsavel_filmagem_id || null,
        responsavel_gravacao_id: form.responsavel_gravacao_id || null,
        responsavel_edicao_id: form.responsavel_edicao_id || null,
        responsavel_postagem_id: form.responsavel_postagem_id || null,
      };
      if (item) {
        await api.atualizarItem(item.id, payload);
      } else {
        await api.criarItem(payload);
      }
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!item) return;
    if (!confirm("Excluir este item de conteúdo? Essa ação não pode ser desfeita.")) return;
    setSalvando(true);
    try {
      await api.excluirItem(item.id);
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao excluir.");
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-6 my-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zosa-ink">
            {item ? "Editar item" : "Novo item de conteúdo"}
          </h2>
          <button className="text-zosa-muted hover:text-zosa-ink" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <form onSubmit={salvar} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Conta</label>
              <select
                className="input"
                value={form.account_id}
                onChange={(e) => setCampo("account_id", e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.handle}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Natureza do conteúdo</label>
              <select
                className="input"
                value={form.tipo}
                onChange={(e) => setCampo("tipo", e.target.value as TipoConteudo)}
              >
                {Object.entries(TIPO_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data planejada</label>
              <input
                type="date"
                className="input"
                value={form.data_planejada}
                onChange={(e) => setCampo("data_planejada", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Estágio</label>
              <select
                className="input"
                value={form.estagio}
                onChange={(e) => setCampo("estagio", e.target.value as Estagio)}
              >
                {Object.entries(ESTAGIO_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Evento / motivo</label>
            <input
              className="input"
              value={form.evento_motivo}
              onChange={(e) => setCampo("evento_motivo", e.target.value)}
              placeholder="Ex: Resgate da Família, GC, Culto de Mulheres…"
            />
          </div>

          <div>
            <label className="label">Ideia</label>
            <textarea
              className="input"
              rows={2}
              value={form.ideia}
              onChange={(e) => setCampo("ideia", e.target.value)}
              placeholder="A ideia / gancho do conteúdo"
            />
          </div>

          <div>
            <label className="label">Necessidades / referência</label>
            <input
              className="input"
              value={form.referencias}
              onChange={(e) => setCampo("referencias", e.target.value)}
              placeholder="Link de referência, material necessário…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {CAMPOS_RESPONSAVEL.map(({ campo, label }) => (
              <div key={campo}>
                <label className="label">{label}</label>
                <select className="input" value={form[campo]} onChange={(e) => setCampo(campo, e.target.value)}>
                  <option value="">—</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              className="input"
              rows={2}
              value={form.observacoes}
              onChange={(e) => setCampo("observacoes", e.target.value)}
              placeholder="Mudanças, combinados, contexto extra…"
            />
          </div>

          {erro && <p className="text-sm text-zosa-danger">{erro}</p>}

          <div className="flex items-center justify-between pt-2">
            {item ? (
              <button type="button" className="btn-ghost text-zosa-danger" onClick={excluir} disabled={salvando}>
                Excluir
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </form>

        {item && (
          <div className="border-t border-zosa-border pt-4">
            <h3 className="text-sm font-semibold text-zosa-ink mb-2">Tempo gasto</h3>
            <TimeTracker contentItemId={item.id} />
          </div>
        )}
      </div>
    </div>
  );
}

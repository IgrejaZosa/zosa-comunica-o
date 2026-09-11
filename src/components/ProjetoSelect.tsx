"use client";

import { useState } from "react";
import { useSession } from "@/lib/session-context";
import { api } from "@/lib/api";

/** Select de projeto (evento, série de pregações, chamada...) com opção
 * de criar um novo direto na ficha, sem sair pra outra tela. */
export function ProjetoSelect({
  value,
  onChange,
  label = "Projeto",
}: {
  value: string;
  onChange: (projetoId: string) => void;
  label?: string;
}) {
  const { projetos } = useSession();
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criarProjeto() {
    const nome = nomeNovo.trim();
    if (!nome) return;
    setSalvando(true);
    setErro(null);
    try {
      const novo = (await api.criarProjeto({ nome })) as { id: string };
      onChange(novo.id);
      setCriando(false);
      setNomeNovo("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar projeto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      {criando ? (
        <div className="flex gap-2">
          <input
            className="input"
            autoFocus
            value={nomeNovo}
            onChange={(e) => setNomeNovo(e.target.value)}
            placeholder="Nome do projeto"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                criarProjeto();
              }
            }}
          />
          <button type="button" className="btn-primary shrink-0" onClick={criarProjeto} disabled={salvando}>
            Criar
          </button>
          <button type="button" className="btn-secondary shrink-0" onClick={() => setCriando(false)}>
            ✕
          </button>
        </div>
      ) : (
        <select
          className="input"
          value={value}
          onChange={(e) => {
            if (e.target.value === "__novo__") setCriando(true);
            else onChange(e.target.value);
          }}
        >
          <option value="">—</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
          <option value="__novo__">+ Novo projeto…</option>
        </select>
      )}
      {erro && <p className="text-xs text-zosa-danger mt-1">{erro}</p>}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/types";

export function EscolherUsuarioForm({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [carregandoId, setCarregandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(profile: Profile) {
    setErro(null);
    setCarregandoId(profile.id);
    try {
      const res = await fetch("/api/quem-sou-eu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: profile.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Erro ao entrar.");
        return;
      }
      router.push("/quadro");
      router.refresh();
    } finally {
      setCarregandoId(null);
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Quem é você?</h1>
        <p className="text-sm text-zosa-muted">Isso aparece nos itens que você criar e no tempo que apontar.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => escolher(p)}
            disabled={carregandoId !== null}
            className="flex items-center gap-2 rounded-lg border border-zosa-border px-3 py-3 text-left hover:border-zosa-teal hover:bg-zosa-cream disabled:opacity-50 transition-colors"
          >
            <span
              className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold text-white"
              style={{ backgroundColor: p.cor }}
            >
              {p.nome.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm font-medium text-zosa-ink">
              {carregandoId === p.id ? "Entrando..." : p.nome}
            </span>
          </button>
        ))}
      </div>
      {profiles.length === 0 && (
        <p className="text-xs text-zosa-danger">
          Nenhuma pessoa cadastrada ainda — adicione em Table Editor → profiles no Supabase.
        </p>
      )}
      {erro && <p className="text-sm text-zosa-danger">{erro}</p>}
    </div>
  );
}

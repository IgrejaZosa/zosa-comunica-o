"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordGateForm() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const res = await fetch("/api/acesso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senha }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErro(json.erro ?? "Senha incorreta.");
        return;
      }
      router.push("/quem-e-voce");
      router.refresh();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="card p-6 space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-zosa-ink">Entrar</h1>
        <p className="text-sm text-zosa-muted">Planejamento de conteúdo - Comunicação</p>
      </div>
      <div>
        <label className="label" htmlFor="senha">
          Senha de acesso
        </label>
        <input
          id="senha"
          type="password"
          required
          autoFocus
          className="input"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {erro && <p className="text-sm text-zosa-danger">{erro}</p>}
      <button type="submit" className="btn-primary w-full" disabled={carregando}>
        {carregando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

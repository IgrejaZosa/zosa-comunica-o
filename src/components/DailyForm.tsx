"use client";

import { useState } from "react";
import { api } from "@/lib/api";

export function DailyForm({
  inicial,
}: {
  inicial: { fiz_ontem: string; farei_hoje: string; impedimentos: string };
}) {
  const [form, setForm] = useState(inicial);
  const [salvando, setSalvando] = useState(false);

  function setCampo<K extends keyof typeof form>(campo: K, valor: string) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.salvarDaily(form);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-2">
      <div>
        <label className="label">O que fiz ontem</label>
        <textarea
          className="input"
          rows={2}
          value={form.fiz_ontem}
          onChange={(e) => setCampo("fiz_ontem", e.target.value)}
        />
      </div>
      <div>
        <label className="label">O que vou fazer hoje</label>
        <textarea
          className="input"
          rows={2}
          value={form.farei_hoje}
          onChange={(e) => setCampo("farei_hoje", e.target.value)}
        />
      </div>
      <div>
        <label className="label">Impedimentos</label>
        <textarea
          className="input"
          rows={2}
          value={form.impedimentos}
          onChange={(e) => setCampo("impedimentos", e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar daily"}
      </button>
    </form>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useTimeLogs } from "@/lib/hooks";
import { useSession } from "@/lib/session-context";
import { api } from "@/lib/api";
import { ETAPA_TEMPO_LABELS, type EtapaTempo } from "@/lib/types";

function formatarMinutos(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}min`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function TimeTracker({ contentItemId }: { contentItemId: string }) {
  const logs = useTimeLogs(contentItemId);
  const { profile, profiles } = useSession();
  const [etapaSelecionada, setEtapaSelecionada] = useState<EtapaTempo>("producao");
  const [carregando, setCarregando] = useState(false);
  const [decorrido, setDecorrido] = useState(0);
  const [manualMin, setManualMin] = useState("");

  const emAndamento = logs.find((l) => l.user_id === profile.id && l.fim === null);

  useEffect(() => {
    if (!emAndamento) return;
    const atualizar = () =>
      setDecorrido((Date.now() - new Date(emAndamento.inicio).getTime()) / 60000);
    atualizar();
    const t = setInterval(atualizar, 1000);
    return () => clearInterval(t);
  }, [emAndamento]);

  async function iniciar() {
    setCarregando(true);
    try {
      await api.iniciarTimer({ content_item_id: contentItemId, etapa: etapaSelecionada });
    } finally {
      setCarregando(false);
    }
  }

  async function parar() {
    if (!emAndamento) return;
    setCarregando(true);
    try {
      await api.pararTimer(emAndamento.id);
    } finally {
      setCarregando(false);
    }
  }

  async function lancarManual(e: React.FormEvent) {
    e.preventDefault();
    const minutos = Number(manualMin);
    if (!minutos || minutos <= 0) return;
    setCarregando(true);
    try {
      const agora = new Date();
      const inicio = new Date(agora.getTime() - minutos * 60000);
      await api.lancarTempoManual({
        content_item_id: contentItemId,
        etapa: etapaSelecionada,
        inicio: inicio.toISOString(),
        fim: agora.toISOString(),
      });
      setManualMin("");
    } finally {
      setCarregando(false);
    }
  }

  const totalPorPessoa = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const log of logs) {
      if (!log.duracao_minutos) continue;
      mapa[log.user_id] = (mapa[log.user_id] ?? 0) + log.duracao_minutos;
    }
    return Object.entries(mapa);
  }, [logs]);

  function nomeDe(userId: string) {
    return profiles.find((p) => p.id === userId)?.nome ?? "—";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input w-auto"
          value={etapaSelecionada}
          onChange={(e) => setEtapaSelecionada(e.target.value as EtapaTempo)}
          disabled={!!emAndamento}
        >
          {Object.entries(ETAPA_TEMPO_LABELS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        {emAndamento ? (
          <button type="button" className="btn-danger" onClick={parar} disabled={carregando}>
            ⏸ Parar ({formatarMinutos(decorrido)})
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={iniciar} disabled={carregando}>
            ▶ Iniciar timer
          </button>
        )}
      </div>

      <form onSubmit={lancarManual} className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          placeholder="min. gastos"
          className="input w-32"
          value={manualMin}
          onChange={(e) => setManualMin(e.target.value)}
        />
        <button type="submit" className="btn-secondary" disabled={carregando || !manualMin}>
          + Lançar manual
        </button>
      </form>

      {totalPorPessoa.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {totalPorPessoa.map(([userId, min]) => (
            <span key={userId} className="rounded-full bg-zosa-cream px-2 py-1 text-zosa-ink">
              {nomeDe(userId)}: <strong>{formatarMinutos(min)}</strong>
            </span>
          ))}
        </div>
      )}

      {logs.length > 0 && (
        <ul className="space-y-1 max-h-40 overflow-y-auto text-xs text-zosa-muted">
          {logs.map((log) => (
            <li key={log.id} className="flex items-center justify-between gap-2">
              <span>
                {nomeDe(log.user_id)} · {ETAPA_TEMPO_LABELS[log.etapa]} ·{" "}
                {new Date(log.inicio).toLocaleDateString("pt-BR")}
              </span>
              <span className="font-medium text-zosa-ink">
                {log.duracao_minutos != null ? formatarMinutos(log.duracao_minutos) : "em andamento…"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

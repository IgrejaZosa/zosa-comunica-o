"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ContentItem, DailyLog, Sprint, TimeLog } from "@/lib/types";

function ordenarContentItems(items: ContentItem[]): ContentItem[] {
  return [...items].sort((a, b) => {
    const da = a.data_planejada ?? "9999-99-99";
    const db = b.data_planejada ?? "9999-99-99";
    if (da !== db) return da < db ? -1 : 1;
    if (a.ordem !== b.ordem) return a.ordem - b.ordem;
    return a.created_at < b.created_at ? -1 : 1;
  });
}

/** Busca todos os itens de conteudo e mantem sincronizado via Realtime -
 * a mesma fonte alimenta calendario, quadro, backlog e sprint atual, entao
 * uma mudanca feita por qualquer pessoa aparece nas telas de todo mundo. */
export function useContentItems() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("content_items")
      .select("*")
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error("useContentItems:", error.message);
        setItems(ordenarContentItems((data ?? []) as ContentItem[]));
        setCarregando(false);
      });

    const channel = supabase
      .channel("content_items-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "content_items" },
        (payload) => {
          setItems((prev) => {
            if (payload.eventType === "INSERT") {
              return ordenarContentItems([...prev, payload.new as ContentItem]);
            }
            if (payload.eventType === "UPDATE") {
              return ordenarContentItems(
                prev.map((i) => (i.id === (payload.new as ContentItem).id ? (payload.new as ContentItem) : i))
              );
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((i) => i.id !== (payload.old as ContentItem).id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return { items, carregando };
}

export function useSprints() {
  const supabase = useMemo(() => createClient(), []);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("sprints")
      .select("*")
      .order("data_inicio", { ascending: false })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error("useSprints:", error.message);
        setSprints((data ?? []) as Sprint[]);
      });

    const channel = supabase
      .channel("sprints-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sprints" }, (payload) => {
        setSprints((prev) => {
          if (payload.eventType === "INSERT") {
            return [payload.new as Sprint, ...prev];
          }
          if (payload.eventType === "UPDATE") {
            return prev.map((s) => (s.id === (payload.new as Sprint).id ? (payload.new as Sprint) : s));
          }
          if (payload.eventType === "DELETE") {
            return prev.filter((s) => s.id !== (payload.old as Sprint).id);
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return sprints;
}

export function useTimeLogs(contentItemId: string) {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("time_logs")
      .select("*")
      .eq("content_item_id", contentItemId)
      .order("inicio", { ascending: false })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error("useTimeLogs:", error.message);
        setLogs((data ?? []) as TimeLog[]);
      });

    const channel = supabase
      .channel(`time_logs-${contentItemId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "time_logs", filter: `content_item_id=eq.${contentItemId}` },
        (payload) => {
          setLogs((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as TimeLog, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((l) => (l.id === (payload.new as TimeLog).id ? (payload.new as TimeLog) : l));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((l) => l.id !== (payload.old as TimeLog).id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [supabase, contentItemId]);

  return logs;
}

/** Todos os apontamentos de tempo (usado nos Indicadores). */
export function useAllTimeLogs() {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<TimeLog[]>([]);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("time_logs")
      .select("*")
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error("useAllTimeLogs:", error.message);
        setLogs((data ?? []) as TimeLog[]);
      });

    const channel = supabase
      .channel("time_logs-all-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "time_logs" }, (payload) => {
        setLogs((prev) => {
          if (payload.eventType === "INSERT") return [payload.new as TimeLog, ...prev];
          if (payload.eventType === "UPDATE")
            return prev.map((l) => (l.id === (payload.new as TimeLog).id ? (payload.new as TimeLog) : l));
          if (payload.eventType === "DELETE") return prev.filter((l) => l.id !== (payload.old as TimeLog).id);
          return prev;
        });
      })
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return logs;
}

export function useDailyLogs() {
  const supabase = useMemo(() => createClient(), []);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  useEffect(() => {
    let ativo = true;

    supabase
      .from("daily_logs")
      .select("*")
      .order("data", { ascending: false })
      .limit(120)
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) console.error("useDailyLogs:", error.message);
        setLogs((data ?? []) as DailyLog[]);
      });

    const channel = supabase
      .channel("daily_logs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_logs" }, (payload) => {
        setLogs((prev) => {
          if (payload.eventType === "INSERT") return [payload.new as DailyLog, ...prev];
          if (payload.eventType === "UPDATE")
            return prev.map((l) => (l.id === (payload.new as DailyLog).id ? (payload.new as DailyLog) : l));
          if (payload.eventType === "DELETE") return prev.filter((l) => l.id !== (payload.old as DailyLog).id);
          return prev;
        });
      })
      .subscribe();

    return () => {
      ativo = false;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return logs;
}

async function chamar<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.erro ?? `Erro ${res.status}`);
  return json as T;
}

export const api = {
  criarItem: (body: unknown) => chamar("/api/content-items", "POST", body),
  atualizarItem: (id: string, body: unknown) => chamar(`/api/content-items/${id}`, "PATCH", body),
  excluirItem: (id: string) => chamar(`/api/content-items/${id}`, "DELETE"),

  iniciarTimer: (body: unknown) => chamar("/api/time-logs", "POST", body),
  lancarTempoManual: (body: unknown) => chamar("/api/time-logs", "POST", body),
  pararTimer: (id: string, body?: unknown) => chamar(`/api/time-logs/${id}`, "PATCH", body),
  excluirTempo: (id: string) => chamar(`/api/time-logs/${id}`, "DELETE"),

  sprintAtual: () => chamar("/api/sprints/current", "GET"),
  sprintSeguinte: () => chamar("/api/sprints/next", "GET"),
  atualizarSprint: (id: string, body: unknown) => chamar(`/api/sprints/${id}`, "PATCH", body),

  salvarDaily: (body: unknown) => chamar("/api/daily-logs", "POST", body),
};

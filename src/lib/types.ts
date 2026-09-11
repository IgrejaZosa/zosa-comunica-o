export type TipoConteudo = "reels" | "stories" | "estatico" | "trend";

export const TIPO_LABELS: Record<TipoConteudo, string> = {
  reels: "Reels",
  stories: "Stories",
  estatico: "Estático",
  trend: "Trend",
};

export const TIPO_COLORS: Record<TipoConteudo, { fg: string; bg: string }> = {
  reels: { fg: "var(--color-tipo-reels)", bg: "var(--color-tipo-reels-bg)" },
  stories: { fg: "var(--color-tipo-stories)", bg: "var(--color-tipo-stories-bg)" },
  estatico: { fg: "var(--color-tipo-estatico)", bg: "var(--color-tipo-estatico-bg)" },
  trend: { fg: "var(--color-tipo-trend)", bg: "var(--color-tipo-trend-bg)" },
};

export type Estagio =
  | "backlog"
  | "sprint"
  | "producao"
  | "edicao"
  | "pronto"
  | "postado"
  | "cancelado";

export const ESTAGIO_LABELS: Record<Estagio, string> = {
  backlog: "Backlog",
  sprint: "A Fazer",
  producao: "Em Produção",
  edicao: "Em Edição",
  pronto: "Pronto p/ Postar",
  postado: "Postado",
  cancelado: "Cancelado",
};

/** Ordem das colunas do quadro Scrum (backlog e cancelado ficam fora do
 * quadro padrão, que mostra só o fluxo ativo da sprint). */
export const ESTAGIO_QUADRO: Estagio[] = [
  "sprint",
  "producao",
  "edicao",
  "pronto",
  "postado",
];

export const ESTAGIO_COLORS: Record<Estagio, { fg: string; bg: string }> = {
  backlog: { fg: "var(--color-estagio-backlog)", bg: "var(--color-estagio-backlog-bg)" },
  sprint: { fg: "var(--color-estagio-sprint)", bg: "var(--color-estagio-sprint-bg)" },
  producao: { fg: "var(--color-estagio-producao)", bg: "var(--color-estagio-producao-bg)" },
  edicao: { fg: "var(--color-estagio-edicao)", bg: "var(--color-estagio-edicao-bg)" },
  pronto: { fg: "var(--color-estagio-pronto)", bg: "var(--color-estagio-pronto-bg)" },
  postado: { fg: "var(--color-estagio-postado)", bg: "var(--color-estagio-postado-bg)" },
  cancelado: { fg: "var(--color-estagio-cancelado)", bg: "var(--color-estagio-cancelado-bg)" },
};

export type EtapaTempo = "producao" | "edicao" | "postagem";

export const ETAPA_TEMPO_LABELS: Record<EtapaTempo, string> = {
  producao: "Produção",
  edicao: "Edição",
  postagem: "Postagem",
};

export interface Profile {
  id: string;
  nome: string;
  cor: string;
  is_admin: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  nome: string;
  handle: string;
  cor: string;
  cor_bg: string;
  created_at: string;
}

export interface Sprint {
  id: string;
  data_inicio: string; // ISO date, sexta pós-almoço
  data_fim: string; // ISO date, sexta seguinte pré-almoço
  meta: string | null;
  created_at: string;
}

export interface ContentItem {
  id: string;
  account_id: string;
  tipo: TipoConteudo;
  data_planejada: string | null; // ISO date
  evento_motivo: string | null;
  ideia: string;
  referencias: string | null;
  observacoes: string | null;
  responsavel_filmagem_id: string | null;
  responsavel_gravacao_id: string | null;
  responsavel_edicao_id: string | null;
  responsavel_postagem_id: string | null;
  estagio: Estagio;
  sprint_id: string | null;
  ordem: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeLog {
  id: string;
  content_item_id: string;
  user_id: string;
  etapa: EtapaTempo;
  inicio: string;
  fim: string | null;
  duracao_minutos: number | null;
  observ: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  data: string; // ISO date
  fiz_ontem: string | null;
  farei_hoje: string | null;
  impedimentos: string | null;
  created_at: string;
  updated_at: string;
}

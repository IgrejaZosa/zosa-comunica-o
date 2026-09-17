import { addDays, addMonths, addYears, format, parseISO, startOfMonth, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sprintParaData } from "@/lib/sprint";

export type Periodicidade = "dia" | "semana" | "mes" | "semestre" | "ano";

export const PERIODICIDADE_LABELS: Record<Periodicidade, string> = {
  dia: "Diário",
  semana: "Semanal",
  mes: "Mensal",
  semestre: "Semestral",
  ano: "Anual",
};

export const PERIODICIDADES: Periodicidade[] = ["dia", "semana", "mes", "semestre", "ano"];

function fmtISO(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/** Início (inclusivo) e fim (exclusivo) do período que contém `refIso`,
 * no formato yyyy-MM-dd. A semana usa a mesma janela sexta-a-sexta das
 * sprints, pra bater com o resto do app. */
export function periodoAtual(tipo: Periodicidade, refIso: string): { inicio: string; fim: string } {
  const ref = parseISO(refIso);
  switch (tipo) {
    case "dia":
      return { inicio: refIso, fim: fmtISO(addDays(ref, 1)) };
    case "semana": {
      const { data_inicio, data_fim } = sprintParaData(refIso);
      return { inicio: data_inicio, fim: data_fim };
    }
    case "mes":
      return { inicio: fmtISO(startOfMonth(ref)), fim: fmtISO(startOfMonth(addMonths(ref, 1))) };
    case "semestre": {
      const ano = ref.getFullYear();
      const inicioMes = ref.getMonth() < 6 ? 0 : 6;
      return {
        inicio: fmtISO(new Date(ano, inicioMes, 1)),
        fim: fmtISO(new Date(ano, inicioMes + 6, 1)),
      };
    }
    case "ano":
      return { inicio: fmtISO(startOfYear(ref)), fim: fmtISO(startOfYear(addYears(ref, 1))) };
  }
}

/** Data de referência do período seguinte/anterior - pula sempre pro
 * primeiro/último dia do período vizinho (nunca soma direto no
 * refIso), pra não escorregar em meses/anos de tamanho diferente. */
export function navegarPeriodo(tipo: Periodicidade, refIso: string, direcao: 1 | -1): string {
  const { inicio, fim } = periodoAtual(tipo, refIso);
  if (direcao === 1) return fim;
  return fmtISO(addDays(parseISO(inicio), -1));
}

export function formatarPeriodo(tipo: Periodicidade, inicio: string, fim: string): string {
  const i = parseISO(inicio);
  switch (tipo) {
    case "dia":
      return format(i, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    case "semana":
      return `Semana de ${format(i, "dd/MM")} a ${format(parseISO(fim), "dd/MM")}`;
    case "mes":
      return format(i, "MMMM 'de' yyyy", { locale: ptBR });
    case "semestre":
      return `${i.getMonth() < 6 ? "1º" : "2º"} semestre de ${i.getFullYear()}`;
    case "ano":
      return `${i.getFullYear()}`;
  }
}

/** Fração (0 a 1) do período já decorrida até `agora` - usada pra
 * comparar o que já foi entregue com o que já era esperado até agora,
 * não com o total do período inteiro (que só fecha no fim dele). */
export function fracaoDecorrida(inicio: string, fim: string, agora: Date): number {
  const inicioMs = parseISO(inicio).getTime();
  const fimMs = parseISO(fim).getTime();
  const agoraMs = agora.getTime();
  if (agoraMs <= inicioMs) return 0;
  if (agoraMs >= fimMs) return 1;
  return (agoraMs - inicioMs) / (fimMs - inicioMs);
}

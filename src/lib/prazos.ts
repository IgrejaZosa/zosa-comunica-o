import { addDays, format, parseISO } from "date-fns";
import type { Estagio } from "@/lib/types";

/** A data planejada de um item é a data de POSTAGEM. A partir dela,
 * calcula até quando precisa estar editado (1 dia antes de postar) e até
 * quando precisa estar gravado (3 dias antes do prazo de edição) - o
 * fluxo de produção do time. */
export function calcularPrazos(dataPostagem: string): { prazoEdicao: string; prazoGravacao: string } {
  const dPostagem = parseISO(dataPostagem);
  const prazoEdicao = format(addDays(dPostagem, -1), "yyyy-MM-dd");
  const prazoGravacao = format(addDays(dPostagem, -4), "yyyy-MM-dd");
  return { prazoEdicao, prazoGravacao };
}

/** Enquanto o item não chegou nesses estágios, aquela etapa do fluxo de
 * produção ainda está pendente - usado tanto pros lembretes do
 * calendário quanto pra contagem de demandas dos Indicadores. */
export const AINDA_PRECISA_GRAVAR = new Set<Estagio>(["backlog", "sprint", "producao"]);
export const AINDA_PRECISA_EDITAR = new Set<Estagio>(["backlog", "sprint", "producao", "edicao"]);

import { addDays, format, parseISO } from "date-fns";

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

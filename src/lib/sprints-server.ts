import { createServiceClient } from "@/lib/supabase/server";
import { sprintParaData } from "@/lib/sprint";

/** Garante que existe uma linha em `sprints` cobrindo a semana da data
 * informada e retorna o id dela (cria se ainda não existir). */
export async function garantirSprintId(dataPlanejada: string): Promise<string> {
  const { data_inicio, data_fim } = sprintParaData(dataPlanejada);
  const supabase = createServiceClient();

  const { data: existente, error: erroBusca } = await supabase
    .from("sprints")
    .select("id")
    .eq("data_inicio", data_inicio)
    .maybeSingle();
  if (erroBusca) throw new Error(erroBusca.message);
  if (existente) return existente.id;

  const { data: nova, error: erroInsert } = await supabase
    .from("sprints")
    .insert({ data_inicio, data_fim })
    .select("id")
    .single();
  if (erroInsert) throw new Error(erroInsert.message);
  return nova.id;
}

/** sprint_id de um item deriva sempre da data_planejada: sem data, sem
 * sprint. Isso garante que o Quadro/Sprint Atual só mostrem o que
 * realmente cai na semana da sprint. */
export async function calcularSprintId(dataPlanejada: string | null): Promise<string | null> {
  if (!dataPlanejada) return null;
  return garantirSprintId(dataPlanejada);
}

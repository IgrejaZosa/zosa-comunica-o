import { createServiceClient } from "@/lib/supabase/server";
import { sprintParaData } from "@/lib/sprint";
import type { Sprint } from "@/lib/types";

/** Garante que existe uma linha em `sprints` cobrindo [data_inicio,
 * data_fim) e retorna ela (cria se ainda não existir). */
export async function garantirSprint(data_inicio: string, data_fim: string): Promise<Sprint> {
  const supabase = createServiceClient();

  const { data: existente, error: erroBusca } = await supabase
    .from("sprints")
    .select("*")
    .eq("data_inicio", data_inicio)
    .maybeSingle();
  if (erroBusca) throw new Error(erroBusca.message);
  if (existente) return existente as Sprint;

  const { data: nova, error: erroInsert } = await supabase
    .from("sprints")
    .insert({ data_inicio, data_fim })
    .select("*")
    .single();
  if (erroInsert) throw new Error(erroInsert.message);
  return nova as Sprint;
}

/** sprint_id de um item deriva sempre da data_planejada: sem data, sem
 * sprint. Isso garante que o Quadro/Sprint Atual só mostrem o que
 * realmente cai na semana da sprint.
 *
 * Primeiro procura uma sprint já existente cujo período (possivelmente
 * ajustado manualmente na tela de Sprint Planning) contenha essa data -
 * só cai no cálculo padrão (sexta a sexta) se nenhuma cobrir a data. */
export async function calcularSprintId(dataPlanejada: string | null): Promise<string | null> {
  if (!dataPlanejada) return null;

  const supabase = createServiceClient();
  const { data: existente, error } = await supabase
    .from("sprints")
    .select("*")
    .lte("data_inicio", dataPlanejada)
    .gt("data_fim", dataPlanejada)
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existente) return (existente as Sprint).id;

  const { data_inicio, data_fim } = sprintParaData(dataPlanejada);
  const sprint = await garantirSprint(data_inicio, data_fim);
  return sprint.id;
}

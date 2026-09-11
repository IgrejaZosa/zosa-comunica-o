import { NextResponse } from "next/server";
import { exigirPerfil, erroJson } from "@/lib/api-helpers";
import { garantirSprint } from "@/lib/sprints-server";
import { sprintSeguinte } from "@/lib/sprint";

/** Retorna a sprint seguinte à atual (usada no Sprint Planning), criando-a
 * se ainda nao existir. */
export async function GET() {
  const { erro } = await exigirPerfil();
  if (erro) return erro;

  try {
    const { data_inicio, data_fim } = sprintSeguinte();
    const sprint = await garantirSprint(data_inicio, data_fim);
    return NextResponse.json(sprint);
  } catch (err) {
    return erroJson(err instanceof Error ? err.message : "Erro ao buscar a próxima sprint.", 500);
  }
}

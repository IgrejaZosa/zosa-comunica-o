/**
 * Sprints semanais: sexta-feira pós-almoço até a sexta-feira seguinte
 * pré-almoço (corte às 13h, horário de Brasília — fixo em UTC-3, já que o
 * Brasil não usa mais horário de verão).
 */

const BRT_OFFSET_HOURS = 3;
const CORTE_HORA = 13;

function paraBrt(data: Date): Date {
  return new Date(data.getTime() - BRT_OFFSET_HOURS * 60 * 60 * 1000);
}

function deBrt(dataBrt: Date): Date {
  return new Date(dataBrt.getTime() + BRT_OFFSET_HOURS * 60 * 60 * 1000);
}

function apenasData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Retorna o início (data, sexta) e fim (data, sexta seguinte) da sprint
 * vigente no instante informado (padrão: agora). */
export function sprintVigente(agora: Date = new Date()): {
  data_inicio: string;
  data_fim: string;
} {
  const brt = paraBrt(agora);
  const diaSemana = brt.getUTCDay(); // 0=domingo ... 5=sexta ... 6=sabado
  const hora = brt.getUTCHours();

  // dias desde a ultima sexta (0 se hoje for sexta)
  let diasDesdeSexta = (diaSemana - 5 + 7) % 7;
  // se hoje é sexta mas ainda não passou das 13h, a sprint que está
  // "vigente" é a que começou na sexta anterior (ainda não virou)
  if (diasDesdeSexta === 0 && hora < CORTE_HORA) {
    diasDesdeSexta = 7;
  }

  const inicioBrt = new Date(
    Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate() - diasDesdeSexta, CORTE_HORA, 0, 0)
  );
  const fimBrt = new Date(inicioBrt.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    data_inicio: apenasData(deBrt(inicioBrt)),
    data_fim: apenasData(deBrt(fimBrt)),
  };
}

export function formatarPeriodoSprint(data_inicio: string, data_fim: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return `${fmt(data_inicio)} a ${fmt(data_fim)}`;
}

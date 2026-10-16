/**
 * Sprints semanais: começam na segunda-feira de manhã e vão até a sexta-feira
 * à noite. O fim de semana ainda pertence à sprint que acabou na sexta - a
 * virada só acontece na segunda (horário de Brasília, fixo em UTC-3, já que o
 * Brasil não usa mais horário de verão).
 *
 * No banco a janela é guardada como [segunda, segunda seguinte): o fim é
 * exclusivo (é o início da próxima sprint), o que mantém sábado e domingo
 * dentro da sprint da semana. Na tela, o fim aparece como sexta (veja
 * `ultimoDiaDaSprint`).
 */

const BRT_OFFSET_HOURS = 3;
const DIA_MS = 24 * 60 * 60 * 1000;

function paraBrt(data: Date): Date {
  return new Date(data.getTime() - BRT_OFFSET_HOURS * 60 * 60 * 1000);
}

function apenasData(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Janela [segunda, segunda seguinte) que contém o dia informado (um Date
 * em UTC à meia-noite, usado só pela data). */
function janelaDaSemana(diaUtc: Date): { data_inicio: string; data_fim: string } {
  const diasDesdeSegunda = (diaUtc.getUTCDay() + 6) % 7; // segunda=0 ... domingo=6
  const inicio = new Date(diaUtc.getTime() - diasDesdeSegunda * DIA_MS);
  const fim = new Date(inicio.getTime() + 7 * DIA_MS);
  return { data_inicio: apenasData(inicio), data_fim: apenasData(fim) };
}

/** Retorna o início (segunda) e fim exclusivo (segunda seguinte) da sprint
 * vigente no instante informado (padrão: agora). */
export function sprintVigente(agora: Date = new Date()): {
  data_inicio: string;
  data_fim: string;
} {
  const brt = paraBrt(agora);
  return janelaDaSemana(new Date(Date.UTC(brt.getUTCFullYear(), brt.getUTCMonth(), brt.getUTCDate())));
}

/** Retorna a janela da sprint que contém a data informada (ex: a
 * data_planejada de um item). Usado para que um item só apareça na sprint
 * cuja janela realmente contém a data planejada. */
export function sprintParaData(dataISO: string): { data_inicio: string; data_fim: string } {
  return janelaDaSemana(new Date(`${dataISO}T00:00:00Z`));
}

/** Retorna a sprint seguinte à vigente agora - usada na tela de Sprint
 * Planning, pra preparar a semana antes dela começar. */
export function sprintSeguinte(agora: Date = new Date()): {
  data_inicio: string;
  data_fim: string;
} {
  const atual = sprintVigente(agora);
  const inicio = new Date(`${atual.data_fim}T00:00:00Z`);
  const fim = new Date(inicio.getTime() + 7 * DIA_MS);
  return {
    data_inicio: atual.data_fim,
    data_fim: apenasData(fim),
  };
}

/** Último dia da sprint pra mostrar na tela: o dia anterior ao fim
 * exclusivo - e, se isso cair no fim de semana, a sexta anterior (a
 * sprint "termina" na sexta, mesmo o fim de semana ainda contando nela). */
export function ultimoDiaDaSprint(data_fim: string): string {
  let ms = new Date(`${data_fim}T00:00:00Z`).getTime() - DIA_MS;
  const diaSemana = new Date(ms).getUTCDay();
  if (diaSemana === 0) ms -= 2 * DIA_MS;
  else if (diaSemana === 6) ms -= DIA_MS;
  return apenasData(new Date(ms));
}

/** Inverso de `ultimoDiaDaSprint`: a partir do último dia escolhido na
 * tela, o fim exclusivo guardado no banco. Se o último dia é sexta, o fim
 * de semana continua dentro da sprint (fim = segunda seguinte). */
export function fimExclusivoDoUltimoDia(ultimoDia: string): string {
  const d = new Date(`${ultimoDia}T00:00:00Z`);
  const dias = d.getUTCDay() === 5 ? 3 : 1;
  return apenasData(new Date(d.getTime() + dias * DIA_MS));
}

export function formatarPeriodoSprint(data_inicio: string, data_fim: string): string {
  const fmt = (iso: string) => {
    const [, m, d] = iso.split("-");
    return `${d}/${m}`;
  };
  return `${fmt(data_inicio)} a ${fmt(ultimoDiaDaSprint(data_fim))}`;
}

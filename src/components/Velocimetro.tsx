function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const largeArc = Math.abs(startDeg - endDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export type StatusVelocimetro = "sem-dados" | "futuro" | "atrasado" | "atencao" | "em-dia";

const STATUS_INFO: Record<StatusVelocimetro, { cor: string; texto: string }> = {
  "sem-dados": { cor: "var(--color-zosa-muted)", texto: "Sem dados neste período" },
  futuro: { cor: "var(--color-zosa-muted)", texto: "Período ainda não começou" },
  atrasado: { cor: "var(--color-zosa-danger)", texto: "Atrasado em relação ao ritmo esperado" },
  atencao: { cor: "var(--color-zosa-warn)", texto: "Um pouco abaixo do ritmo esperado" },
  "em-dia": { cor: "var(--color-zosa-teal)", texto: "No ritmo esperado" },
};

/** Farol/velocímetro: mostra o quanto do que já era esperado até agora
 * (previsto ajustado pela fração do período já decorrida) já foi
 * entregue de fato. `ratio` pode passar de 1 (adiantado). */
export function Velocimetro({ ratio, status }: { ratio: number; status: StatusVelocimetro }) {
  const cx = 100;
  const cy = 95;
  const r = 78;
  const semDados = status === "sem-dados" || status === "futuro";
  const clamped = Math.max(0, Math.min(1, ratio));
  const needleAngle = 180 - clamped * 180;
  const tip = polarToCartesian(cx, cy, r - 16, needleAngle);
  const info = STATUS_INFO[status];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 118" className="w-full max-w-[260px]">
        <path
          d={arcPath(cx, cy, r, 180, 120)}
          stroke="var(--color-zosa-danger)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, 120, 60)}
          stroke="var(--color-zosa-warn)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arcPath(cx, cy, r, 60, 0)}
          stroke="var(--color-zosa-teal)"
          strokeWidth="18"
          fill="none"
          strokeLinecap="round"
        />
        <line
          x1={cx}
          y1={cy}
          x2={tip.x}
          y2={tip.y}
          stroke={semDados ? "var(--color-zosa-muted)" : "var(--color-zosa-ink)"}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="7" fill={semDados ? "var(--color-zosa-muted)" : "var(--color-zosa-ink)"} />
      </svg>
      <p className="text-5xl font-extrabold leading-none -mt-2" style={{ color: info.cor }}>
        {semDados ? "—" : `${Math.round(ratio * 100)}%`}
      </p>
      <p className="text-sm font-semibold text-center mt-2" style={{ color: info.cor }}>
        {info.texto}
      </p>
    </div>
  );
}

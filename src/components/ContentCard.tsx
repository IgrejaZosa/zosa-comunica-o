"use client";

import { useSession } from "@/lib/session-context";
import { Badge } from "@/components/Badge";
import { TIPO_COLORS, TIPO_LABELS, type ContentItem } from "@/lib/types";

export function ContentCard({
  item,
  onClick,
  compact = false,
}: {
  item: ContentItem;
  onClick: () => void;
  compact?: boolean;
}) {
  const { accounts, profiles } = useSession();
  const conta = accounts.find((a) => a.id === item.account_id);
  const criador = profiles.find((p) => p.id === item.responsavel_criacao_id);
  const tipoCor = TIPO_COLORS[item.tipo];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-zosa-border bg-white p-2 hover:shadow-md hover:border-zosa-teal transition-all"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <Badge label={TIPO_LABELS[item.tipo]} fg={tipoCor.fg} bg={tipoCor.bg} />
        {conta && (
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: conta.cor }}
            title={conta.handle}
          />
        )}
      </div>
      <p className={`text-zosa-ink font-medium leading-snug ${compact ? "text-xs line-clamp-2" : "text-sm line-clamp-3"}`}>
        {item.ideia}
      </p>
      {item.evento_motivo && !compact && (
        <p className="text-xs text-zosa-muted mt-0.5 truncate">{item.evento_motivo}</p>
      )}
      {criador && (
        <div className="flex items-center gap-1 mt-1.5">
          <span
            className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
            style={{ backgroundColor: criador.cor }}
          >
            {criador.nome.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-[11px] text-zosa-muted truncate">{criador.nome}</span>
        </div>
      )}
    </button>
  );
}

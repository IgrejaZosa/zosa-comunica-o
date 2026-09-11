"use client";

import { useSession } from "@/lib/session-context";
import { useProjetos } from "@/lib/hooks";
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
  const projetos = useProjetos();
  const conta = accounts.find((a) => a.id === item.account_id);
  const responsavel = profiles.find((p) => p.id === item.responsavel_gravacao_id);
  const projeto = projetos.find((p) => p.id === item.projeto_id);
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
      {projeto && !compact && (
        <p className="text-xs text-zosa-muted mt-0.5 truncate">{projeto.nome}</p>
      )}
      {responsavel && (
        <div className="flex items-center gap-1 mt-1.5">
          <span
            className="h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
            style={{ backgroundColor: responsavel.cor }}
          >
            {responsavel.nome.slice(0, 1).toUpperCase()}
          </span>
          <span className="text-[11px] text-zosa-muted truncate">{responsavel.nome}</span>
        </div>
      )}
    </button>
  );
}

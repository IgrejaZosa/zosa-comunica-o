"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSession } from "@/lib/session-context";
import { Badge } from "@/components/Badge";
import { ESTAGIO_COLORS, ESTAGIO_LABELS, TIPO_COLORS, TIPO_LABELS, type ContentItem } from "@/lib/types";

/** Linha de tabela reaproveitada no Backlog Mensal e no Sprint Planning -
 * mesma info, cada tela só muda a ação extra do lado direito. */
export function ContentItemRow({
  item,
  onEdit,
  acaoExtra,
}: {
  item: ContentItem;
  onEdit: () => void;
  acaoExtra?: React.ReactNode;
}) {
  const { accounts, profiles } = useSession();
  const tipoCor = TIPO_COLORS[item.tipo];
  const estagioCor = ESTAGIO_COLORS[item.estagio];
  const conta = accounts.find((a) => a.id === item.account_id);
  const filmagem = profiles.find((p) => p.id === item.responsavel_filmagem_id);
  const postador = profiles.find((p) => p.id === item.responsavel_postagem_id);

  return (
    <tr className="border-b border-zosa-border hover:bg-zosa-cream/40">
      <td className="px-2 py-2 text-xs text-zosa-muted whitespace-nowrap">
        {item.data_planejada ? format(parseISO(item.data_planejada), "dd/MM (EEE)", { locale: ptBR }) : "—"}
      </td>
      <td className="px-2 py-2 text-xs whitespace-nowrap">{conta?.handle ?? "—"}</td>
      <td className="px-2 py-2">
        <Badge label={TIPO_LABELS[item.tipo]} fg={tipoCor.fg} bg={tipoCor.bg} />
      </td>
      <td className="px-2 py-2 text-xs whitespace-nowrap">{filmagem?.nome ?? "—"}</td>
      <td className="px-2 py-2 text-xs">{item.evento_motivo ?? "—"}</td>
      <td className="px-2 py-2 text-sm max-w-xs truncate" title={item.ideia}>
        {item.ideia}
      </td>
      <td className="px-2 py-2">
        <Badge label={ESTAGIO_LABELS[item.estagio]} fg={estagioCor.fg} bg={estagioCor.bg} />
      </td>
      <td className="px-2 py-2 text-xs whitespace-nowrap">{postador?.nome ?? "—"}</td>
      <td className="px-2 py-2 whitespace-nowrap">
        <div className="flex gap-1">
          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={onEdit}>
            Editar
          </button>
          {acaoExtra}
        </div>
      </td>
    </tr>
  );
}

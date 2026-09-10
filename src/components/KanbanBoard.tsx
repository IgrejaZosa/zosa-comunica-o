"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { ContentCard } from "@/components/ContentCard";
import { api } from "@/lib/api";
import { ESTAGIO_COLORS, ESTAGIO_LABELS, ESTAGIO_QUADRO, type ContentItem, type Estagio } from "@/lib/types";

function DraggableCard({ item, onOpenItem }: { item: ContentItem; onOpenItem: (item: ContentItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 10 }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? "opacity-50" : ""}>
      <ContentCard item={item} onClick={() => onOpenItem(item)} compact />
    </div>
  );
}

function Column({
  estagio,
  items,
  onOpenItem,
}: {
  estagio: Estagio;
  items: ContentItem[];
  onOpenItem: (item: ContentItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: estagio });
  const cor = ESTAGIO_COLORS[estagio];

  return (
    <div className="flex flex-col w-64 shrink-0">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-sm font-semibold" style={{ color: cor.fg }}>
          {ESTAGIO_LABELS[estagio]}
        </span>
        <span className="text-xs text-zosa-muted rounded-full bg-zosa-cream px-2 py-0.5">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[200px] rounded-xl p-2 space-y-2 border-2 border-dashed transition-colors ${
          isOver ? "border-zosa-teal bg-zosa-tealbg" : "border-transparent"
        }`}
        style={{ backgroundColor: isOver ? undefined : cor.bg }}
      >
        {items.map((item) => (
          <DraggableCard key={item.id} item={item} onOpenItem={onOpenItem} />
        ))}
        {items.length === 0 && <p className="text-xs text-zosa-muted italic px-1">Vazio</p>}
      </div>
    </div>
  );
}

export function KanbanBoard({
  items,
  onOpenItem,
}: {
  items: ContentItem[];
  onOpenItem: (item: ContentItem) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [movendo, setMovendo] = useState(false);

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const novoEstagio = over.id as Estagio;
    const item = items.find((i) => i.id === active.id);
    if (!item || item.estagio === novoEstagio) return;

    setMovendo(true);
    try {
      await api.atualizarItem(item.id, { estagio: novoEstagio, ordem: Date.now() });
    } finally {
      setMovendo(false);
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className={`flex gap-3 overflow-x-auto pb-2 ${movendo ? "opacity-90" : ""}`}>
        {ESTAGIO_QUADRO.map((estagio) => (
          <Column
            key={estagio}
            estagio={estagio}
            items={items.filter((i) => i.estagio === estagio)}
            onOpenItem={onOpenItem}
          />
        ))}
      </div>
    </DndContext>
  );
}

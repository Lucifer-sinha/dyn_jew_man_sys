// src/pages/SortableItem.jsx
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react"; // Optional: drag handle icon

function SortableItem({ id, name, level, onDelete, onAddSub }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    paddingLeft: `${level * 20}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between py-2 px-3 rounded bg-[#1E3A5A] mb-1"
    >
      <div className="flex items-center gap-2">
        <span {...listeners} className="cursor-grab">
          <GripVertical size={16} />
        </span>
        <span>{name}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAddSub}
          className="text-xs bg-yellow-500 text-black px-2 py-1 rounded hover:bg-yellow-400"
        >
          + Sub
        </button>
        <button
          onClick={onDelete}
          className="text-xs bg-red-600 px-2 py-1 rounded hover:bg-red-500"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default SortableItem;

import { useApp } from '../../context/AppContext';
import EditableCell from '../EditableCell';
import StatusBadge from '../StatusBadge';
import { CircuitRow, CircuitStatus } from '../../types';
import { formatDuration } from '../../utils/calculations';
import { cn } from '../../lib/utils';
import { ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const statusOptions = [
  { value: 'OK', label: 'OK' },
  { value: 'FAULTY', label: 'FAULTY' },
  { value: 'NIL', label: 'NIL' },
];

// --- Internal Sortable Row Component ---
interface SortableRowProps {
  row: CircuitRow;
  isSubRow?: boolean;
  isExpanded?: boolean;
  hasSubRows?: boolean;
  toggleExpand?: (id: string) => void;
  renderSubRows?: (subRows: CircuitRow[]) => React.ReactNode;
}

const SortableRow = ({
  row,
  isSubRow = false,
  isExpanded = false,
  hasSubRows = false,
  toggleExpand,
  renderSubRows,
}: SortableRowProps) => {
  const { updateCircuit, isEditMode } = useApp();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: 'relative' as 'relative',
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={cn(
          "hover:bg-muted/50 transition-colors",
          isSubRow && "bg-muted/30",
          row.status === 'FAULTY' && "bg-destructive/5",
          isDragging && "opacity-50 bg-muted border-2 border-primary/20"
        )}
      >
        {/* Drag Handle - Only visible in Edit Mode and for main rows */}
        <td className="railway-grid-cell w-[40px] p-0 text-center">
          {!isSubRow && isEditMode && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
        </td>

        {/* <td className="railway-grid-cell text-center font-medium w-12">
          {row.srNo}
        </td> */}
        <td className="railway-grid-cell">
          <div className="flex items-center gap-2">
            {hasSubRows && toggleExpand && (
              <button
                onClick={() => toggleExpand(row.id)}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <span className={cn(isSubRow && "pl-4", "font-medium")}>
              {row.name}
            </span>
          </div>
        </td>
        <td className="railway-grid-cell w-40">
          <EditableCell
            value={row.failureDateTime}
            onChange={(val) => updateCircuit(row.id, 'failureDateTime', val)}
            type="datetime"
            auditTrail={row.auditTrail}
            lastEditedBy={row.lastEditedBy}
            lastEditedAt={row.lastEditedAt}
          />
        </td>
        <td className="railway-grid-cell w-40">
          <EditableCell
            value={row.restorationDateTime}
            onChange={(val) => updateCircuit(row.id, 'restorationDateTime', val)}
            type="datetime"
            auditTrail={row.auditTrail}
            lastEditedBy={row.lastEditedBy}
            lastEditedAt={row.lastEditedAt}
          />
        </td>
        <td className="railway-grid-cell text-center w-24 font-mono">
          {formatDuration(row.failureDateTime, row.restorationDateTime)}
        </td>
        <td className="railway-grid-cell w-28">
          <EditableCell
            value={row.faultySection}
            onChange={(val) => updateCircuit(row.id, 'faultySection', val)}
            placeholder="Section"
            auditTrail={row.auditTrail}
            lastEditedBy={row.lastEditedBy}
            lastEditedAt={row.lastEditedAt}
          />
        </td>
        <td className="railway-grid-cell min-w-[200px]">
          <EditableCell
            value={row.remarks}
            onChange={(val) => updateCircuit(row.id, 'remarks', val)}
            type="textarea"
            placeholder="Remarks & Action Taken"
            auditTrail={row.auditTrail}
            lastEditedBy={row.lastEditedBy}
            lastEditedAt={row.lastEditedAt}
          />
        </td>
        <td className="railway-grid-cell text-center w-28">
          {isEditMode ? (
            <select
              value={row.status}
              onChange={(e) => updateCircuit(row.id, 'status', e.target.value as CircuitStatus)}
              className="railway-input-active text-center"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <StatusBadge status={row.status} />
          )}
        </td>
      </tr>
      {/* Render Sub Rows (Not draggable themselves, attached to parent) */}
      {hasSubRows && isExpanded && renderSubRows && renderSubRows(row.subRows!)}
    </>
  );
};

// --- Main Zone A Component ---
const ZoneACircuitTable = () => {
  const { circuits, reorderCircuits, isEditMode } = useApp();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['c13']));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = circuits.findIndex((c) => c.id === active.id);
      const newIndex = circuits.findIndex((c) => c.id === over.id);
      // Ensure reorderCircuits is defined in AppContext
      if (reorderCircuits) {
        reorderCircuits(oldIndex, newIndex);
      }
    }
  };

  return (
    <div className="zone-card">
      <div className="zone-header flex items-center justify-between">
        <span>Zone A: Circuit & Equipment Status</span>
        <span className="text-xs font-normal opacity-80">
          {circuits.length} circuits • {circuits.filter(c => c.status === 'FAULTY').length} faulty
        </span>
      </div>
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-secondary">
                <th className="railway-grid-cell w-[40px]"></th> {/* Drag Handle Column */}
                {/* <th className="railway-grid-cell text-left font-semibold">Sr No.</th> */}
                <th className="railway-grid-cell text-left font-semibold">Name of the Circuit</th>
                <th className="railway-grid-cell text-left font-semibold">Total Failure (Dt & Time)</th>
                <th className="railway-grid-cell text-left font-semibold">RT (Dt & Time)</th>
                <th className="railway-grid-cell text-left font-semibold">RM (Hrs:Min)</th>
                <th className="railway-grid-cell text-left font-semibold">Faulty Section</th>
                <th className="railway-grid-cell text-left font-semibold">Failure Remarks & Action Taken</th>
                <th className="railway-grid-cell text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              <SortableContext
                items={circuits.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {circuits.map(row => (
                  <SortableRow
                    key={row.id}
                    row={row}
                    hasSubRows={!!(row.subRows && row.subRows.length > 0)}
                    isExpanded={expandedRows.has(row.id)}
                    toggleExpand={toggleExpand}
                    renderSubRows={(subRows) => (
                      <>
                        {subRows.map(subRow => (
                          <SortableRow
                            key={subRow.id}
                            row={subRow}
                            isSubRow={true}
                          />
                        ))}
                      </>
                    )}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </DndContext>
      </div>
    </div>
  );
};

export default ZoneACircuitTable;
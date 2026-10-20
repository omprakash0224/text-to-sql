/**
 * DataSpeak — Interactive Results Table (DataTable.tsx)
 * Framed-sheet data grid using TanStack Table v8 adhering to app-screens.md:
 * - Sentence-case grey headers (no uppercase, no fill band)
 * - Right-aligned numeric columns with tabular figures
 * - No zebra striping, quiet 1px row dividers
 * - Density toggle (comfortable 44px vs compact 32px)
 */

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Maximize2,
  Minimize2,
  Table as TableIcon,
} from 'lucide-react';
import { ExportButton } from './ExportButton';

interface DataTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  questionPrompt?: string;
  executionTimeMs?: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  questionPrompt,
  executionTimeMs,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Detect Column Type for Glyph and Alignment
  const isColNumeric = (colName: string, firstVal?: unknown) => {
    const name = colName.toLowerCase();
    return (
      name.includes('id') ||
      name.includes('count') ||
      name.includes('total') ||
      name.includes('price') ||
      name.includes('amount') ||
      name.includes('sum') ||
      name.includes('revenue') ||
      name.includes('qty') ||
      typeof firstVal === 'number'
    );
  };

  const getColTypeGlyph = (colName: string, firstVal?: unknown) => {
    const name = colName.toLowerCase();
    if (isColNumeric(name, firstVal)) {
      return <Hash className="h-3 w-3 text-[#1b6c80]" />;
    }
    if (name.includes('date') || name.includes('time') || name.includes('at')) {
      return <Calendar className="h-3 w-3 text-[#2f70bb]" />;
    }
    if (typeof firstVal === 'boolean') {
      return <ToggleLeft className="h-3 w-3 text-[#a86f0c]" />;
    }
    return <Type className="h-3 w-3 text-[#5d5f60]" />;
  };

  // Build Column Definitions for TanStack Table
  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((colKey) => {
      const firstNonNull = rows.find((r) => r[colKey] !== null && r[colKey] !== undefined)?.[colKey];
      const isNum = isColNumeric(colKey, firstNonNull);

      return {
        accessorKey: colKey,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <div
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={`flex items-center gap-1.5 cursor-pointer select-none group ${
                isNum ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="opacity-70">{getColTypeGlyph(colKey, firstNonNull)}</span>
              <span className="font-medium text-[#5d5f60] text-xs">
                {colKey.replace(/_/g, ' ')}
              </span>
              <span className="text-[#5d5f60] group-hover:text-[#131416]">
                {isSorted === 'asc' ? (
                  <ArrowUp className="h-3 w-3 text-[#1b6c80]" />
                ) : isSorted === 'desc' ? (
                  <ArrowDown className="h-3 w-3 text-[#1b6c80]" />
                ) : (
                  <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </span>
            </div>
          );
        },
        cell: (info) => {
          const val = info.getValue();
          if (val === null || val === undefined) {
            return <div className={isNum ? 'text-right' : 'text-left'}><span className="text-[#5d5f60] font-sans">—</span></div>;
          }

          if (typeof val === 'number') {
            const isCurrency =
              colKey.toLowerCase().includes('price') ||
              colKey.toLowerCase().includes('amount') ||
              colKey.toLowerCase().includes('revenue') ||
              colKey.toLowerCase().includes('total');

            return (
              <div className="text-right">
                <span className="tnum font-medium text-[#131416]">
                  {isCurrency
                    ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : val.toLocaleString()}
                </span>
              </div>
            );
          }

          if (typeof val === 'boolean') {
            return (
              <div className="text-left">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-medium ${
                    val ? 'bg-[#dcfae5] text-[#04250e]' : 'bg-[#ebedee] text-[#5d5f60]'
                  }`}
                >
                  {val ? 'true' : 'false'}
                </span>
              </div>
            );
          }

          if (typeof val === 'object') {
            return (
              <div className="text-left font-mono text-xs text-[#5d5f60]">
                {JSON.stringify(val)}
              </div>
            );
          }

          return <div className="text-left text-[#131416]">{String(val)}</div>;
        },
      };
    });
  }, [columns, rows]);

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const rowHeightClass = density === 'comfortable' ? 'h-11 px-3.5 py-2.5' : 'h-8 px-3 py-1 text-xs';

  return (
    <div className="w-full rounded-xl bg-white border border-[#e2e4e8] overflow-hidden my-3">
      {/* Table Toolbar */}
      <div className="h-12 px-3.5 bg-white border-b border-[#eceef0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TableIcon className="h-3.5 w-3.5 text-[#1b6c80]" />
          <h3 className="text-xs font-semibold text-[#131416]">Results</h3>
          <span className="text-[11px] text-[#5d5f60] tnum bg-[#ebedee] px-2 py-0.5 rounded-full">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </span>
          {executionTimeMs !== undefined && (
            <span className="text-[11px] text-[#5d5f60] tnum hidden sm:inline">
              ({executionTimeMs.toFixed(0)}ms)
            </span>
          )}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          <div className="inline-flex rounded-md bg-[#ebedee] p-0.5 text-xs text-[#5d5f60]">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`p-1 rounded transition-colors ${
                density === 'comfortable' ? 'bg-white text-[#131416] border border-[#e2e4e8]' : 'hover:text-[#131416]'
              }`}
              title="Comfortable density (44px)"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`p-1 rounded transition-colors ${
                density === 'compact' ? 'bg-white text-[#131416] border border-[#e2e4e8]' : 'hover:text-[#131416]'
              }`}
              title="Compact density (32px)"
            >
              <Minimize2 className="h-3 w-3" />
            </button>
          </div>

          {/* Export CSV Button */}
          <ExportButton
            columns={columns}
            rows={rows}
            questionPrompt={questionPrompt}
          />
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-[#eceef0]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-9 px-3.5 text-xs font-normal text-[#5d5f60] whitespace-nowrap select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[#eceef0]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-8 text-center text-xs text-[#5d5f60]">
                  No rows returned from this query
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#f7f8fa] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`${rowHeightClass} whitespace-nowrap text-[#131416]`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {table.getPageCount() > 1 && (
        <div className="h-10 px-3.5 bg-white border-t border-[#eceef0] flex items-center justify-between text-xs text-[#5d5f60]">
          <span className="tnum">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ({rows.length} total)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded border border-[#e2e4e8] hover:bg-[#f7f8fa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded border border-[#e2e4e8] hover:bg-[#f7f8fa] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

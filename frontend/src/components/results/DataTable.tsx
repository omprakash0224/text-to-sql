/**
 * DataSpeak — PostHog Interactive Results Table (DataTable.tsx)
 * Tabular data grid using TanStack Table v8 on warm cream canvas.
 * Supports sorting, pagination, density switching, type glyphs, and CSV export.
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

  const getColTypeGlyph = (colName: string, firstVal?: unknown) => {
    const name = colName.toLowerCase();
    if (
      name.includes('id') ||
      name.includes('count') ||
      name.includes('total') ||
      name.includes('price') ||
      name.includes('amount') ||
      name.includes('sum') ||
      name.includes('revenue') ||
      typeof firstVal === 'number'
    ) {
      return <Hash className="h-3 w-3 text-[#1d4ed8]" />;
    }
    if (name.includes('date') || name.includes('time') || name.includes('at')) {
      return <Calendar className="h-3 w-3 text-[#1078a3]" />;
    }
    if (typeof firstVal === 'boolean') {
      return <ToggleLeft className="h-3 w-3 text-[#7c44a6]" />;
    }
    return <Type className="h-3 w-3 text-[#6c6e63]" />;
  };

  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((colKey) => {
      const firstNonNull = rows.find((r) => r[colKey] !== null && r[colKey] !== undefined)?.[colKey];

      return {
        accessorKey: colKey,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <div
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex items-center gap-1.5 cursor-pointer select-none group"
            >
              <span className="opacity-75">{getColTypeGlyph(colKey, firstNonNull)}</span>
              <span className="font-bold text-[#23251d] text-xs font-mono">{colKey}</span>
              <span className="text-[#9b9c92] group-hover:text-[#23251d]">
                {isSorted === 'asc' ? (
                  <ArrowUp className="h-3 w-3 text-[#1d4ed8]" />
                ) : isSorted === 'desc' ? (
                  <ArrowDown className="h-3 w-3 text-[#1d4ed8]" />
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
            return <span className="text-[#9b9c92] italic font-sans">—</span>;
          }

          if (typeof val === 'number') {
            const isCurrency =
              colKey.toLowerCase().includes('price') ||
              colKey.toLowerCase().includes('amount') ||
              colKey.toLowerCase().includes('revenue') ||
              colKey.toLowerCase().includes('total');

            return (
              <span className="tnum font-bold text-[#23251d]">
                {isCurrency
                  ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : val.toLocaleString()}
              </span>
            );
          }

          if (typeof val === 'boolean') {
            return (
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                  val ? 'bg-[#d9eddf] text-[#17543b]' : 'bg-[#e5e7e0] text-[#4d4f46]'
                }`}
              >
                {val ? 'TRUE' : 'FALSE'}
              </span>
            );
          }

          if (typeof val === 'object') {
            return <span className="font-mono text-xs text-[#4d4f46]">{JSON.stringify(val)}</span>;
          }

          return <span className="text-[#23251d]">{String(val)}</span>;
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

  const rowHeightClass = density === 'comfortable' ? 'h-11 px-4 py-2.5' : 'h-8 px-3 py-1 text-xs';

  return (
    <div className="w-full rounded-md bg-white border border-[#bfc1b7] overflow-hidden my-4 transition-all">
      {/* Table Toolbar */}
      <div className="h-14 px-4 bg-white border-b border-[#dcdfd2] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TableIcon className="h-4 w-4 text-[#1078a3]" />
          <h3 className="text-sm font-bold text-[#23251d]">Results Table</h3>
          <span className="text-xs text-[#4d4f46] tnum bg-[#eeefe9] border border-[#bfc1b7] px-2 py-0.5 rounded-full font-bold">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </span>
          {executionTimeMs !== undefined && (
            <span className="text-[11px] text-[#6c6e63] tnum font-mono hidden sm:inline">
              ({executionTimeMs.toFixed(0)}ms)
            </span>
          )}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          <div className="inline-flex rounded-md bg-[#e5e7e0] border border-[#bfc1b7] p-0.5 text-xs text-[#4d4f46]">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`p-1.5 rounded transition-colors ${
                density === 'comfortable' ? 'bg-white text-[#23251d] font-bold border border-[#bfc1b7]' : 'hover:text-[#23251d]'
              }`}
              title="Comfortable Density (44px)"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`p-1.5 rounded transition-colors ${
                density === 'compact' ? 'bg-white text-[#23251d] font-bold border border-[#bfc1b7]' : 'hover:text-[#23251d]'
              }`}
              title="Compact Density (32px)"
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
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-[#eeefe9] border-b border-[#bfc1b7]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-xs font-bold text-[#23251d] whitespace-nowrap select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[#dcdfd2]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-12 text-center text-xs text-[#6c6e63]">
                  No rows returned from this query
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#eeefe9]/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`${rowHeightClass} whitespace-nowrap text-[#23251d]`}
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

      {/* Table Pagination Footer */}
      {rows.length > 0 && (
        <div className="h-12 px-4 bg-[#eeefe9] border-t border-[#bfc1b7] flex items-center justify-between text-xs text-[#4d4f46]">
          <div className="tnum">
            Showing{' '}
            <span className="font-bold text-[#23251d]">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-[#23251d]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                rows.length
              )}
            </span>{' '}
            of <span className="font-bold text-[#23251d]">{rows.length}</span> rows
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[#23251d] border border-transparent hover:border-[#bfc1b7]"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-bold text-[#23251d] tnum">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[#23251d] border border-transparent hover:border-[#bfc1b7]"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

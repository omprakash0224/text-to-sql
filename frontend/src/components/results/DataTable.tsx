/**
 * DataSpeak — Interactive Results Table (DataTable.tsx)
 * Airtable-inspired data grid using TanStack Table v8.
 * Supports sorting, pagination, density switching (comfortable 44px vs compact 32px),
 * type glyphs, tabular numerals, and CSV export.
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

  // Detect Column Type for Glyph
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
      return <Hash className="h-3 w-3 text-[#0075de]" />;
    }
    if (name.includes('date') || name.includes('time') || name.includes('at')) {
      return <Calendar className="h-3 w-3 text-[#2a9d99]" />;
    }
    if (typeof firstVal === 'boolean') {
      return <ToggleLeft className="h-3 w-3 text-[#7c44a6]" />;
    }
    return <Type className="h-3 w-3 text-[#615d59]" />;
  };

  // Build Column Definitions for TanStack Table
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
              <span className="opacity-70">{getColTypeGlyph(colKey, firstNonNull)}</span>
              <span className="font-semibold text-[#31302e] text-xs font-mono">{colKey}</span>
              <span className="text-[#a39e98] group-hover:text-[#0075de]">
                {isSorted === 'asc' ? (
                  <ArrowUp className="h-3 w-3 text-[#0075de]" />
                ) : isSorted === 'desc' ? (
                  <ArrowDown className="h-3 w-3 text-[#0075de]" />
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
            return <span className="text-[#a39e98] italic font-sans">—</span>;
          }

          if (typeof val === 'number') {
            const isCurrency =
              colKey.toLowerCase().includes('price') ||
              colKey.toLowerCase().includes('amount') ||
              colKey.toLowerCase().includes('revenue') ||
              colKey.toLowerCase().includes('total');

            return (
              <span className="tnum font-medium text-[#0d0d0d]">
                {isCurrency
                  ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : val.toLocaleString()}
              </span>
            );
          }

          if (typeof val === 'boolean') {
            return (
              <span
                className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                  val ? 'bg-[#d9eddf] text-[#17543b]' : 'bg-[#efeeec] text-[#615d59]'
                }`}
              >
                {val ? 'TRUE' : 'FALSE'}
              </span>
            );
          }

          if (typeof val === 'object') {
            return <span className="font-mono text-xs text-[#615d59]">{JSON.stringify(val)}</span>;
          }

          return <span className="text-[#0d0d0d]">{String(val)}</span>;
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
    <div className="w-full rounded-xl bg-white border border-[#dddddd] overflow-hidden shadow-2xs my-4 transition-all">
      {/* Table Toolbar */}
      <div className="h-14 px-4 bg-white border-b border-[#eeeeec] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <TableIcon className="h-4 w-4 text-[#0075de]" />
          <h3 className="text-sm font-semibold text-[#0d0d0d]">Results Table</h3>
          <span className="text-xs text-[#615d59] tnum bg-[#efeeec] px-2 py-0.5 rounded-full font-medium">
            {rows.length} {rows.length === 1 ? 'row' : 'rows'}
          </span>
          {executionTimeMs !== undefined && (
            <span className="text-[11px] text-[#a39e98] tnum hidden sm:inline">
              ({executionTimeMs.toFixed(0)}ms)
            </span>
          )}
        </div>

        {/* Toolbar Actions */}
        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          <div className="inline-flex rounded-md bg-[#efeeec] p-0.5 text-xs text-[#615d59]">
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`p-1.5 rounded transition-all ${
                density === 'comfortable' ? 'bg-white text-[#0d0d0d] shadow-2xs' : 'hover:text-[#0d0d0d]'
              }`}
              title="Comfortable Density (44px)"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`p-1.5 rounded transition-all ${
                density === 'compact' ? 'bg-white text-[#0d0d0d] shadow-2xs' : 'hover:text-[#0d0d0d]'
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
              <tr key={headerGroup.id} className="bg-[#f6f5f4] border-b border-[#eeeeec]">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-xs font-semibold text-[#31302e] whitespace-nowrap select-none"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-[#eeeeec]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-12 text-center text-xs text-[#a39e98]">
                  No rows returned from this query
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#f8fafc] transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`${rowHeightClass} whitespace-nowrap text-[#0d0d0d]`}
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
        <div className="h-12 px-4 bg-[#f6f5f4] border-t border-[#eeeeec] flex items-center justify-between text-xs text-[#615d59]">
          <div className="tnum">
            Showing{' '}
            <span className="font-medium text-[#0d0d0d]">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-[#0d0d0d]">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                rows.length
              )}
            </span>{' '}
            of <span className="font-medium text-[#0d0d0d]">{rows.length}</span> rows
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[#0d0d0d]"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium text-[#0d0d0d] tnum">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-[#0d0d0d]"
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

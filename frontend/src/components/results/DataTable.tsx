/**
 * DataSpeak — Results Data Table (DataTable.tsx)
 * Calm Analytics Workspace (docs/ui-example/code1.html)
 * Airtable-style comfortable grid using TanStack Table v8.
 * Supports sorting, density switching, column visibility toggle,
 * type glyphs, formula-sanitized RFC 4180 CSV export, and pagination.
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Hash,
  Calendar,
  ToggleLeft,
  Sliders,
  Columns as ColumnsIcon,
  Download,
  Check,
  Percent,
  DollarSign,
} from 'lucide-react';
import { downloadCsv } from '../../utils/exportUtils';

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
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [copiedExport, setCopiedExport] = useState(false);

  const getColTypeGlyph = (colName: string, firstVal?: unknown) => {
    const name = colName.toLowerCase();
    if (name.includes('price') || name.includes('mrr') || name.includes('amount') || name.includes('revenue') || name.includes('cost')) {
      return <DollarSign className="h-3.5 w-3.5 text-[#a39e98]" />;
    }
    if (name.includes('rate') || name.includes('pct') || name.includes('percent') || name.includes('expansion') || name.includes('churn')) {
      return <Percent className="h-3.5 w-3.5 text-[#a39e98]" />;
    }
    if (
      name.includes('id') ||
      name.includes('count') ||
      name.includes('total') ||
      name.includes('subscribers') ||
      name.includes('num') ||
      typeof firstVal === 'number'
    ) {
      return <Hash className="h-3.5 w-3.5 text-[#a39e98]" />;
    }
    if (name.includes('date') || name.includes('time') || name.includes('month') || name.includes('year') || name.includes('at')) {
      return <Calendar className="h-3.5 w-3.5 text-[#a39e98]" />;
    }
    if (typeof firstVal === 'boolean') {
      return <ToggleLeft className="h-3.5 w-3.5 text-[#a39e98]" />;
    }
    return <span className="text-[11px] font-mono text-[#a39e98]">Aa</span>;
  };

  const isNumericCol = (colName: string, val: unknown) => {
    return (
      typeof val === 'number' ||
      colName.toLowerCase().includes('count') ||
      colName.toLowerCase().includes('mrr') ||
      colName.toLowerCase().includes('revenue') ||
      colName.toLowerCase().includes('price') ||
      colName.toLowerCase().includes('subscribers') ||
      colName.toLowerCase().includes('rate')
    );
  };

  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    return columns.map((colKey) => {
      const firstNonNull = rows.find((r) => r[colKey] !== null && r[colKey] !== undefined)?.[colKey];
      const numeric = isNumericCol(colKey, firstNonNull);

      return {
        accessorKey: colKey,
        header: ({ column }) => {
          const isSorted = column.getIsSorted();
          return (
            <div
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className={`flex items-center gap-1.5 cursor-pointer select-none group ${
                numeric ? 'justify-end' : 'justify-start'
              }`}
            >
              <span className="opacity-75">{getColTypeGlyph(colKey, firstNonNull)}</span>
              <span className="font-semibold text-[#31302e] text-[12px] uppercase tracking-[0.2px]">
                {colKey.replace(/_/g, ' ')}
              </span>
              <span className="text-[#a39e98] group-hover:text-[#0d0d0d]">
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
            return <span className="text-[#a39e98] italic">—</span>;
          }

          const lowerKey = colKey.toLowerCase();

          // Render Status / Tier / Plan as neat pill badge
          if (
            (lowerKey.includes('plan') || lowerKey.includes('tier') || lowerKey.includes('status')) &&
            typeof val === 'string'
          ) {
            const isEnterprise = val.toLowerCase().includes('enterprise');
            const isActive = val.toLowerCase() === 'active';
            const isPastDue = val.toLowerCase() === 'past_due';

            return (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium border ${
                  isActive
                    ? 'bg-[#d9eddf] text-[#17543b] border-[#2c8c66]/30'
                    : isPastDue
                    ? 'bg-[#fdf0d0] text-[#6e4600] border-[#f7a501]/30'
                    : isEnterprise
                    ? 'bg-[#efeeec] text-[#0d0d0d] border-[#e6e6e6]'
                    : 'bg-[#efeeec] text-[#31302e] border-[#e6e6e6]'
                }`}
              >
                {val}
              </span>
            );
          }

          // Percentage formatting
          if (
            (lowerKey.includes('rate') || lowerKey.includes('expansion') || lowerKey.includes('pct')) &&
            typeof val === 'number'
          ) {
            const isPositive = val >= 0;
            return (
              <span
                className={`tnum font-medium text-right block ${
                  lowerKey.includes('expansion') && isPositive
                    ? 'text-[#17543b]'
                    : 'text-[#31302e]'
                }`}
              >
                {isPositive && lowerKey.includes('expansion') ? '+' : ''}
                {val.toFixed(1)}%
              </span>
            );
          }

          // Currency formatting
          if (
            (lowerKey.includes('price') || lowerKey.includes('amount') || lowerKey.includes('revenue') || lowerKey.includes('mrr')) &&
            typeof val === 'number'
          ) {
            return (
              <span className="tnum font-medium text-[#0d0d0d] text-right block">
                ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            );
          }

          // General numbers
          if (typeof val === 'number') {
            return (
              <span className="tnum font-normal text-[#0d0d0d] text-right block">
                {val.toLocaleString()}
              </span>
            );
          }

          if (typeof val === 'boolean') {
            return (
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                  val ? 'bg-[#d9eddf] text-[#17543b]' : 'bg-[#efeeec] text-[#615d59]'
                }`}
              >
                {val ? 'TRUE' : 'FALSE'}
              </span>
            );
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
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleExportCsv = () => {
    if (rows.length === 0) return;
    downloadCsv(columns, rows, questionPrompt);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2000);
  };

  const rowHeightClass = density === 'comfortable' ? 'h-11 px-4 py-2' : 'h-8 px-3 py-1';

  return (
    <section className="bg-white rounded-lg border border-[#dddddd] overflow-hidden flex flex-col shadow-2xs my-6">
      {/* Table Toolbar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#e6e6e6]">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-[#0d0d0d]">Results</span>
          <span className="text-[13px] text-[#615d59]">· {rows.length} rows</span>
          {executionTimeMs !== undefined && (
            <span className="text-[11px] text-[#a39e98] font-mono hidden sm:inline">
              ({executionTimeMs.toFixed(0)}ms)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setDensity(density === 'comfortable' ? 'compact' : 'comfortable')}
            className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-[#31302e] hover:text-[#0d0d0d] px-2.5 py-1.5 rounded hover:bg-[#efeeec] transition-colors cursor-pointer"
            title="Toggle compact or comfortable density"
          >
            <Sliders className="h-4 w-4 text-[#615d59]" />
            <span>Density</span>
          </button>

          {/* Columns Toggle Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="hidden sm:inline-flex items-center gap-1.5 text-[13px] text-[#31302e] hover:text-[#0d0d0d] px-2.5 py-1.5 rounded hover:bg-[#efeeec] transition-colors cursor-pointer"
              title="Toggle columns"
            >
              <ColumnsIcon className="h-4 w-4 text-[#615d59]" />
              <span>Columns</span>
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#dddddd] rounded-md shadow-lg p-2 z-30 text-xs">
                <span className="font-semibold text-[#615d59] block px-2 py-1 uppercase text-[10px] tracking-wider">
                  Visible Columns
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {columns.map((col) => (
                    <label key={col} className="flex items-center gap-2 px-2 py-1 hover:bg-[#f6f5f4] rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={columnVisibility[col] !== false}
                        onChange={(e) =>
                          setColumnVisibility((prev) => ({ ...prev, [col]: e.target.checked }))
                        }
                        className="rounded border-[#dddddd] text-[#0075de] focus:ring-[#0075de]"
                      />
                      <span className="font-mono truncate">{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-[#f8fafc] text-[#0d0d0d] text-[13px] font-medium h-9 px-3.5 rounded-md border border-[#dddddd] transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
            title="Export sanitized CSV (RFC 4180)"
          >
            {copiedExport ? (
              <Check className="h-4 w-4 text-[#2c8c66]" />
            ) : (
              <Download className="h-4 w-4 text-[#615d59]" />
            )}
            <span>{copiedExport ? 'Downloaded' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="h-10 bg-[#f6f5f4] border-b border-[#dddddd] text-[12px] font-semibold text-[#31302e] uppercase tracking-[0.2px] select-none"
              >
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 text-left font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="text-[14px] text-[#0d0d0d] divide-y divide-[#eeeeec] font-normal">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="py-12 text-center text-sm text-[#615d59]">
                  No rows returned from this query
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-[#f8fafc] transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`${rowHeightClass} whitespace-nowrap`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Pagination */}
      {rows.length > 0 && (
        <div className="h-12 bg-[#f6f5f4] px-4 flex items-center justify-between text-[13px] text-[#615d59] border-t border-[#e6e6e6]">
          <span>
            Showing{' '}
            <strong className="text-[#0d0d0d] font-semibold">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
            </strong>
            –
            <strong className="text-[#0d0d0d] font-semibold">
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                rows.length
              )}
            </strong>{' '}
            of {rows.length} rows
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-2.5 py-1 text-[13px] text-[#31302e] hover:text-[#0d0d0d] disabled:text-[#a39e98] disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-2 py-0.5 rounded bg-white border border-[#e6e6e6] text-[#0d0d0d] font-semibold tnum text-[12px] shadow-2xs">
              {table.getState().pagination.pageIndex + 1}
            </span>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-2.5 py-1 text-[13px] text-[#31302e] hover:text-[#0d0d0d] disabled:text-[#a39e98] disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

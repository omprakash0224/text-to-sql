/**
 * DataSpeak — PostHog Schema Explorer (SchemaExplorer.tsx)
 * Displays searchable tables, column types, and PK/FK relationships on cream canvas.
 */

import React, { useState } from 'react';
import {
  Table2,
  Search,
  ChevronRight,
  ChevronDown,
  Key,
  Link as LinkIcon,
  RefreshCw,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Sparkles,
} from 'lucide-react';
import type { DatabaseSchema, TableSchema, ColumnDefinition } from '../../types';

interface SchemaExplorerProps {
  schema: DatabaseSchema | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectTableQuestion: (question: string) => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schema,
  isRefreshing,
  onRefresh,
  onSelectTableQuestion,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableName]: !prev[tableName],
    }));
  };

  const getColumnIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) {
      return <Hash className="h-3 w-3 text-[#1d4ed8]" />;
    }
    if (t.includes('date') || t.includes('time') || t.includes('timestamp')) {
      return <Calendar className="h-3 w-3 text-[#1078a3]" />;
    }
    if (t.includes('bool')) {
      return <ToggleLeft className="h-3 w-3 text-[#7c44a6]" />;
    }
    return <Type className="h-3 w-3 text-[#4d4f46]" />;
  };

  const filteredTables = (schema?.tables || []).filter((table) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    if (table.name.toLowerCase().includes(query)) return true;
    return table.columns.some((col) => col.name.toLowerCase().includes(query));
  });

  if (!schema) {
    return (
      <div className="p-4 text-center text-xs text-[#6c6e63]">
        <Table2 className="h-7 w-7 mx-auto text-[#9b9c92] mb-2 stroke-1" />
        <p className="font-bold text-[#23251d] mb-1">No database connected</p>
        <p>Connect a database to inspect its tables and schema.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Search & Refresh Bar */}
      <div className="p-3 border-b border-[#bfc1b7] flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#6c6e63]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schema..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#bfc1b7] rounded-md text-xs text-[#23251d] placeholder-[#9b9c92] focus:outline-none focus:border-[#23251d]"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh schema reflection"
          className="p-1.5 rounded-md hover:bg-[#e5e7e0] text-[#4d4f46] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#f7a501]' : ''}`} />
        </button>
      </div>

      {/* Tables Accordion List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-[#6c6e63] uppercase tracking-wider">
          <span>Tables ({filteredTables.length})</span>
          <span className="font-mono text-[10px] text-[#9b9c92]">{schema.dialect}</span>
        </div>

        {filteredTables.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#9b9c92]">No matching tables or columns</div>
        ) : (
          filteredTables.map((table: TableSchema) => {
            const isExpanded = expandedTables[table.name] ?? false;
            return (
              <div key={table.name} className="rounded-md border border-transparent hover:border-[#bfc1b7] overflow-hidden">
                {/* Table Row Header */}
                <div
                  onClick={() => toggleTable(table.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors select-none ${
                    isExpanded ? 'bg-white font-bold text-[#23251d] border border-[#bfc1b7]' : 'hover:bg-[#e5e7e0] text-[#33342d]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#23251d] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#9b9c92] shrink-0" />
                    )}
                    <Table2 className="h-3.5 w-3.5 text-[#1078a3] shrink-0" />
                    <span className="truncate font-mono">{table.name}</span>
                  </div>

                  <span className="text-[10px] text-[#6c6e63] tnum shrink-0 ml-1">
                    {table.row_count_estimate !== undefined ? `${table.row_count_estimate} rows` : `${table.columns.length} cols`}
                  </span>
                </div>

                {/* Expanded Columns List */}
                {isExpanded && (
                  <div className="bg-[#fcfcfa] border-t border-[#dcdfd2] p-2 pl-4 space-y-1">
                    {/* Quick Query Starter Button */}
                    <button
                      type="button"
                      onClick={() => onSelectTableQuestion(`Show sample rows and summary of ${table.name}`)}
                      className="w-full mb-1.5 flex items-center gap-1.5 px-2 py-1 rounded bg-[#dceaf6] hover:bg-[#b2d5f4] text-[#1d4ed8] text-[11px] font-semibold transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Ask about {table.name}</span>
                    </button>

                    {table.columns.map((col: ColumnDefinition) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-[#eeefe9] text-[11px] text-[#33342d]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {getColumnIcon(col.type)}
                          <span className="truncate font-mono">{col.name}</span>
                          {col.primaryKey && (
                            <span title="Primary Key">
                              <Key className="h-2.5 w-2.5 text-[#f7a501] shrink-0" />
                            </span>
                          )}
                          {col.foreignKey && (
                            <span title={`Foreign Key: ${col.foreignKey}`}>
                              <LinkIcon className="h-2.5 w-2.5 text-[#1d4ed8] shrink-0" />
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#6c6e63] font-mono shrink-0 ml-2">
                          {col.type.toLowerCase().split('(')[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

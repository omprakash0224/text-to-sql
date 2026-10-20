/**
 * DataSpeak — Schema Explorer Sidebar Component (SchemaExplorer.tsx)
 * Displays searchable tables, column data types, PK/FK relationships, and sample row hints.
 * Follows framed-sheet rules: sentence case, no purple, zero shadows at rest.
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

  // Helper for column type icon
  const getColumnIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('int') || t.includes('num') || t.includes('dec') || t.includes('float') || t.includes('double')) {
      return <Hash className="h-3 w-3 text-[#1b6c80]" />;
    }
    if (t.includes('date') || t.includes('time') || t.includes('timestamp')) {
      return <Calendar className="h-3 w-3 text-[#2f70bb]" />;
    }
    if (t.includes('bool')) {
      return <ToggleLeft className="h-3 w-3 text-[#a86f0c]" />;
    }
    return <Type className="h-3 w-3 text-[#5d5f60]" />;
  };

  // Filter tables by search query
  const filteredTables = (schema?.tables || []).filter((table) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    if (table.name.toLowerCase().includes(query)) return true;
    return table.columns.some((col) => col.name.toLowerCase().includes(query));
  });

  if (!schema) {
    return (
      <div className="p-4 text-center text-xs text-[#5d5f60]">
        <Table2 className="h-7 w-7 mx-auto text-[#5d5f60] mb-2 stroke-1" />
        <p className="font-medium text-[#131416] mb-1">No database connected</p>
        <p>Connect a database to inspect its tables and schema.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Search & Refresh Bar */}
      <div className="p-2.5 border-b border-[#e2e4e8] flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#5d5f60]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schema..."
            className="w-full pl-8 pr-2 py-1 bg-white border border-[#e2e4e8] rounded text-xs text-[#131416] placeholder-[#5d5f60] focus:outline-none focus:border-[#1b6c80]"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh schema reflection"
          className="p-1 rounded hover:bg-[#ebedee] text-[#5d5f60] hover:text-[#131416] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#1b6c80]' : ''}`} />
        </button>
      </div>

      {/* Tables Accordion List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-medium text-[#5d5f60]">
          <span>Tables ({filteredTables.length})</span>
          <span className="text-[10px] text-[#5d5f60] uppercase">{schema.dialect}</span>
        </div>

        {filteredTables.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#5d5f60]">No matching tables or columns</div>
        ) : (
          filteredTables.map((table: TableSchema) => {
            const isExpanded = expandedTables[table.name] ?? false;
            return (
              <div key={table.name} className="rounded-md border border-transparent overflow-hidden">
                {/* Table Row Header */}
                <div
                  onClick={() => toggleTable(table.name)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors select-none ${
                    isExpanded ? 'bg-white font-medium text-[#131416] border border-[#e2e4e8]' : 'hover:bg-[#ebedee] text-[#131416]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#5d5f60] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#5d5f60] shrink-0" />
                    )}
                    <span className="truncate">{table.name}</span>
                  </div>

                  {table.rowCount !== undefined && (
                    <span className="text-[10px] text-[#5d5f60] tnum shrink-0">
                      {table.rowCount.toLocaleString()} rows
                    </span>
                  )}
                </div>

                {/* Expanded Column Tree */}
                {isExpanded && (
                  <div className="pl-4 pr-1 py-1.5 space-y-1 border-l-2 border-[#e2e4e8] ml-2 my-1">
                    {/* Action: Ask Question About This Table */}
                    <button
                      type="button"
                      onClick={() =>
                        onSelectTableQuestion(`Show me all records and details from ${table.name}`)
                      }
                      className="w-full flex items-center gap-1.5 px-2 py-1 rounded bg-[#f7f8fa] hover:bg-white text-[11px] text-[#1b6c80] border border-[#e2e4e8] transition-colors mb-1.5"
                    >
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span className="truncate">Ask about {table.name}</span>
                    </button>

                    {/* Columns List */}
                    <div className="space-y-0.5">
                      {table.columns.map((col: ColumnDefinition) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#ebedee] text-[11px] text-[#131416] transition-colors group"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {col.primaryKey ? (
                              <span title="Primary Key">
                                <Key className="h-3 w-3 text-[#a86f0c] shrink-0" />
                              </span>
                            ) : col.foreignKey ? (
                              <span title="Foreign Key">
                                <LinkIcon className="h-3 w-3 text-[#2f70bb] shrink-0" />
                              </span>
                            ) : (
                              getColumnIcon(col.type)
                            )}
                            <span className="truncate">{col.name}</span>
                          </div>

                          <span className="text-[10px] text-[#5d5f60] shrink-0 opacity-80">
                            {col.type.toLowerCase()}
                          </span>
                        </div>
                      ))}
                    </div>
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

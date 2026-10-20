/**
 * DataSpeak — Schema Explorer Sidebar Component (SchemaExplorer.tsx)
 * Displays searchable tables, column data types, PK/FK relationships, and sample row hints.
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
      return <Hash className="h-3 w-3 text-[#0075de]" />;
    }
    if (t.includes('date') || t.includes('time') || t.includes('timestamp')) {
      return <Calendar className="h-3 w-3 text-[#2a9d99]" />;
    }
    if (t.includes('bool')) {
      return <ToggleLeft className="h-3 w-3 text-[#7c44a6]" />;
    }
    return <Type className="h-3 w-3 text-[#615d59]" />;
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
      <div className="p-4 text-center text-xs text-[#615d59]">
        <Table2 className="h-8 w-8 mx-auto text-[#a39e98] mb-2 stroke-1" />
        <p className="font-medium text-[#0d0d0d] mb-1">No database connected</p>
        <p>Connect a database to inspect its tables and schema.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-xs">
      {/* Search & Refresh Bar */}
      <div className="p-3 border-b border-[#eeeeec] flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#a39e98]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schema..."
            className="w-full pl-8 pr-2.5 py-1.5 bg-[#efeeec] border-none rounded-md text-xs text-[#0d0d0d] placeholder-[#a39e98] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0075de]"
          />
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh schema reflection"
          className="p-1.5 rounded-md hover:bg-[#efeeec] text-[#615d59] hover:text-[#0d0d0d] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#0075de]' : ''}`} />
        </button>
      </div>

      {/* Tables Accordion List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-[#615d59] uppercase tracking-wider">
          <span>Tables ({filteredTables.length})</span>
          <span className="font-mono text-[10px] text-[#a39e98]">{schema.dialect}</span>
        </div>

        {filteredTables.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#a39e98]">No matching tables or columns</div>
        ) : (
          filteredTables.map((table: TableSchema) => {
            const isExpanded = expandedTables[table.name] ?? false;
            return (
              <div key={table.name} className="rounded-lg border border-transparent hover:border-[#eeeeec] overflow-hidden">
                {/* Table Row Header */}
                <div
                  onClick={() => toggleTable(table.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md cursor-pointer transition-colors select-none ${
                    isExpanded ? 'bg-white font-medium text-[#0d0d0d] shadow-2xs' : 'hover:bg-[#efeeec]/60 text-[#31302e]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-[#615d59] shrink-0" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-[#a39e98] shrink-0" />
                    )}
                    <Table2 className="h-3.5 w-3.5 text-[#0075de] shrink-0" />
                    <span className="truncate font-mono">{table.name}</span>
                  </div>

                  <span className="text-[10px] text-[#a39e98] tnum shrink-0 ml-1">
                    {table.row_count_estimate !== undefined ? `${table.row_count_estimate} rows` : `${table.columns.length} cols`}
                  </span>
                </div>

                {/* Expanded Columns List */}
                {isExpanded && (
                  <div className="bg-[#f6f5f4]/50 border-t border-[#eeeeec] p-2 pl-6 space-y-1">
                    {/* Quick Query Starter Button */}
                    <button
                      type="button"
                      onClick={() => onSelectTableQuestion(`Show sample rows and summary of ${table.name}`)}
                      className="w-full mb-1.5 flex items-center gap-1.5 px-2 py-1 rounded bg-[#eaf3fc] hover:bg-[#c9e0f6] text-[#0075de] text-[11px] font-medium transition-colors"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>Ask about {table.name}</span>
                    </button>

                    {table.columns.map((col: ColumnDefinition) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-white text-[11px] text-[#31302e]"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {getColumnIcon(col.type)}
                          {col.primaryKey && (
                            <span title="Primary Key">
                              <Key className="h-2.5 w-2.5 text-[#f7a501] shrink-0" />
                            </span>
                          )}
                          {col.foreignKey && (
                            <span title={`Foreign Key: ${col.foreignKey}`}>
                              <LinkIcon className="h-2.5 w-2.5 text-[#0075de] shrink-0" />
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] text-[#a39e98] font-mono shrink-0 ml-2">
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

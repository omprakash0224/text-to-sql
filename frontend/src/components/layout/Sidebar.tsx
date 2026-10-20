/**
 * DataSpeak — Application Sidebar Component (Sidebar.tsx)
 * Framed-sheet archetype: 240px width on tinted frame (#f4f5f6).
 * Houses New Question action, Schema Explorer, Query History, and Connection status tile.
 */

import React, { useState } from 'react';
import {
  Plus,
  Table2,
  History,
  Database,
  ShieldCheck,
  Power,
} from 'lucide-react';
import { SchemaExplorer } from '../schema/SchemaExplorer';
import { QueryHistory } from '../chat/QueryHistory';
import type {
  DatabaseConnection,
  DatabaseSchema,
  QueryHistoryItem,
} from '../../types';

interface SidebarProps {
  activeConnection: DatabaseConnection | null;
  schema: DatabaseSchema | null;
  isRefreshingSchema: boolean;
  onRefreshSchema: () => void;
  onNewQuestion: () => void;
  onSelectTableQuestion: (q: string) => void;
  history: QueryHistoryItem[];
  onSelectHistoryItem: (item: QueryHistoryItem) => void;
  onToggleSaveHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  currentQuestion?: string;
  onDisconnectDatabase: () => void;
  onOpenConnectModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeConnection,
  schema,
  isRefreshingSchema,
  onRefreshSchema,
  onNewQuestion,
  onSelectTableQuestion,
  history,
  onSelectHistoryItem,
  onToggleSaveHistory,
  onDeleteHistory,
  currentQuestion,
  onDisconnectDatabase,
  onOpenConnectModal,
}) => {
  const [activeTab, setActiveTab] = useState<'schema' | 'history'>('schema');

  return (
    <aside className="w-60 bg-[#f4f5f6] border-r border-[#e2e4e8] flex flex-col h-[calc(100vh-3rem)] shrink-0 select-none">
      {/* Top Action: New Question Button */}
      <div className="p-2.5 border-b border-[#e2e4e8]">
        <button
          type="button"
          onClick={onNewQuestion}
          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-[#e2e4e8] hover:border-[#1b6c80] text-[#131416] hover:bg-[#f7f8fa] active:bg-[#ebedee] transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-[#1b6c80]" />
          <span>New Question</span>
        </button>
      </div>

      {/* Segmented Tab Switcher (Schema vs History) */}
      <div className="px-2.5 pt-2.5">
        <div className="grid grid-cols-2 p-0.5 rounded-md bg-[#ebedee] text-xs font-medium text-[#5d5f60]">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center justify-center gap-1.5 py-1 rounded transition-colors ${
              activeTab === 'schema'
                ? 'bg-white text-[#131416] font-medium border border-[#e2e4e8]'
                : 'hover:text-[#131416]'
            }`}
          >
            <Table2 className="h-3.5 w-3.5 text-[#1b6c80]" />
            <span>Schema</span>
            {schema?.tables && (
              <span className="text-[10px] text-[#5d5f60] tnum">({schema.tables.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-1 rounded transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-[#131416] font-medium border border-[#e2e4e8]'
                : 'hover:text-[#131416]'
            }`}
          >
            <History className="h-3.5 w-3.5 text-[#a86f0c]" />
            <span>History</span>
            {history.length > 0 && (
              <span className="text-[10px] text-[#5d5f60] tnum">({history.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab View Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'schema' ? (
          <SchemaExplorer
            schema={schema}
            isRefreshing={isRefreshingSchema}
            onRefresh={onRefreshSchema}
            onSelectTableQuestion={onSelectTableQuestion}
          />
        ) : (
          <QueryHistory
            history={history}
            onSelectQuery={onSelectHistoryItem}
            onToggleSave={onToggleSaveHistory}
            onDelete={onDeleteHistory}
            currentQuestion={currentQuestion}
          />
        )}
      </div>

      {/* Bottom Connection Status Tile */}
      <div className="p-2.5 bg-[#f4f5f6] border-t border-[#e2e4e8] shrink-0">
        {activeConnection ? (
          <div className="p-2.5 rounded-lg bg-white border border-[#e2e4e8] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Database className="h-3.5 w-3.5 text-[#1b6c80] shrink-0" />
                <span className="text-xs font-medium text-[#131416] truncate">
                  {activeConnection.name}
                </span>
              </div>
              <button
                type="button"
                onClick={onDisconnectDatabase}
                title="Disconnect database"
                className="text-[#5d5f60] hover:text-[#c4242a] p-1 rounded hover:bg-[#ebedee] transition-colors"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#5d5f60]">
              <span className="uppercase">{activeConnection.dialect}</span>
              <span className="inline-flex items-center gap-1 text-[#04250e] font-medium">
                <ShieldCheck className="h-3 w-3 text-[#1e7b4f]" /> Read-only
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="w-full py-1.5 text-xs font-medium rounded-md bg-white hover:bg-[#f7f8fa] border border-[#e2e4e8] text-[#131416] transition-colors flex items-center justify-center gap-1.5"
          >
            <Database className="h-3.5 w-3.5 text-[#1b6c80]" />
            <span>Connect Database</span>
          </button>
        )}
      </div>
    </aside>
  );
};

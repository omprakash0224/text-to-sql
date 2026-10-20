/**
 * DataSpeak — Application Sidebar Component (Sidebar.tsx)
 * 264px width on warm paper canvas. Houses New Question action, Schema Explorer,
 * Query History, and Connection Status footer.
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
    <aside className="w-64 sm:w-68 bg-[#f6f5f4] border-r border-[#e6e6e6] flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none">
      {/* Top Action: New Question Button */}
      <div className="p-3 border-b border-[#eeeeec]">
        <button
          type="button"
          onClick={onNewQuestion}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-[#dddddd] hover:border-[#0075de]/50 text-[#0d0d0d] hover:bg-[#f8fafc] active:bg-[#efeeec] transition-all shadow-2xs"
        >
          <Plus className="h-4 w-4 text-[#0075de]" />
          <span>New Question</span>
        </button>
      </div>

      {/* Segmented Tab Switcher (Schema vs History) */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-2 p-1 rounded-lg bg-[#efeeec] text-xs font-medium text-[#615d59]">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
              activeTab === 'schema'
                ? 'bg-white text-[#0d0d0d] shadow-2xs font-semibold'
                : 'hover:text-[#0d0d0d]'
            }`}
          >
            <Table2 className="h-3.5 w-3.5 text-[#0075de]" />
            <span>Schema</span>
            {schema?.tables && (
              <span className="text-[10px] text-[#a39e98] tnum">({schema.tables.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
              activeTab === 'history'
                ? 'bg-white text-[#0d0d0d] shadow-2xs font-semibold'
                : 'hover:text-[#0d0d0d]'
            }`}
          >
            <History className="h-3.5 w-3.5 text-[#f7a501]" />
            <span>History</span>
            {history.length > 0 && (
              <span className="text-[10px] text-[#a39e98] tnum">({history.length})</span>
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
      <div className="p-3 bg-[#f6f5f4] border-t border-[#eeeeec] shrink-0">
        {activeConnection ? (
          <div className="p-2.5 rounded-lg bg-white border border-[#dddddd] shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Database className="h-3.5 w-3.5 text-[#0075de] shrink-0" />
                <span className="text-xs font-semibold text-[#0d0d0d] truncate">
                  {activeConnection.name}
                </span>
              </div>
              <button
                type="button"
                onClick={onDisconnectDatabase}
                title="Disconnect database"
                className="text-[#a39e98] hover:text-[#cd4239] p-1 rounded hover:bg-[#efeeec] transition-colors"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#615d59]">
              <span className="font-mono uppercase">{activeConnection.dialect}</span>
              <span className="inline-flex items-center gap-1 text-[#17543b] font-medium">
                <ShieldCheck className="h-3 w-3 text-[#2c8c66]" /> Read-only
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="w-full py-2 text-xs font-semibold rounded-lg bg-[#eaf3fc] hover:bg-[#c9e0f6] text-[#0075de] transition-colors flex items-center justify-center gap-1.5"
          >
            <Database className="h-3.5 w-3.5" />
            <span>Connect Database</span>
          </button>
        )}
      </div>
    </aside>
  );
};

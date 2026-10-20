/**
 * DataSpeak — PostHog Sidebar Component (Sidebar.tsx)
 * 260px width on warm cream canvas (#eeefe9) with 1px hairline border (#bfc1b7).
 * Features PostHog yellow primary CTA pill, schema & history tabs, and hedgehog marginalia.
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
import { HedgehogMascot } from '../common/HedgehogMascot';
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
    <aside className="w-64 sm:w-68 bg-[#eeefe9] border-r border-[#bfc1b7] flex flex-col h-[calc(100vh-3.5rem)] shrink-0 select-none">
      {/* Top Action: Iconic PostHog Yellow CTA Button */}
      <div className="p-3 border-b border-[#bfc1b7]">
        <button
          type="button"
          onClick={onNewQuestion}
          className="w-full posthog-button-primary font-bold shadow-2xs"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>New Question</span>
        </button>
      </div>

      {/* Segmented Tab Switcher (Schema vs History) */}
      <div className="px-3 pt-3">
        <div className="grid grid-cols-2 p-1 rounded-md bg-[#e5e7e0] border border-[#bfc1b7] text-xs font-semibold text-[#4d4f46]">
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors ${
              activeTab === 'schema'
                ? 'bg-white text-[#23251d] font-bold border border-[#bfc1b7]'
                : 'hover:text-[#23251d]'
            }`}
          >
            <Table2 className="h-3.5 w-3.5 text-[#1078a3]" />
            <span>Schema</span>
            {schema?.tables && (
              <span className="text-[10px] text-[#6c6e63] tnum font-mono">({schema.tables.length})</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-[#23251d] font-bold border border-[#bfc1b7]'
                : 'hover:text-[#23251d]'
            }`}
          >
            <History className="h-3.5 w-3.5 text-[#f7a501]" />
            <span>History</span>
            {history.length > 0 && (
              <span className="text-[10px] text-[#6c6e63] tnum font-mono">({history.length})</span>
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

      {/* Mascot Marginalia (PostHog Signature Feature) */}
      <div className="px-3 py-2 bg-[#fcfcfa] border-t border-[#dcdfd2] flex items-center gap-2 text-[11px] text-[#4d4f46]">
        <HedgehogMascot pose="detective" size={28} className="shrink-0" />
        <div className="leading-tight">
          <span className="font-bold text-[#23251d] block">Need SQL hints?</span>
          <span className="text-[#6c6e63]">Ask in plain English — AST ensures zero mutations!</span>
        </div>
      </div>

      {/* Bottom Connection Status Tile */}
      <div className="p-3 bg-[#eeefe9] border-t border-[#bfc1b7] shrink-0">
        {activeConnection ? (
          <div className="p-2.5 rounded-md bg-white border border-[#bfc1b7] space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <Database className="h-3.5 w-3.5 text-[#1078a3] shrink-0" />
                <span className="text-xs font-bold text-[#23251d] truncate">
                  {activeConnection.name}
                </span>
              </div>
              <button
                type="button"
                onClick={onDisconnectDatabase}
                title="Disconnect database"
                className="text-[#6c6e63] hover:text-[#cd4239] p-1 rounded hover:bg-[#eeefe9] transition-colors"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#6c6e63]">
              <span className="font-mono uppercase font-semibold text-[10px]">{activeConnection.dialect}</span>
              <span className="inline-flex items-center gap-1 text-[#17543b] font-bold">
                <ShieldCheck className="h-3 w-3 text-[#2c8c66]" /> Read-only active
              </span>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenConnectModal}
            className="w-full posthog-button-secondary text-xs font-bold"
          >
            <Database className="h-3.5 w-3.5 text-[#1078a3]" />
            <span>Connect Database</span>
          </button>
        )}
      </div>
    </aside>
  );
};

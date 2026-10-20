/**
 * DataSpeak — Left Sidebar Component (Sidebar.tsx)
 * Calm Analytics Workspace (docs/ui-example/code.html & code1.html)
 * 264px fixed width, canvas #f6f5f4 with 1px hairline border #e6e6e6.
 * Features brand header, "+ New question" button, workspace navigation,
 * starred saved questions, and active database status card.
 */

import React from 'react';
import {
  Terminal,
  Plus,
  MessageSquare,
  Network,
  History,
  Settings,
  Star,
  ShieldCheck,
} from 'lucide-react';
import type { DatabaseConnection, QueryHistoryItem } from '../../types';

export type WorkspaceView = 'query' | 'schema' | 'history' | 'settings';

interface SidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  onNewQuestion: () => void;
  activeConnection: DatabaseConnection | null;
  savedQuestions?: { id: string; title: string; prompt: string; isStarred?: boolean }[];
  onSelectSavedQuestion: (prompt: string) => void;
  onOpenConnectModal: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  history?: QueryHistoryItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onNewQuestion,
  activeConnection,
  savedQuestions,
  onSelectSavedQuestion,
  onOpenConnectModal,
  isOpenMobile = false,
  onCloseMobile,
  history,
}) => {
  const effectiveSavedList = React.useMemo(() => {
    if (savedQuestions && savedQuestions.length > 0) {
      return savedQuestions;
    }
    return (history || [])
      .filter((h) => h.isSaved)
      .map((h) => ({
        id: h.id,
        title: h.question,
        prompt: h.question,
        isStarred: true,
      }));
  }, [savedQuestions, history]);

  const dbName = activeConnection ? activeConnection.name : 'No active database';
  const dialectText = activeConnection
    ? `${activeConnection.dialect === 'postgresql' ? 'PostgreSQL' : activeConnection.dialect.toUpperCase()} · AST Guarded`
    : 'Click to connect';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[264px] bg-[#f6f5f4] border-r border-[#e6e6e6] z-50 flex flex-col justify-between p-4 select-none transition-transform duration-200 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4">
          {/* App Brand */}
          <div className="h-10 flex items-center gap-2.5 px-2">
            <div className="w-7 h-7 rounded-md bg-[#0075de] flex items-center justify-center text-white shadow-2xs shrink-0">
              <Terminal className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[16px] tracking-[-0.4px] text-[#0d0d0d] leading-tight">
                DataSpeak
              </span>
              <span className="text-[11px] text-[#615d59] tracking-tight">
                AI SQL Workspace
              </span>
            </div>
          </div>

          {/* New Question Button */}
          <button
            type="button"
            onClick={() => {
              onNewQuestion();
              onSelectView('query');
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#f8fafc] text-[#0d0d0d] text-[14px] font-medium h-9 px-3.5 rounded-md border border-[#dddddd] transition-colors shadow-2xs active:scale-[0.99] cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#0075de] stroke-[2.5]" />
            <span>New question</span>
          </button>

          {/* Navigation Links */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="px-2 pb-1 text-[11px] font-semibold text-[#a39e98] tracking-wider uppercase">
              Workspace
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectView('query');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[14px] transition-all cursor-pointer ${
                activeView === 'query'
                  ? 'bg-white text-[#0d0d0d] font-semibold border border-[#e6e6e6] shadow-2xs'
                  : 'text-[#31302e] hover:bg-[#efeeec] hover:text-[#0d0d0d] font-normal'
              }`}
            >
              <MessageSquare
                className={`h-4.5 w-4.5 ${
                  activeView === 'query' ? 'text-[#0075de]' : 'text-[#615d59]'
                }`}
              />
              <span>Query &amp; Explore</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('schema');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[14px] transition-all cursor-pointer ${
                activeView === 'schema'
                  ? 'bg-white text-[#0d0d0d] font-semibold border border-[#e6e6e6] shadow-2xs'
                  : 'text-[#31302e] hover:bg-[#efeeec] hover:text-[#0d0d0d] font-normal'
              }`}
            >
              <Network
                className={`h-4.5 w-4.5 ${
                  activeView === 'schema' ? 'text-[#0075de]' : 'text-[#615d59]'
                }`}
              />
              <span>Schema Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('history');
                onCloseMobile?.();
              }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[14px] transition-all cursor-pointer ${
                activeView === 'history'
                  ? 'bg-white text-[#0d0d0d] font-semibold border border-[#e6e6e6] shadow-2xs'
                  : 'text-[#31302e] hover:bg-[#efeeec] hover:text-[#0d0d0d] font-normal'
              }`}
            >
              <History
                className={`h-4.5 w-4.5 ${
                  activeView === 'history' ? 'text-[#0075de]' : 'text-[#615d59]'
                }`}
              />
              <span>Query History</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenConnectModal();
                onCloseMobile?.();
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[#31302e] hover:bg-[#efeeec] hover:text-[#0d0d0d] text-[14px] font-normal transition-colors cursor-pointer"
            >
              <Settings className="h-4.5 w-4.5 text-[#615d59]" />
              <span>Settings &amp; Connections</span>
            </button>
          </div>

          {/* Saved Questions Section */}
          <div className="flex flex-col gap-1 pt-2">
            <div className="px-2 pb-1 text-[11px] font-semibold text-[#a39e98] tracking-wider uppercase">
              Saved Questions
            </div>

            {effectiveSavedList.length === 0 ? (
              <div className="px-2.5 py-1.5 text-[12px] text-[#a39e98] italic">
                Star queries with ★ to save them here
              </div>
            ) : (
              effectiveSavedList.map((q, idx) => (
                <button
                  key={q.id || idx}
                  type="button"
                  onClick={() => {
                    onSelectSavedQuestion(q.prompt);
                    onSelectView('query');
                    onCloseMobile?.();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#615d59] hover:text-[#0d0d0d] hover:bg-[#efeeec] text-[13px] transition-colors truncate text-left cursor-pointer"
                  title={q.prompt}
                >
                  <Star
                    className={`h-3.5 w-3.5 shrink-0 ${
                      q.isStarred
                        ? 'fill-[#f7a501] text-[#f7a501]'
                        : 'text-[#a39e98]'
                    }`}
                  />
                  <span className="truncate">{q.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Bottom Database Indicator & Read-only Status */}
        <div
          onClick={onOpenConnectModal}
          className="p-3 bg-white rounded-lg border border-[#e6e6e6] flex flex-col gap-2 cursor-pointer hover:border-[#dddddd] transition-all shadow-2xs group"
          title={activeConnection ? 'Connected: Click to manage connection' : 'No database connected: Click to connect'}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wider text-[#a39e98] uppercase">
              Active Database
            </span>
            {activeConnection ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#d9eddf] text-[#17543b] border border-[#2c8c66]/40 text-[11px] font-semibold">
                <ShieldCheck className="h-3 w-3 text-[#2c8c66]" />
                <span>Read-only</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#efeeec] text-[#615d59] border border-[#e6e6e6] text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a39e98]" />
                <span>Disconnected</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                activeConnection ? 'bg-[#2c8c66]' : 'bg-[#a39e98]'
              }`}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-medium text-[#0d0d0d] truncate tnum group-hover:text-[#0075de] transition-colors">
                {dbName}
              </span>
              <span className="text-[11px] text-[#615d59] truncate">
                {dialectText}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

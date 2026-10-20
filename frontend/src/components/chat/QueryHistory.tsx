/**
 * DataSpeak — Query History & Saved Questions (QueryHistory.tsx)
 * Displays recent questions and bookmarked/saved questions with one-click re-run.
 */

import React from 'react';
import { History, Star, Trash2, ArrowUpRight } from 'lucide-react';
import type { QueryHistoryItem } from '../../types';

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (item: QueryHistoryItem) => void;
  onToggleSave: (id: string) => void;
  onDelete: (id: string) => void;
  currentQuestion?: string;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  onSelectQuery,
  onToggleSave,
  onDelete,
  currentQuestion,
}) => {
  if (history.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-[#a39e98]">
        <History className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
        <p>No queries asked yet</p>
      </div>
    );
  }

  const savedItems = history.filter((h) => h.isSaved);
  const recentItems = history.filter((h) => !h.isSaved);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 text-xs space-y-4">
      {/* Saved / Starred Questions */}
      {savedItems.length > 0 && (
        <div className="space-y-1">
          <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#6e4600] uppercase tracking-wider">
            <Star className="h-3 w-3 fill-[#f7a501] text-[#f7a501]" />
            <span>Saved Questions ({savedItems.length})</span>
          </div>

          {savedItems.map((item) => (
            <div
              key={item.id}
              className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                currentQuestion === item.question
                  ? 'bg-white border-[#dddddd] shadow-2xs font-medium text-[#0d0d0d]'
                  : 'border-transparent hover:bg-white text-[#31302e]'
              }`}
            >
              <div
                onClick={() => onSelectQuery(item)}
                className="flex-1 truncate pr-2"
                title={item.question}
              >
                <span className="truncate block">{item.question}</span>
                <span className="text-[10px] text-[#a39e98] block">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onToggleSave(item.id)}
                  className="p-1 rounded text-[#f7a501] hover:bg-[#efeeec] transition-colors"
                  title="Unsave query"
                >
                  <Star className="h-3.5 w-3.5 fill-[#f7a501]" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="p-1 rounded text-[#a39e98] hover:text-[#cd4239] opacity-0 group-hover:opacity-100 hover:bg-[#efeeec] transition-all"
                  title="Delete from history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Queries */}
      <div className="space-y-1">
        <div className="px-2 py-1 flex items-center gap-1.5 text-[11px] font-semibold text-[#615d59] uppercase tracking-wider">
          <History className="h-3 w-3" />
          <span>Recent Queries ({recentItems.length})</span>
        </div>

        {recentItems.map((item) => (
          <div
            key={item.id}
            className={`group flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
              currentQuestion === item.question
                ? 'bg-white border-[#dddddd] shadow-2xs font-medium text-[#0d0d0d]'
                : 'border-transparent hover:bg-white text-[#31302e]'
            }`}
          >
            <div
              onClick={() => onSelectQuery(item)}
              className="flex-1 truncate pr-2"
              title={item.question}
            >
              <span className="truncate block">{item.question}</span>
              <span className="text-[10px] text-[#a39e98] block">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onToggleSave(item.id)}
                className="p-1 rounded text-[#a39e98] hover:text-[#f7a501] opacity-0 group-hover:opacity-100 hover:bg-[#efeeec] transition-all"
                title="Save query"
              >
                <Star className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="p-1 rounded text-[#a39e98] hover:text-[#cd4239] opacity-0 group-hover:opacity-100 hover:bg-[#efeeec] transition-all"
                title="Delete from history"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onSelectQuery(item)}
                className="p-1 rounded text-[#0075de] opacity-0 group-hover:opacity-100 hover:bg-[#efeeec] transition-all"
                title="Re-run query"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

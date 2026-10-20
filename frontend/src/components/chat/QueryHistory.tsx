/**
 * DataSpeak — Query History Component (QueryHistory.tsx)
 * Calm Analytics Workspace
 * Displays saved and recent questions with search filter,
 * timestamps, re-run trigger, and clean paper canvas cards.
 */

import React, { useState } from 'react';
import { History, Star, Trash2, ArrowUpRight, Search, X } from 'lucide-react';
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
  const [filterQuery, setFilterQuery] = useState('');

  const filteredHistory = history.filter((h) =>
    h.question.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  const savedItems = filteredHistory.filter((h) => h.isSaved);
  const recentItems = filteredHistory.filter((h) => !h.isSaved);

  if (history.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center text-[#615d59]">
        <div className="w-12 h-12 rounded-full bg-[#efeeec] flex items-center justify-center mx-auto mb-3 text-[#a39e98]">
          <History className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h3 className="font-semibold text-[16px] text-[#0d0d0d] mb-1">No query history yet</h3>
        <p className="text-[13px] text-[#615d59]">
          Questions you ask in plain English will appear here along with their verified SQL.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-6">
      {/* Top Search Filter */}
      <div className="bg-white rounded-lg border border-[#e6e6e6] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#0075de]" />
          <h2 className="text-[16px] font-semibold text-[#0d0d0d]">Query History</h2>
          <span className="text-[12px] text-[#615d59]">({history.length} queries)</span>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#a39e98]" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search query history..."
            className="w-full h-9 pl-9 pr-8 rounded bg-[#f8fafc] text-[13px] text-[#0d0d0d] placeholder:text-[#a39e98] border border-[#e6e6e6] focus:outline-none focus:border-[#0075de] transition-colors"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="absolute right-2.5 top-2.5 text-[#a39e98] hover:text-[#0d0d0d]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Saved / Starred Section */}
      {savedItems.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5 px-1 text-[12px] font-semibold text-[#6e4600] uppercase tracking-wider">
            <Star className="h-3.5 w-3.5 fill-[#f7a501] text-[#f7a501]" />
            <span>Saved Questions ({savedItems.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {savedItems.map((item) => {
              const isSelected = currentQuestion === item.question;
              return (
                <div
                  key={item.id}
                  className={`group bg-white rounded-lg border p-4 shadow-2xs transition-all flex items-start justify-between gap-4 ${
                    isSelected ? 'border-[#0075de] ring-1 ring-[#0075de]/30' : 'border-[#e6e6e6] hover:border-[#dddddd]'
                  }`}
                >
                  <div
                    onClick={() => onSelectQuery(item)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-[15px] font-medium text-[#0d0d0d] group-hover:text-[#0075de] transition-colors mb-1.5">
                      {item.question}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#615d59]">
                      <span className="font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span>
                        {item.result.rows?.length || 0} rows returned
                      </span>
                      {item.result.executionTimeMs !== undefined && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{item.result.executionTimeMs.toFixed(0)}ms</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleSave(item.id)}
                      className="p-1.5 rounded hover:bg-[#efeeec] text-[#f7a501] transition-colors"
                      title="Unsave question"
                    >
                      <Star className="h-4 w-4 fill-[#f7a501]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded hover:bg-[#efeeec] text-[#a39e98] hover:text-[#cd4239] transition-colors"
                      title="Delete from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectQuery(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#eaf3fc] hover:bg-[#d5e7f9] text-[#0075de] text-[12px] font-semibold transition-colors"
                      title="View or rerun"
                    >
                      <span>View</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Queries List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 px-1 text-[12px] font-semibold text-[#615d59] uppercase tracking-wider">
          <History className="h-3.5 w-3.5" />
          <span>Recent Queries ({recentItems.length})</span>
        </div>

        {recentItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#e6e6e6] p-8 text-center text-[13px] text-[#615d59]">
            No recent queries matching your filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {recentItems.map((item) => {
              const isSelected = currentQuestion === item.question;
              return (
                <div
                  key={item.id}
                  className={`group bg-white rounded-lg border p-4 shadow-2xs transition-all flex items-start justify-between gap-4 ${
                    isSelected ? 'border-[#0075de] ring-1 ring-[#0075de]/30' : 'border-[#e6e6e6] hover:border-[#dddddd]'
                  }`}
                >
                  <div
                    onClick={() => onSelectQuery(item)}
                    className="flex-1 cursor-pointer"
                  >
                    <p className="text-[15px] font-medium text-[#0d0d0d] group-hover:text-[#0075de] transition-colors mb-1.5">
                      {item.question}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-[#615d59]">
                      <span className="font-mono">{new Date(item.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span>
                        {item.result.rows?.length || 0} rows returned
                      </span>
                      {item.result.executionTimeMs !== undefined && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{item.result.executionTimeMs.toFixed(0)}ms</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      type="button"
                      onClick={() => onToggleSave(item.id)}
                      className="p-1.5 rounded hover:bg-[#efeeec] text-[#a39e98] hover:text-[#f7a501] transition-colors"
                      title="Bookmark question"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 rounded hover:bg-[#efeeec] text-[#a39e98] hover:text-[#cd4239] transition-colors"
                      title="Delete from history"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectQuery(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#efeeec] hover:bg-[#e6e6e6] text-[#31302e] hover:text-[#0d0d0d] text-[12px] font-medium transition-colors"
                      title="View or rerun"
                    >
                      <span>View</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

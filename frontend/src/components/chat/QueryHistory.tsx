/**
 * DataSpeak — Query History Component (QueryHistory.tsx)
 * Calm Analytics Workspace
 * Displays saved and recent questions with search filter,
 * timestamps, re-run trigger, and clean paper canvas cards.
 * Supports optimistic bookmarking, item deletion, and clearing recent unsaved history.
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Star,
  Trash2,
  ArrowUpRight,
  Search,
  X,
  ShieldAlert,
  AlertCircle,
  Database,
  Loader2,
} from 'lucide-react';
import type { QueryHistoryItem } from '../../types';

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  onSelectQuery: (item: QueryHistoryItem) => void;
  onToggleSave: (id: string) => void;
  onDelete: (id: string) => void;
  onClearRecent?: () => void;
  onSearch?: (q: string) => void;
  currentQuestion?: string;
  isLoading?: boolean;
}

export const QueryHistory: React.FC<QueryHistoryProps> = ({
  history,
  onSelectQuery,
  onToggleSave,
  onDelete,
  onClearRecent,
  onSearch,
  currentQuestion,
  isLoading = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Debounced server search if onSearch provided
  useEffect(() => {
    if (!onSearch) return;
    const timer = setTimeout(() => {
      onSearch(filterQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [filterQuery, onSearch]);

  const filteredHistory = history.filter((h) =>
    h.question.toLowerCase().includes(filterQuery.toLowerCase().trim())
  );

  const savedItems = filteredHistory.filter((h) => Boolean(h.is_saved ?? h.isSaved));
  const recentItems = filteredHistory.filter((h) => !Boolean(h.is_saved ?? h.isSaved));

  if (history.length === 0 && !isLoading) {
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

  const renderHistoryCard = (item: QueryHistoryItem, isStarredSection: boolean) => {
    const isSelected = currentQuestion === item.question;
    const isSaved = Boolean(item.is_saved ?? item.isSaved);
    const rowCount =
      item.row_count ??
      item.result?.rowCount ??
      item.result?.row_count ??
      item.result?.rows?.length ??
      0;
    const executionTime =
      item.execution_time_ms ??
      item.result?.executionTimeMs ??
      item.result?.execution_time_ms;
    const timestampStr = item.created_at || item.timestamp;
    const dateFormatted = timestampStr ? new Date(timestampStr).toLocaleString() : '';
    const status = item.status || item.result?.status || 'success';

    return (
      <div
        className={`group bg-white rounded-lg border p-4 shadow-2xs transition-all flex items-start justify-between gap-4 ${
          isSelected
            ? 'border-[#0075de] ring-1 ring-[#0075de]/30'
            : 'border-[#e6e6e6] hover:border-[#dddddd]'
        }`}
      >
        <div
          onClick={() => onSelectQuery(item)}
          className="flex-1 cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <p className="text-[15px] font-medium text-[#0d0d0d] group-hover:text-[#0075de] transition-colors">
              {item.question}
            </p>
            {status === 'blocked' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#f7d6d3] text-[#cd4239]">
                <ShieldAlert className="h-3 w-3" />
                Blocked
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#fdf0d0] text-[#a36900]">
                <AlertCircle className="h-3 w-3" />
                Error
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[#615d59] flex-wrap">
            {dateFormatted && <span className="font-mono">{dateFormatted}</span>}
            {item.database_name && (
              <>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#454340]">
                  <Database className="h-3 w-3 text-[#a39e98]" />
                  {item.database_name}
                </span>
              </>
            )}
            <span>•</span>
            <span>{rowCount} rows</span>
            {executionTime !== undefined && executionTime !== null && (
              <>
                <span>•</span>
                <span className="font-mono">{Number(executionTime).toFixed(0)}ms</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            type="button"
            onClick={() => onToggleSave(item.id)}
            className={`p-1.5 rounded hover:bg-[#efeeec] transition-colors cursor-pointer ${
              isSaved
                ? 'text-[#f7a501]'
                : 'text-[#a39e98] hover:text-[#f7a501]'
            }`}
            title={isSaved ? 'Unsave question' : 'Bookmark question'}
          >
            <Star className={`h-4 w-4 ${isSaved ? 'fill-[#f7a501]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded hover:bg-[#efeeec] text-[#a39e98] hover:text-[#cd4239] transition-colors cursor-pointer"
            title="Delete from history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectQuery(item)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[12px] transition-colors cursor-pointer ${
              isStarredSection
                ? 'bg-[#eaf3fc] hover:bg-[#d5e7f9] text-[#0075de] font-semibold'
                : 'bg-[#efeeec] hover:bg-[#e6e6e6] text-[#31302e] hover:text-[#0d0d0d] font-medium'
            }`}
            title="View or rerun"
          >
            <span>View</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-6">
      {/* Top Search Filter Header */}
      <div className="bg-white rounded-lg border border-[#e6e6e6] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-[#0075de]" />
          <h2 className="text-[16px] font-semibold text-[#0d0d0d]">Query History</h2>
          <span className="text-[12px] text-[#615d59]">({history.length} queries)</span>
          {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0075de] ml-1" />}
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
              className="absolute right-2.5 top-2.5 text-[#a39e98] hover:text-[#0d0d0d] cursor-pointer"
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
            {savedItems.map((item) => <React.Fragment key={item.id}>{renderHistoryCard(item, true)}</React.Fragment>)}
          </div>
        </div>
      )}

      {/* Recent Queries List */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#615d59] uppercase tracking-wider">
            <History className="h-3.5 w-3.5" />
            <span>Recent Queries ({recentItems.length})</span>
          </div>

          {onClearRecent && recentItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all recent unsaved queries? Saved bookmarked queries will remain safe.')) {
                  onClearRecent();
                }
              }}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[#a39e98] hover:text-[#cd4239] transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-[#efeeec]"
              title="Clear recent queries (keeps saved queries)"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear recent</span>
            </button>
          )}
        </div>

        {recentItems.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#e6e6e6] p-8 text-center text-[13px] text-[#615d59]">
            {filterQuery ? 'No recent queries matching your filter.' : 'No recent queries.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5">
            {recentItems.map((item) => <React.Fragment key={item.id}>{renderHistoryCard(item, false)}</React.Fragment>)}
          </div>
        )}
      </div>
    </div>
  );
};

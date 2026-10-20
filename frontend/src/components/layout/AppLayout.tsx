/**
 * DataSpeak — Main Application Layout (AppLayout.tsx)
 * Framed-sheet archetype: Tinted frame (#f4f5f6) + Inset White Sheet (#ffffff).
 * Enforces strict answer stack hierarchy: Summary → Chart → Table → SQL.
 */

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { DbConnectionModal } from '../settings/DbConnectionModal';
import { QueryInput } from '../chat/QueryInput';
import { InsightCard } from '../results/InsightCard';
import { ChartViewer } from '../results/ChartViewer';
import { MetricTile } from '../results/MetricTile';
import { DataTable } from '../results/DataTable';
import { SqlPreview } from '../chat/SqlPreview';
import { BlockedNotice } from '../common/BlockedNotice';
import { CautionNotice } from '../common/CautionNotice';
import { SummarySkeleton, ChartSkeleton, TableSkeleton } from '../common/LoadingSkeleton';
import { useDatabase } from '../../hooks/useDatabase';
import { useQueryExecution } from '../../hooks/useQueryExecution';
import { MessageSquare, ArrowUpRight, ShoppingCart, Package, Users, Star } from 'lucide-react';

interface AppLayoutProps {
  isClerkConfigured: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ isClerkConfigured }) => {
  const {
    activeConnection,
    schema,
    isRefreshing: isRefreshingSchema,
    isModalOpen,
    setIsModalOpen,
    connectDatabase,
    disconnectDatabase,
    refreshSchema,
  } = useDatabase(isClerkConfigured);

  const {
    currentResult,
    currentQuestion,
    isRunning,
    steps,
    error: queryError,
    history,
    executeQuestion,
    cancelQuery,
    toggleSaveHistory,
    deleteHistoryItem,
    selectHistoryItem,
    resetCurrentQuery,
  } = useQueryExecution();

  const [externalPrompt, setExternalPrompt] = useState<string>('');

  const handleSelectTableQuestion = (q: string) => {
    setExternalPrompt(q);
  };

  const handleScrollToSql = () => {
    const el = document.getElementById('dataspeak-sql-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEditQuestion = () => {
    setExternalPrompt(currentQuestion);
  };

  const isBlocked = currentResult?.status === 'blocked';
  const isError = currentResult?.status === 'error';
  const isSingleMetric =
    currentResult &&
    currentResult.rows.length === 1 &&
    currentResult.columns.length === 1 &&
    (currentResult.chart?.type === 'none' || !currentResult.chart);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f5f6] text-[#131416]">
      {/* Top Header (48px, tinted frame ground) */}
      <Header
        activeConnection={activeConnection}
        onOpenConnectModal={() => setIsModalOpen(true)}
        isClerkConfigured={isClerkConfigured}
      />

      {/* Main Workspace Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (240px, tinted frame ground) */}
        <Sidebar
          activeConnection={activeConnection}
          schema={schema}
          isRefreshingSchema={isRefreshingSchema}
          onRefreshSchema={refreshSchema}
          onNewQuestion={resetCurrentQuery}
          onSelectTableQuestion={handleSelectTableQuestion}
          history={history}
          onSelectHistoryItem={selectHistoryItem}
          onToggleSaveHistory={toggleSaveHistory}
          onDeleteHistory={deleteHistoryItem}
          currentQuestion={currentQuestion}
          onDisconnectDatabase={disconnectDatabase}
          onOpenConnectModal={() => setIsModalOpen(true)}
        />

        {/* Inset White Sheet Canvas */}
        <main className="flex-1 m-2 sm:m-2.5 p-4 sm:p-6 bg-white border border-[#e2e4e8] rounded-xl sm:rounded-2xl overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {/* ── Empty State / First Screen ──────────────────────────── */}
            {!currentResult && !isRunning && (
              <div className="w-full my-auto py-6 flex flex-col items-center text-center">
                <h1 className="text-[22px] font-semibold tracking-tight text-[#131416] mb-1.5">
                  Natural Language Database Analytics
                </h1>

                <p className="text-xs text-[#5d5f60] max-w-xl mx-auto leading-relaxed mb-6">
                  {activeConnection
                    ? `Ask questions about ${activeConnection.name}. Natural language queries are validated by AST guardrails, executed as read-only SQL, and visualized.`
                    : 'Connect PostgreSQL, Neon, Supabase, or SQLite to explore data and visualize metrics in plain English.'}
                </p>

                {/* Prompt Box */}
                <div className="w-full mb-8">
                  <QueryInput
                    onSubmit={executeQuestion}
                    onCancel={cancelQuery}
                    isRunning={isRunning}
                    steps={steps}
                    activeConnection={activeConnection}
                    onOpenConnectModal={() => setIsModalOpen(true)}
                    externalPrompt={externalPrompt}
                  />
                </div>

                {/* Getting-Started Exploration Cards Deck */}
                <div className="w-full text-left pt-2">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-xs font-medium text-[#5d5f60]">
                      Exploration Deck · Click to Ask
                    </span>
                    {activeConnection && (
                      <span className="text-[11px] text-[#5d5f60] tnum">
                        {activeConnection.name} ({activeConnection.dialect})
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectTableQuestion('What is the monthly revenue trend over time?')
                      }
                      className="p-3.5 rounded-lg border border-[#e2e4e8] hover:border-[#1b6c80] bg-[#f7f8fa] hover:bg-white text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#131416]">
                          <ShoppingCart className="h-3.5 w-3.5 text-[#1b6c80]" />
                          <span>Orders & Revenue</span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#5d5f60] group-hover:text-[#1b6c80] transition-colors" />
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        "What is the monthly revenue trend over time?"
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectTableQuestion('What are the top 5 products by revenue?')
                      }
                      className="p-3.5 rounded-lg border border-[#e2e4e8] hover:border-[#1b6c80] bg-[#f7f8fa] hover:bg-white text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#131416]">
                          <Package className="h-3.5 w-3.5 text-[#1b6c80]" />
                          <span>Product Performance</span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#5d5f60] group-hover:text-[#1b6c80] transition-colors" />
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        "What are the top 5 products by revenue?"
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectTableQuestion('Who are the top 10 customers with the most orders?')
                      }
                      className="p-3.5 rounded-lg border border-[#e2e4e8] hover:border-[#1b6c80] bg-[#f7f8fa] hover:bg-white text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#131416]">
                          <Users className="h-3.5 w-3.5 text-[#1b6c80]" />
                          <span>Customer Activity</span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#5d5f60] group-hover:text-[#1b6c80] transition-colors" />
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        "Who are the top 10 customers with the most orders?"
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectTableQuestion('Show average product rating by category')
                      }
                      className="p-3.5 rounded-lg border border-[#e2e4e8] hover:border-[#1b6c80] bg-[#f7f8fa] hover:bg-white text-left transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#131416]">
                          <Star className="h-3.5 w-3.5 text-[#a86f0c]" />
                          <span>Ratings & Feedback</span>
                        </div>
                        <ArrowUpRight className="h-3.5 w-3.5 text-[#5d5f60] group-hover:text-[#1b6c80] transition-colors" />
                      </div>
                      <p className="text-xs text-[#5d5f60]">
                        "Show average product rating by category"
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Active Conversation & Results ──────────────────────── */}
            {(currentResult || isRunning) && (
              <div className="w-full space-y-5 pb-6">
                {/* User Prompt Echo */}
                {currentQuestion && (
                  <div className="flex items-start gap-3 p-3.5 rounded-lg bg-[#f7f8fa] border border-[#e2e4e8]">
                    <div className="p-1.5 rounded-md bg-white border border-[#e2e4e8] text-[#131416] shrink-0 mt-0.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-medium text-[#5d5f60] block mb-0.5">
                        Question
                      </span>
                      <p className="text-xs font-medium text-[#131416]">{currentQuestion}</p>
                    </div>
                  </div>
                )}

                {/* Loading State Skeletons */}
                {isRunning && (
                  <div className="space-y-4">
                    <SummarySkeleton />
                    <ChartSkeleton />
                    <TableSkeleton />
                  </div>
                )}

                {/* Error Banner */}
                {queryError && (
                  <div className="rounded-lg bg-[#ffedea] border border-[#c4242a] p-3.5 text-xs text-[#831c1e]">
                    <span className="font-semibold">Query error: </span>
                    <span>{queryError}</span>
                  </div>
                )}

                {/* ── Answer Stack (Strict Vertical Order) ─────────────── */}
                {currentResult && !isRunning && (
                  <>
                    {/* A. Blocked Query Guardrail Warning */}
                    {isBlocked ? (
                      <BlockedNotice
                        reason={currentResult.error_message || 'Prohibited database mutation statement.'}
                        onEditQuestion={handleEditQuestion}
                        blockedSql={currentResult.sql}
                      />
                    ) : isError ? (
                      <div className="rounded-lg bg-[#fffbeb] border border-[#fde68a] p-4 my-3">
                        <h4 className="text-xs font-semibold text-[#92400e] mb-1">
                          Unable to complete query
                        </h4>
                        <p className="text-xs text-[#5d5f60] leading-relaxed mb-3">
                          {currentResult.error_message ||
                            'We encountered a database error while executing the generated query.'}
                        </p>
                        {currentResult.sql && (
                          <div className="font-mono text-xs bg-[#23251d] text-white p-3 rounded-lg overflow-x-auto">
                            {currentResult.sql}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* 1. Plain-English Summary Callout */}
                        {currentResult.summary && (
                          <InsightCard
                            summary={currentResult.summary}
                            rowCount={currentResult.row_count ?? currentResult.rowCount}
                            onViewSql={handleScrollToSql}
                          />
                        )}

                        {/* Automatic Row Cap Notice if applied */}
                        {(currentResult.row_count ?? 0) >= 100 && (
                          <CautionNotice
                            message="Default row limit (LIMIT 100) was applied to protect database latency. Add a date range or filter to focus results."
                          />
                        )}

                        {/* 2. Visual Representation: Single Metric Tile OR Dynamic Chart */}
                        {isSingleMetric ? (
                          <MetricTile
                            label={currentResult.columns[0].replace(/_/g, ' ')}
                            value={currentResult.rows[0][currentResult.columns[0]] as string | number}
                            subtext="Single value result"
                          />
                        ) : (
                          currentResult.columns.length >= 2 &&
                          currentResult.rows.length > 0 &&
                          currentResult.chart?.type !== 'none' && (
                            <ChartViewer
                              config={currentResult.chart}
                              rows={currentResult.rows}
                              columns={currentResult.columns}
                            />
                          )
                        )}

                        {/* 3. Interactive Data Table (TanStack Table v8) */}
                        {currentResult.rows.length > 0 && (
                          <DataTable
                            columns={currentResult.columns}
                            rows={currentResult.rows}
                            questionPrompt={currentQuestion}
                            executionTimeMs={currentResult.execution_time_ms ?? currentResult.executionTimeMs}
                          />
                        )}

                        {/* 4. Transparent Generated SQL Preview */}
                        {currentResult.sql && (
                          <SqlPreview
                            sql={currentResult.sql}
                            dialect={activeConnection?.dialect || 'sql'}
                            isReadonlyVerified={currentResult.status === 'success'}
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* Docked Prompt Input inside the sheet when results are active */}
                <div className="sticky bottom-0 bg-white border-t border-[#e2e4e8] pt-3 pb-1 mt-6">
                  <QueryInput
                    onSubmit={executeQuestion}
                    onCancel={cancelQuery}
                    isRunning={isRunning}
                    steps={steps}
                    activeConnection={activeConnection}
                    onOpenConnectModal={() => setIsModalOpen(true)}
                    externalPrompt={externalPrompt}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Database Connection Modal */}
      <DbConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConnected={async (params) => {
          await connectDatabase(params);
        }}
      />
    </div>
  );
};

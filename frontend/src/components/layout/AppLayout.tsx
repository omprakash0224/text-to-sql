/**
 * DataSpeak — Main Application Layout (AppLayout.tsx)
 * Assembles Header, Sidebar, and centered conversation column.
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
import { MessageSquare, Sparkles } from 'lucide-react';

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

  // Handle clicking a schema question or suggestion
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
    <div className="flex flex-col min-h-screen bg-[#f6f5f4] text-[#0d0d0d]">
      {/* Top Header */}
      <Header
        activeConnection={activeConnection}
        onOpenConnectModal={() => setIsModalOpen(true)}
        isClerkConfigured={isClerkConfigured}
      />

      {/* Main Workspace Shell */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
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

        {/* Center Conversation Column */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col items-center">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {/* ── Empty State / Hero Screen ──────────────────────────── */}
            {!currentResult && !isRunning && (
              <div className="my-auto py-12 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-6 border border-[#c9e0f6] bg-[#eaf3fc] text-[#0075de]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Plain English to Verified SQL</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0d0d0d] mb-4">
                  What do you want to know?
                </h1>

                <p className="text-sm sm:text-base text-[#615d59] max-w-xl mx-auto leading-relaxed mb-8">
                  {activeConnection
                    ? `Ask questions about ${activeConnection.name}. Queries are automatically converted to safe, read-only SQL, executed, and graphed.`
                    : 'Connect your PostgreSQL, Neon, Supabase, or SQLite database to start asking questions without writing SQL.'}
                </p>

                {/* Prompt Box in Hero Position */}
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
            )}

            {/* ── Active Conversation & Results ──────────────────────── */}
            {(currentResult || isRunning) && (
              <div className="w-full space-y-6 pb-24">
                {/* User Prompt Echo */}
                {currentQuestion && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#dddddd] shadow-2xs">
                    <div className="p-1.5 rounded-lg bg-[#efeeec] text-[#31302e] shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#615d59] uppercase tracking-wider block mb-0.5">
                        Your Question
                      </span>
                      <p className="text-sm font-medium text-[#0d0d0d]">{currentQuestion}</p>
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
                  <div className="rounded-xl bg-[#f7d6d3] border border-[#cd4239] p-4 text-xs text-[#86241d]">
                    <span className="font-semibold">Query Error: </span>
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
                      <div className="rounded-xl bg-[#fdf0d0] border border-[#f7a501] p-5 my-4">
                        <h4 className="text-sm font-semibold text-[#6e4600] mb-1">
                          Unable to complete query
                        </h4>
                        <p className="text-xs text-[#31302e] leading-relaxed mb-3">
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
              </div>
            )}
          </div>

          {/* Sticky Docked Prompt Box when conversation is active */}
          {(currentResult || isRunning) && (
            <div className="fixed bottom-0 left-64 right-0 bg-gradient-to-t from-[#f6f5f4] via-[#f6f5f4]/95 to-transparent pt-6 pb-4 px-4 sm:px-8 z-30 pointer-events-none">
              <div className="max-w-3xl mx-auto pointer-events-auto">
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

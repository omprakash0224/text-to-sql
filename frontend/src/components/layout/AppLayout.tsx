/**
 * DataSpeak — PostHog Main Application Layout (AppLayout.tsx)
 * Assembles Header, Sidebar, and centered conversation column on warm cream canvas (#eeefe9).
 * Features PostHog hedgehog hero marginalia, feature deck with LOG.txt content,
 * and strict answer stack: Summary → Chart → Table → SQL.
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
import { HedgehogMascot } from '../common/HedgehogMascot';
import { useDatabase } from '../../hooks/useDatabase';
import { useQueryExecution } from '../../hooks/useQueryExecution';
import {
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  Server,
  Layers,
  CheckCircle2,
} from 'lucide-react';

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
    <div className="flex flex-col min-h-screen bg-[#eeefe9] text-[#23251d]">
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
        <main className="flex-1 overflow-y-auto w-full flex flex-col items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col items-center">
            {/* ── Empty State / PostHog Hero Screen ──────────────────── */}
            {!currentResult && !isRunning && (
              <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 text-center">
                {/* Hero Mascot Header */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
                  <HedgehogMascot pose="lounge" size={80} className="shrink-0" />
                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold mb-3 border border-[#f7a501] bg-[#fffbeb] text-[#92400e] shadow-xs">
                      <Sparkles className="h-3.5 w-3.5 text-[#f7a501]" />
                      <span>Natural Language SQL Analytics</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#23251d] leading-tight">
                      The new way to talk to your database
                    </h1>
                  </div>
                </div>

                {/* Constrained Body Copy (65ch–75ch) */}
                <p className="text-base sm:text-lg text-[#4d4f46] max-w-2xl mx-auto leading-relaxed mb-10">
                  {activeConnection
                    ? `Connected to ${activeConnection.name}. Type your question in plain English below; our LangGraph agent writes dialect-specific SQL with strict zero-mutation AST guardrails.`
                    : 'Connect PostgreSQL, Neon, Supabase, or SQLite to query your data without writing SQL. Safe, strictly read-only, and automated.'}
                </p>

                {/* Prompt Box in Hero Position */}
                <div className="mb-12 sm:mb-16">
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

                {/* Section Heading with distinct top margin and tight grouping to subtitle */}
                <div className="mt-10 sm:mt-14 mb-6 sm:mb-8 text-center">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#23251d] mb-2 font-display">
                    Production Architecture & Capabilities
                  </h2>
                  <p className="text-sm text-[#4d4f46] max-w-prose mx-auto leading-relaxed">
                    Battle-tested infrastructure verified across Phases 1–5 in the DataSpeak log.
                  </p>
                </div>

                {/* PostHog Feature Tiles (Built from LOG.txt content) - Equal Heights, 8-pt Grid Padding */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto text-left w-full items-stretch">
                  {/* Feature 1: Demo E-Commerce Dataset */}
                  <div
                    onClick={() => {
                      if (!activeConnection) {
                        setIsModalOpen(true);
                      } else {
                        setExternalPrompt('What are the top 5 products by revenue?');
                      }
                    }}
                    className="p-6 sm:p-8 rounded-xl bg-white border border-[#bfc1b7] hover:border-[#23251d] cursor-pointer transition-all shadow-sm hover:shadow-md group h-full flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-[#eeefe9] text-[#1078a3] group-hover:bg-[#dceaf6] transition-colors border border-[#dcdfd2]">
                            <Layers className="h-5 w-5" />
                          </div>
                          <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                            E-Commerce Schema (LOG.txt)
                          </h4>
                        </div>
                        <span className="text-[11px] font-mono text-[#4d4f46] bg-[#eeefe9] border border-[#bfc1b7] px-2.5 py-1 rounded-full font-bold">
                          6 Tables
                        </span>
                      </div>
                      <p className="text-sm text-[#4d4f46] leading-relaxed mb-4">
                        Seeded relational SQLite database with orders, products, customers, and reviews ready for instant natural language exploration.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#f0f1ec] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1d4ed8] group-hover:underline inline-flex items-center gap-1">
                        {activeConnection ? 'Try "Top products by revenue" →' : 'Connect Demo SQLite →'}
                      </span>
                    </div>
                  </div>

                  {/* Feature 2: Strict AST Guardrails */}
                  <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#bfc1b7] shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 rounded-lg bg-[#d9eddf] text-[#2c8c66] border border-[#2c8c66]/30">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                          sqlglot AST Guardrails
                        </h4>
                      </div>
                      <p className="text-sm text-[#4d4f46] leading-relaxed mb-4">
                        Zero tolerance for mutations: INSERT, UPDATE, DELETE, and DROP statements are rejected before reaching your database engine.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#f0f1ec] flex items-center gap-2 text-xs font-semibold text-[#17543b]">
                      <CheckCircle2 className="h-4 w-4 text-[#2c8c66] shrink-0" />
                      <span>Automatic LIMIT 100 row caps applied</span>
                    </div>
                  </div>

                  {/* Feature 3: Multi-Cloud SQLAlchemy Async */}
                  <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#bfc1b7] shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 rounded-lg bg-[#eeefe9] text-[#f7a501] border border-[#dcdfd2]">
                          <Server className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                          Cloud Engine Pooling
                        </h4>
                      </div>
                      <p className="text-sm text-[#4d4f46] leading-relaxed mb-4">
                        Dynamic SQLAlchemy 2.0 asyncpg/aiomysql pooling with SSL encryption for Neon, Supabase (port 6543), and PostgreSQL.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#f0f1ec] flex items-center justify-between text-xs text-[#6c6e63]">
                      <span>Async reflection duration</span>
                      <span className="font-mono font-bold text-[#23251d]">&lt; 20ms</span>
                    </div>
                  </div>

                  {/* Feature 4: LangGraph Self-Correcting Agent */}
                  <div className="p-6 sm:p-8 rounded-xl bg-white border border-[#bfc1b7] shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="p-2 rounded-lg bg-[#e7d8ee] text-[#7c44a6] border border-[#7c44a6]/30">
                          <Zap className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                          LangGraph + Groq Llama 3.3
                        </h4>
                      </div>
                      <p className="text-sm text-[#4d4f46] leading-relaxed mb-4">
                        Stateful 5-step workflow with Groq 70B inference, heuristic Recharts selection, and automated 2-retry self-correction.
                      </p>
                    </div>
                    <div className="pt-3 border-t border-[#f0f1ec] text-xs font-semibold text-[#7c44a6]">
                      Multi-provider fallback (OpenRouter)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Active Conversation & Results ──────────────────────── */}
            {(currentResult || isRunning) && (
              <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 pb-36">
                {/* User Prompt Echo (White Card on Cream with generous 8-pt padding) */}
                {currentQuestion && (
                  <div className="flex items-start gap-4 p-6 sm:p-8 rounded-xl bg-white border border-[#bfc1b7] shadow-sm">
                    <div className="p-2.5 rounded-lg bg-[#eeefe9] text-[#23251d] shrink-0 mt-0.5 border border-[#bfc1b7]">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-[#6c6e63] uppercase tracking-wider block mb-1">
                        Your Question
                      </span>
                      <p className="text-base sm:text-lg font-bold text-[#23251d] leading-relaxed">
                        {currentQuestion}
                      </p>
                    </div>
                  </div>
                )}

                {/* Loading State Skeletons */}
                {isRunning && (
                  <div className="space-y-6">
                    <SummarySkeleton />
                    <ChartSkeleton />
                    <TableSkeleton />
                  </div>
                )}

                {/* Error Banner */}
                {queryError && (
                  <div className="rounded-xl bg-[#f7d6d3] border border-[#cd4239] p-6 text-sm text-[#86241d] shadow-sm">
                    <span className="font-bold">Query Error: </span>
                    <span className="leading-relaxed">{queryError}</span>
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
                      <div className="rounded-xl bg-[#fffbeb] border border-[#f7a501] p-6 sm:p-8 my-6 shadow-sm">
                        <h4 className="text-base font-bold text-[#92400e] mb-2">
                          Unable to complete query
                        </h4>
                        <p className="text-sm text-[#4d4f46] leading-relaxed mb-4 max-w-prose">
                          {currentResult.error_message ||
                            'We encountered a database error while executing the generated query.'}
                        </p>
                        {currentResult.sql && (
                          <div className="font-mono text-xs bg-[#23251d] text-white p-4 rounded-lg overflow-x-auto border border-[#33342d]">
                            {currentResult.sql}
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* 1. Plain-English Summary Callout (Pastel Blue Banner) */}
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
                            message="Default row limit (LIMIT 100) was applied by AST guardrails to protect database performance. Add a filter to focus results."
                          />
                        )}

                        {/* 2. Visual Representation: Single Metric Tile OR PostHog Chart */}
                        {isSingleMetric ? (
                          <MetricTile
                            label={currentResult.columns[0].replace(/_/g, ' ')}
                            value={currentResult.rows[0][currentResult.columns[0]] as string | number}
                            subtext="Single scalar KPI result"
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

                        {/* 3. Interactive Data Table (TanStack Table v8 on White Card) */}
                        {currentResult.rows.length > 0 && (
                          <DataTable
                            columns={currentResult.columns}
                            rows={currentResult.rows}
                            questionPrompt={currentQuestion}
                            executionTimeMs={currentResult.execution_time_ms ?? currentResult.executionTimeMs}
                          />
                        )}

                        {/* 4. Transparent Generated SQL Preview (PostHog Dark Island) */}
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
            <div className="fixed bottom-0 left-64 sm:left-72 right-0 bg-[#eeefe9]/95 backdrop-blur-md border-t border-[#bfc1b7] pt-4 pb-5 px-4 sm:px-8 z-30 pointer-events-none shadow-lg">
              <div className="max-w-4xl mx-auto pointer-events-auto">
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

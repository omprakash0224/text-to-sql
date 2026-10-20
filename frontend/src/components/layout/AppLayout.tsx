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
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 flex flex-col items-center">
          <div className="w-full max-w-3xl flex-1 flex flex-col">
            {/* ── Empty State / PostHog Hero Screen ──────────────────── */}
            {!currentResult && !isRunning && (
              <div className="my-auto py-8 text-center">
                {/* Hero Mascot Header */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <HedgehogMascot pose="lounge" size={68} className="hidden sm:block" />
                  <div className="text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 border border-[#f7a501] bg-[#fffbeb] text-[#92400e]">
                      <Sparkles className="h-3.5 w-3.5 text-[#f7a501]" />
                      <span>Natural Language SQL Analytics</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#23251d] leading-tight">
                      The new way to talk to your database
                    </h1>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-[#4d4f46] max-w-2xl mx-auto leading-relaxed mb-8">
                  {activeConnection
                    ? `Connected to ${activeConnection.name}. Type your question in plain English below; our LangGraph agent writes dialect-specific SQL with strict zero-mutation AST guardrails.`
                    : 'Connect PostgreSQL, Neon, Supabase, or SQLite to query your data without writing SQL. Safe, strictly read-only, and automated.'}
                </p>

                {/* Prompt Box in Hero Position */}
                <div className="mb-10">
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

                {/* PostHog Feature Tiles (Built from LOG.txt content) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left max-w-3xl mx-auto">
                  {/* Feature 1: Demo E-Commerce Dataset */}
                  <div
                    onClick={() => {
                      if (!activeConnection) {
                        setIsModalOpen(true);
                      } else {
                        setExternalPrompt('What are the top 5 products by revenue?');
                      }
                    }}
                    className="p-4 rounded-md bg-white border border-[#bfc1b7] hover:border-[#23251d] cursor-pointer transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded bg-[#eeefe9] text-[#1078a3] group-hover:bg-[#dceaf6]">
                          <Layers className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                          E-Commerce Schema (LOG.txt)
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-[#6c6e63] bg-[#eeefe9] px-2 py-0.5 rounded">
                        6 Tables
                      </span>
                    </div>
                    <p className="text-xs text-[#4d4f46] leading-relaxed mb-2">
                      Seeded relational SQLite database with orders, products, customers, and reviews ready for instant querying.
                    </p>
                    <span className="text-[11px] font-bold text-[#1d4ed8] group-hover:underline">
                      {activeConnection ? 'Try "Top products by revenue" →' : 'Connect Demo SQLite →'}
                    </span>
                  </div>

                  {/* Feature 2: Strict AST Guardrails */}
                  <div className="p-4 rounded-md bg-white border border-[#bfc1b7] shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded bg-[#d9eddf] text-[#2c8c66]">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                        sqlglot AST Guardrails
                      </h4>
                    </div>
                    <p className="text-xs text-[#4d4f46] leading-relaxed mb-2">
                      Zero tolerance for mutations: INSERT, UPDATE, DELETE, and DROP statements are rejected before reaching your database.
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#17543b]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#2c8c66]" />
                      <span>Automatic LIMIT 100 row caps</span>
                    </div>
                  </div>

                  {/* Feature 3: Multi-Cloud SQLAlchemy Async */}
                  <div className="p-4 rounded-md bg-white border border-[#bfc1b7] shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded bg-[#eeefe9] text-[#f7a501]">
                        <Server className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                        Cloud Engine Pooling
                      </h4>
                    </div>
                    <p className="text-xs text-[#4d4f46] leading-relaxed mb-2">
                      Dynamic SQLAlchemy 2.0 asyncpg/aiomysql pooling with SSL encryption for Neon, Supabase (port 6543), and PostgreSQL.
                    </p>
                    <span className="text-[11px] font-mono text-[#6c6e63]">
                      Reflection in &lt; 20ms
                    </span>
                  </div>

                  {/* Feature 4: LangGraph Self-Correcting Agent */}
                  <div className="p-4 rounded-md bg-white border border-[#bfc1b7] shadow-2xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded bg-[#e7d8ee] text-[#7c44a6]">
                        <Zap className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-bold text-[#23251d] uppercase tracking-wider">
                        LangGraph + Groq Llama 3.3
                      </h4>
                    </div>
                    <p className="text-xs text-[#4d4f46] leading-relaxed mb-2">
                      Stateful 5-step workflow with Groq 70B inference, heuristic Recharts selection, and automated 2-retry self-correction.
                    </p>
                    <span className="text-[11px] font-semibold text-[#7c44a6]">
                      Multi-provider fallback (OpenRouter)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Active Conversation & Results ──────────────────────── */}
            {(currentResult || isRunning) && (
              <div className="w-full space-y-6 pb-24">
                {/* User Prompt Echo (White Card on Cream) */}
                {currentQuestion && (
                  <div className="flex items-start gap-3 p-4 rounded-md bg-white border border-[#bfc1b7]">
                    <div className="p-1.5 rounded bg-[#eeefe9] text-[#23251d] shrink-0 mt-0.5 border border-[#bfc1b7]">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-[#6c6e63] uppercase tracking-wider block mb-0.5">
                        Your Question
                      </span>
                      <p className="text-sm font-semibold text-[#23251d]">{currentQuestion}</p>
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
                  <div className="rounded-md bg-[#f7d6d3] border border-[#cd4239] p-4 text-xs text-[#86241d]">
                    <span className="font-bold">Query Error: </span>
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
                      <div className="rounded-md bg-[#fffbeb] border border-[#f7a501] p-5 my-4">
                        <h4 className="text-sm font-bold text-[#92400e] mb-1">
                          Unable to complete query
                        </h4>
                        <p className="text-xs text-[#4d4f46] leading-relaxed mb-3">
                          {currentResult.error_message ||
                            'We encountered a database error while executing the generated query.'}
                        </p>
                        {currentResult.sql && (
                          <div className="font-mono text-xs bg-[#23251d] text-white p-3 rounded-md overflow-x-auto">
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
            <div className="fixed bottom-0 left-64 right-0 bg-[#eeefe9]/90 backdrop-blur-sm border-t border-[#bfc1b7] pt-4 pb-4 px-4 sm:px-8 z-30 pointer-events-none">
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

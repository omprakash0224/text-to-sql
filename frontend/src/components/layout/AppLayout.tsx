/**
 * DataSpeak — Main Application Layout (AppLayout.tsx)
 * Calm Analytics Workspace (docs/ui-example/DESIGN.md, screen.png, screen1.png)
 * Assembles Top Header, Fixed Left Sidebar (264px), and centered workspace.
 *
 * When NO database is connected:
 * Shows a clear "No Database Connected" hero card, detailed "How to Connect" workflow,
 * and comprehensive "Features of this Project" deck.
 *
 * When a database IS connected:
 * Enables natural language querying with LangGraph, AST guardrails,
 * Recharts visualization, Airtable-style data tables, and verified SQL.
 */

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar, type WorkspaceView } from './Sidebar';
import { DbConnectionModal } from '../settings/DbConnectionModal';
import { QueryInput } from '../chat/QueryInput';
import { InsightCard } from '../results/InsightCard';
import { ChartViewer } from '../results/ChartViewer';
import { MetricTile } from '../results/MetricTile';
import { DataTable } from '../results/DataTable';
import { SqlPreview } from '../chat/SqlPreview';
import { BlockedNotice } from '../common/BlockedNotice';
import { CautionNotice } from '../common/CautionNotice';
import { SchemaExplorer } from '../schema/SchemaExplorer';
import { QueryHistory } from '../chat/QueryHistory';
import { useDatabase } from '../../hooks/useDatabase';
import { useQueryExecution } from '../../hooks/useQueryExecution';
import {
  Database,
  ShieldCheck,
  Zap,
  Server,
  Sparkles,
  HelpCircle,
  BarChart3,
} from 'lucide-react';

interface AppLayoutProps {
  isClerkConfigured: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ isClerkConfigured }) => {
  const [activeView, setActiveView] = useState<WorkspaceView>('query');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  const {
    activeConnection,
    schema,
    isRefreshing: isRefreshingSchema,
    isModalOpen,
    setIsModalOpen,
    connectDatabase,
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

  const handleSelectTableQuestion = (question: string) => {
    setExternalPrompt(question);
    setActiveView('query');
  };

  const handleSelectSavedQuestion = (prompt: string) => {
    setExternalPrompt(prompt);
    setActiveView('query');
    executeQuestion(prompt);
  };

  const handleNewQuestion = () => {
    resetCurrentQuery();
    setExternalPrompt('');
    setActiveView('query');
  };

  const handleScrollToSql = () => {
    const el = document.getElementById('dataspeak-sql-preview');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoadDemoDb = async () => {
    await connectDatabase({
      name: 'Demo E-Commerce Database',
      dialect: 'sqlite',
      is_sample_db: true,
    });
  };

  const isBlocked = currentResult?.status === 'blocked';
  const isError = currentResult?.status === 'error';

  // Compute metric cards dynamically from real query results if available
  const dynamicMetrics = React.useMemo(() => {
    if (!currentResult || !currentResult.rows || currentResult.rows.length === 0) return [];

    const numCols = currentResult.columns.filter((c) => {
      const firstVal = currentResult.rows[0]?.[c];
      return typeof firstVal === 'number';
    });

    if (numCols.length === 0) return [];

    return numCols.slice(0, 3).map((col) => {
      const total = currentResult.rows.reduce((acc, row) => {
        const val = Number(row[col]) || 0;
        return acc + val;
      }, 0);

      const avg = total / currentResult.rows.length;
      const isMonetary =
        col.toLowerCase().includes('price') ||
        col.toLowerCase().includes('amount') ||
        col.toLowerCase().includes('revenue') ||
        col.toLowerCase().includes('mrr');

      return {
        label: `Total ${col.replace(/_/g, ' ')}`,
        value: isMonetary
          ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : total.toLocaleString(),
        subtext: `Avg: ${isMonetary ? '$' : ''}${avg.toFixed(1)} across ${currentResult.rows.length} rows`,
      };
    });
  }, [currentResult]);

  // Dynamic suggestions based on connected schema tables
  const dynamicSuggestions = React.useMemo(() => {
    if (!schema?.tables || schema.tables.length === 0) {
      return [
        'What are the top 5 products by revenue?',
        'Show average order value by category',
        'Top 10 customers with the most orders',
      ];
    }

    const tableNames = schema.tables.map((t) => t.name);
    return [
      `Show total record counts and summary of ${tableNames[0] || 'records'}`,
      `What are the top 10 rows in ${tableNames[1] || tableNames[0]} by most recent activity?`,
      `Count distribution across categories in ${tableNames[0]}`,
    ];
  }, [schema]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f5f4] text-[#0d0d0d] font-sans">
      {/* 1. Top Header */}
      <div className="md:pl-[264px]">
        <Header
          activeConnection={activeConnection}
          onOpenConnectModal={() => setIsModalOpen(true)}
          isClerkConfigured={isClerkConfigured}
          searchQuery={headerSearch}
          onSearchChange={setHeaderSearch}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
      </div>

      {/* 2. Left Sidebar (Fixed 264px) */}
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        onNewQuestion={handleNewQuestion}
        activeConnection={activeConnection}
        onSelectSavedQuestion={handleSelectSavedQuestion}
        onOpenConnectModal={() => setIsModalOpen(true)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        history={history}
      />

      {/* 3. Main Workspace Area */}
      <main className="md:pl-[264px] flex-1 px-4 sm:px-6 pb-20">
        {/* VIEW 1: Query & Explore */}
        {activeView === 'query' && (
          <div className="max-w-[840px] xl:max-w-[960px] mx-auto py-8 flex flex-col gap-6">
            {/* If NO Database is connected, show clear connection guide and features */}
            {!activeConnection ? (
              <div className="flex flex-col gap-8 py-4">
                {/* Hero Card: No Database Connected */}
                <div className="bg-white rounded-xl border border-[#dddddd] p-6 sm:p-8 shadow-2xs flex flex-col gap-5 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#efeeec] flex items-center justify-center text-[#615d59]">
                      <Database className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-[20px] font-bold text-[#0d0d0d] tracking-tight">
                        No Database Connected
                      </h2>
                      <p className="text-[14px] text-[#615d59]">
                        Connect your relational database to ask questions in plain English with strict read-only AST safety.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center gap-2 bg-[#0075de] hover:bg-[#005bab] text-white text-[14px] font-medium h-9 px-4 rounded-md transition-colors shadow-2xs cursor-pointer"
                    >
                      <Database className="h-4 w-4" />
                      <span>Connect Database</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadDemoDb}
                      className="inline-flex items-center gap-2 bg-[#efeeec] hover:bg-[#e6e6e6] text-[#0d0d0d] text-[14px] font-medium h-9 px-4 rounded-md border border-[#dddddd] transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4 text-[#0075de]" />
                      <span>Load Demo E-Commerce SQLite</span>
                    </button>
                  </div>
                </div>

                {/* Section: How to Connect */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <HelpCircle className="h-4 w-4 text-[#0075de]" />
                    <h3 className="font-semibold text-[15px] text-[#0d0d0d]">
                      How to Connect Your Database
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex flex-col gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#eaf3fc] text-[#0075de] font-bold text-[12px] flex items-center justify-center">
                        1
                      </div>
                      <h4 className="font-semibold text-[14px] text-[#0d0d0d]">Choose Engine</h4>
                      <p className="text-[12px] text-[#615d59] leading-relaxed">
                        Select PostgreSQL (Neon, Supabase, AWS RDS), MySQL 8.0, or local/demo SQLite.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex flex-col gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#eaf3fc] text-[#0075de] font-bold text-[12px] flex items-center justify-center">
                        2
                      </div>
                      <h4 className="font-semibold text-[14px] text-[#0d0d0d]">Enter URI / Auth</h4>
                      <p className="text-[12px] text-[#615d59] leading-relaxed">
                        Paste your connection string. Cloud SSL encryption is enforced automatically (<code className="font-mono text-[11px] bg-[#efeeec] px-1 py-0.5 rounded">sslmode=require</code>).
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex flex-col gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#eaf3fc] text-[#0075de] font-bold text-[12px] flex items-center justify-center">
                        3
                      </div>
                      <h4 className="font-semibold text-[14px] text-[#0d0d0d]">Reflect Schema</h4>
                      <p className="text-[12px] text-[#615d59] leading-relaxed">
                        DataSpeak inspects table schemas, primary keys, and foreign keys in under 50ms with zero changes.
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex flex-col gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#eaf3fc] text-[#0075de] font-bold text-[12px] flex items-center justify-center">
                        4
                      </div>
                      <h4 className="font-semibold text-[14px] text-[#0d0d0d]">Query Safely</h4>
                      <p className="text-[12px] text-[#615d59] leading-relaxed">
                        Ask any question in plain English. Get AST-verified read-only SQL, data tables, and charts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section: Features of this Project */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <Sparkles className="h-4 w-4 text-[#0075de]" />
                    <h3 className="font-semibold text-[15px] text-[#0d0d0d]">
                      Features & Architecture of DataSpeak
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Feature 1 */}
                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex items-start gap-3.5">
                      <div className="p-2 rounded-md bg-[#d9eddf] text-[#2c8c66] shrink-0 border border-[#2c8c66]/20">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-[14px] text-[#0d0d0d]">
                          Strict Read-Only AST Guardrails
                        </h4>
                        <p className="text-[12px] text-[#615d59] leading-relaxed">
                          All generated SQL queries undergo mandatory AST parsing via <code className="font-mono text-[11px] bg-[#efeeec] px-1 py-0.5 rounded">sqlglot</code>. Any mutation statement (INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE) is strictly blocked before reaching the database.
                        </p>
                      </div>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex items-start gap-3.5">
                      <div className="p-2 rounded-md bg-[#eaf3fc] text-[#0075de] shrink-0 border border-[#c9e0f6]">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-[14px] text-[#0d0d0d]">
                          Sub-Second LangGraph Agent Loop
                        </h4>
                        <p className="text-[12px] text-[#615d59] leading-relaxed">
                          Multi-step stateful workflow with schema injection, Groq ultra-fast Llama 3.3 70B inference, and automated 2-retry self-correction loop when syntax errors occur.
                        </p>
                      </div>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex items-start gap-3.5">
                      <div className="p-2 rounded-md bg-[#fdf0d0] text-[#f7a501] shrink-0 border border-[#f7a501]/30">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-[14px] text-[#0d0d0d]">
                          Automated Charts & AI Summaries
                        </h4>
                        <p className="text-[12px] text-[#615d59] leading-relaxed">
                          Heuristic chart selector automatically suggests and renders Recharts (Bar, Line, Pie) with a dedicated high-contrast palette, accompanied by plain-English executive summaries.
                        </p>
                      </div>
                    </div>

                    {/* Feature 4 */}
                    <div className="bg-white rounded-lg p-5 border border-[#e6e6e6] shadow-2xs flex items-start gap-3.5">
                      <div className="p-2 rounded-md bg-[#efeeec] text-[#31302e] shrink-0 border border-[#dddddd]">
                        <Server className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-[14px] text-[#0d0d0d]">
                          Multi-Cloud Engine Pooling
                        </h4>
                        <p className="text-[12px] text-[#615d59] leading-relaxed">
                          Async connection pooling using SQLAlchemy 2.0 with native drivers (<code className="font-mono text-[11px] bg-[#efeeec] px-1 py-0.5 rounded">asyncpg</code>, <code className="font-mono text-[11px] bg-[#efeeec] px-1 py-0.5 rounded">aiomysql</code>, <code className="font-mono text-[11px] bg-[#efeeec] px-1 py-0.5 rounded">aiosqlite</code>) for Neon, Supabase, and AWS RDS.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Prompt Box when Database is Connected */}
                <QueryInput
                  onSubmit={executeQuestion}
                  onCancel={cancelQuery}
                  isRunning={isRunning}
                  steps={steps}
                  activeConnection={activeConnection}
                  onOpenConnectModal={() => setIsModalOpen(true)}
                  externalPrompt={externalPrompt}
                  defaultSuggestions={dynamicSuggestions}
                />

                {/* Error Notice */}
                {queryError && (
                  <div className="rounded-lg bg-[#f7d6d3] border border-[#cd4239] p-4 text-[13px] text-[#86241d] shadow-2xs">
                    <strong>Error: </strong> {queryError}
                  </div>
                )}

                {/* Outcome Stack for Real Queries */}
                {currentResult && (
                  <>
                    {/* Blocked or Error State */}
                    {isBlocked ? (
                      <BlockedNotice
                        reason={currentResult.error_message}
                        blockedSql={currentResult.sql}
                        onEditQuestion={() => setExternalPrompt(currentQuestion)}
                      />
                    ) : isError ? (
                      <div className="rounded-lg bg-[#fdf0d0] border border-[#f7a501] p-5 shadow-2xs text-[14px]">
                        <h4 className="font-semibold text-[#6e4600] mb-1">Query execution issue</h4>
                        <p className="text-[#31302e] mb-3">
                          {currentResult.error_message || 'Database execution returned an error.'}
                        </p>
                        {currentResult.sql && (
                          <pre className="p-3 bg-[#23251d] text-white rounded font-mono text-[12px] overflow-x-auto">
                            {currentResult.sql}
                          </pre>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* 1. AI Summary Callout */}
                        {currentResult.summary && (
                          <InsightCard
                            summary={currentResult.summary}
                            rowCount={currentResult.rows?.length || currentResult.rowCount}
                            onViewSql={handleScrollToSql}
                          />
                        )}

                        {/* Automatic Row Limit Notice if >= 100 rows */}
                        {(currentResult.rowCount ?? 0) >= 100 && (
                          <CautionNotice
                            message="Default row limit (LIMIT 100) was applied by AST guardrails to safeguard database performance."
                          />
                        )}

                        {/* 2. Dynamically Computed Headline Metric Cards (if numeric cols exist) */}
                        {dynamicMetrics.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {dynamicMetrics.map((m, idx) => (
                              <MetricTile
                                key={idx}
                                label={m.label}
                                value={m.value}
                                subtext={m.subtext}
                              />
                            ))}
                          </div>
                        )}

                        {/* 3. Recharts Dynamic Visualizer */}
                        {currentResult.rows?.length > 0 &&
                          currentResult.columns?.length >= 2 &&
                          currentResult.chart?.type !== 'none' && (
                            <ChartViewer
                              config={currentResult.chart}
                              rows={currentResult.rows}
                              columns={currentResult.columns}
                              title={currentResult.chart?.title || `Query Visual Breakdown`}
                              subtitle="Generated based on query result columns"
                            />
                          )}

                        {/* 4. Results Table */}
                        {currentResult.rows?.length > 0 && (
                          <DataTable
                            columns={currentResult.columns}
                            rows={currentResult.rows}
                            questionPrompt={currentQuestion || externalPrompt}
                            executionTimeMs={currentResult.executionTimeMs}
                          />
                        )}

                        {/* 5. Generated SQL Preview */}
                        {currentResult.sql && (
                          <SqlPreview
                            sql={currentResult.sql}
                            dialect={activeConnection?.dialect || 'postgresql'}
                            isReadonlyVerified={true}
                            executionTimeMs={currentResult.executionTimeMs || 42}
                            modelName="Llama 3.3 70B via Groq"
                          />
                        )}
                      </>
                    )}
                  </>
                )}

                {/* When connected but no query run yet */}
                {!currentResult && !isRunning && (
                  <div className="bg-white rounded-xl border border-[#e6e6e6] p-8 text-center text-[#615d59] shadow-2xs flex flex-col items-center gap-3 my-4">
                    <div className="w-10 h-10 rounded-full bg-[#eaf3fc] flex items-center justify-center text-[#0075de]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-[16px] text-[#0d0d0d]">
                      Connected to {activeConnection.name}
                    </h3>
                    <p className="text-[13px] text-[#615d59] max-w-md">
                      Type your question in plain English above or pick a suggested query. All executions are strictly read-only and AST-verified.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* VIEW 2: Schema Explorer */}
        {activeView === 'schema' && (
          <SchemaExplorer
            schema={schema}
            activeConnection={activeConnection}
            isRefreshing={isRefreshingSchema}
            onRefresh={refreshSchema}
            onSelectTableQuestion={handleSelectTableQuestion}
            onOpenConnectModal={() => setIsModalOpen(true)}
          />
        )}

        {/* VIEW 3: Query History */}
        {activeView === 'history' && (
          <QueryHistory
            history={history}
            onSelectQuery={(item) => {
              selectHistoryItem(item);
              setActiveView('query');
            }}
            onToggleSave={toggleSaveHistory}
            onDelete={deleteHistoryItem}
            currentQuestion={currentQuestion}
          />
        )}
      </main>

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

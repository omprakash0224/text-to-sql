/**
 * DataSpeak — Query Execution & History Hook (useQueryExecution.ts)
 * Manages query execution lifecycle, realistic progress stepper transitions,
 * server-persisted query history with optimistic updates, legacy localStorage migration,
 * and HTTP 429 rate limit cooldown tracking.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { queryService, historyService } from '../services/api';
import type {
  QueryResult,
  QueryHistoryItem,
  QueryProgressStep,
  ProgressStepId,
} from '../types';

const INITIAL_STEPS: QueryProgressStep[] = [
  { id: 'reading_schema', label: 'Reading your database schema', status: 'pending' },
  { id: 'generating_sql', label: 'Writing the query', status: 'pending' },
  { id: 'validating_guardrails', label: 'Checking it is read-only (AST guardrails)', status: 'pending' },
  { id: 'executing_query', label: 'Running on database safely', status: 'pending' },
  { id: 'summarizing', label: 'Summarizing key takeaways', status: 'pending' },
];

const LOCAL_STORAGE_HISTORY_KEY = 'dataspeak_query_history_v1';

export function useQueryExecution() {
  const [currentResult, setCurrentResult] = useState<QueryResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [steps, setSteps] = useState<QueryProgressStep[]>(INITIAL_STEPS);
  const [activeStepId, setActiveStepId] = useState<ProgressStepId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRefs = useRef<number[]>([]);
  const cooldownTimerRef = useRef<number | null>(null);
  const hasMigratedRef = useRef(false);
  // Throttle history fetches: track the last time we actually fired a request
  // so rapid concurrent callers (query completions, migrations) coalesce.
  const lastLoadHistoryAt = useRef<number>(0);
  const loadHistoryThrottleMs = 3000; // minimum 3s between real fetches


  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach((id) => clearTimeout(id));
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  const clearTimers = () => {
    timerRefs.current.forEach((id) => clearTimeout(id));
    timerRefs.current = [];
  };

  // ── Rate Limit 429 Event Listener & Countdown ─────────────────────────────
  useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent<{ retryAfter?: number; message?: string }>;
      const retrySec = customEvent.detail?.retryAfter || 60;
      setRateLimitCooldown(retrySec);

      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }

      cooldownTimerRef.current = window.setInterval(() => {
        setRateLimitCooldown((prev) => {
          if (prev === null || prev <= 1) {
            if (cooldownTimerRef.current) {
              clearInterval(cooldownTimerRef.current);
              cooldownTimerRef.current = null;
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    };

    window.addEventListener('dataspeak:ratelimit', handleRateLimit);
    return () => {
      window.removeEventListener('dataspeak:ratelimit', handleRateLimit);
    };
  }, []);

  // ── Fetch Server Query History ────────────────────────────────────────────
  const loadHistory = useCallback(
    async (params?: { q?: string; saved_only?: boolean }) => {
      // Throttle: skip background auto-refreshes that happen too frequently.
      // User-triggered searches (params.q set) always bypass this guard.
      const now = Date.now();
      const isUserSearch = typeof params?.q === 'string' && params.q.length > 0;
      if (!isUserSearch && now - lastLoadHistoryAt.current < loadHistoryThrottleMs) {
        return;
      }
      lastLoadHistoryAt.current = now;

      try {
        setIsHistoryLoading(true);

        const res = await historyService.list({ ...params, limit: 100 });
        setHistory((prevHistory) => {
          return res.items.map((serverItem) => {
            const existing = prevHistory.find(
              (h) => h.id === serverItem.id || h.question === serverItem.question
            );
            return {
              ...serverItem,
              isSaved: Boolean(serverItem.is_saved ?? serverItem.isSaved),
              timestamp: serverItem.created_at || serverItem.timestamp || new Date().toISOString(),
              result:
                existing?.result ||
                serverItem.result ||
                (serverItem.sql
                  ? {
                      sql: serverItem.sql,
                      columns: [],
                      rows: [],
                      rowCount: serverItem.row_count,
                      row_count: serverItem.row_count,
                      executionTimeMs: serverItem.execution_time_ms,
                      execution_time_ms: serverItem.execution_time_ms,
                      chart: serverItem.chart_config,
                      summary: serverItem.summary,
                      status: serverItem.status || 'success',
                      error_message: serverItem.error_message,
                    }
                  : undefined),
            };
          });
        });
      } catch (err) {
        console.warn('Failed to load server query history:', err);
      } finally {
        setIsHistoryLoading(false);
      }
    },
    []
  );

  // ── One-Time Legacy localStorage Migration & Initial Load ─────────────────
  useEffect(() => {
    if (hasMigratedRef.current) return;
    hasMigratedRef.current = true;

    const initHistory = async () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.info(`Migrating ${parsed.length} local queries to server...`);
              await historyService.importLocal(parsed);
              localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
              localStorage.setItem('dataspeak_query_history_migrated_v1', 'true');
            }
          } catch (parseErr) {
            console.warn('Corrupt localStorage history, skipping migration:', parseErr);
            localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
          }
        }
      } catch (importErr) {
        console.warn('Failed to import localStorage queries to server:', importErr);
      }

      await loadHistory();
    };

    initHistory();
  }, [loadHistory]);

  // ── Execute Natural Language Query ────────────────────────────────────────
  const executeQuestion = useCallback(
    async (question: string): Promise<QueryResult | null> => {
      if (!question.trim()) return null;

      setIsRunning(true);
      setError(null);
      setCurrentQuestion(question);
      clearTimers();

      // Reset steps
      setSteps(
        INITIAL_STEPS.map((s, idx) => ({
          ...s,
          status: idx === 0 ? 'active' : 'pending',
        }))
      );
      setActiveStepId('reading_schema');

      // Animate progress steps while backend works
      const stepProgression: { id: ProgressStepId; delay: number }[] = [
        { id: 'generating_sql', delay: 400 },
        { id: 'validating_guardrails', delay: 900 },
        { id: 'executing_query', delay: 1400 },
        { id: 'summarizing', delay: 1800 },
      ];

      stepProgression.forEach(({ id, delay }) => {
        const timerId = window.setTimeout(() => {
          setActiveStepId(id);
          setSteps((prev) =>
            prev.map((step) => {
              if (step.id === id) return { ...step, status: 'active' };
              const prevIdx = INITIAL_STEPS.findIndex((s) => s.id === step.id);
              const curIdx = INITIAL_STEPS.findIndex((s) => s.id === id);
              if (prevIdx < curIdx) return { ...step, status: 'completed' };
              return step;
            })
          );
        }, delay);
        timerRefs.current.push(timerId);
      });

      try {
        const result = await queryService.ask(question);
        clearTimers();

        // Mark all steps completed unless blocked
        if (result.status === 'blocked') {
          setSteps((prev) =>
            prev.map((step) =>
              step.id === 'validating_guardrails'
                ? { ...step, status: 'blocked' }
                : step.id === 'reading_schema' || step.id === 'generating_sql'
                ? { ...step, status: 'completed' }
                : { ...step, status: 'pending' }
            )
          );
        } else {
          setSteps((prev) => prev.map((step) => ({ ...step, status: 'completed' })));
        }

        setCurrentResult(result);

        // Optimistically insert to local list with full result object
        const tempId = `temp-${Date.now()}`;
        const newHistoryItem: QueryHistoryItem = {
          id: tempId,
          question,
          sql: result.sql,
          status: result.status,
          execution_time_ms: result.executionTimeMs ?? result.execution_time_ms,
          row_count: result.rowCount ?? result.row_count ?? result.rows?.length,
          chart_config: result.chart,
          summary: result.summary,
          error_message: result.error_message,
          created_at: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          result,
          isSaved: false,
          is_saved: false,
        };
        setHistory((prev) => [newHistoryItem, ...prev.filter((item) => item.question !== question)]);

        // Reload server history so server-generated ID replaces tempId
        loadHistory().catch((err) => console.warn('History background reload failed:', err));

        return result;
      } catch (err: unknown) {
        clearTimers();
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Query execution failed.'
            : 'Failed to process natural language query.';
        setError(msg);

        // Refresh history even on error, since backend records failed queries too
        loadHistory().catch(() => {});
        return null;
      } finally {
        setIsRunning(false);
        setActiveStepId(null);
      }
    },
    [loadHistory]
  );

  const cancelQuery = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    clearTimers();
    setIsRunning(false);
    setActiveStepId(null);
    setSteps(INITIAL_STEPS);
  }, []);

  // ── Star / Bookmark Toggle with Optimistic UI ─────────────────────────────
  const toggleSaveHistory = useCallback(
    async (id: string) => {
      // Optimistic update
      setHistory((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const nextVal = !(item.is_saved ?? item.isSaved);
            return { ...item, isSaved: nextVal, is_saved: nextVal };
          }
          return item;
        })
      );

      try {
        const updated = await historyService.toggleSave(id);
        setHistory((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, isSaved: updated.is_saved, is_saved: updated.is_saved }
              : item
          )
        );
      } catch (err) {
        console.error('Failed to toggle save on server:', err);
        // Rollback on error
        await loadHistory();
      }
    },
    [loadHistory]
  );

  // ── Delete Single History Item with Optimistic UI ─────────────────────────
  const deleteHistoryItem = useCallback(
    async (id: string) => {
      const prevItems = history;
      setHistory((prev) => prev.filter((item) => item.id !== id));

      try {
        await historyService.delete(id);
      } catch (err) {
        console.error('Failed to delete query history item on server:', err);
        setHistory(prevItems);
      }
    },
    [history]
  );

  // ── Clear Recent Unsaved History with Optimistic UI ───────────────────────
  const clearRecentHistory = useCallback(async () => {
    const prevItems = history;
    setHistory((prev) => prev.filter((item) => item.is_saved || item.isSaved));

    try {
      await historyService.clearRecent();
    } catch (err) {
      console.error('Failed to clear recent query history on server:', err);
      setHistory(prevItems);
    }
  }, [history]);

  // ── Select Query from History ─────────────────────────────────────────────
  const selectHistoryItem = useCallback((item: QueryHistoryItem) => {
    setCurrentQuestion(item.question);
    if (item.result) {
      setCurrentResult(item.result);
    } else {
      setCurrentResult({
        sql: item.sql || '',
        columns: [],
        rows: [],
        rowCount: item.row_count,
        row_count: item.row_count,
        executionTimeMs: item.execution_time_ms,
        execution_time_ms: item.execution_time_ms,
        chart: item.chart_config,
        summary: item.summary,
        status: item.status || 'success',
        error_message: item.error_message,
      });
    }
    setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: 'completed' })));
  }, []);

  const resetCurrentQuery = useCallback(() => {
    setCurrentResult(null);
    setCurrentQuestion('');
    setSteps(INITIAL_STEPS);
    setError(null);
  }, []);

  return {
    currentResult,
    currentQuestion,
    isRunning,
    steps,
    activeStepId,
    error,
    history,
    isHistoryLoading,
    rateLimitCooldown,
    executeQuestion,
    cancelQuery,
    toggleSaveHistory,
    deleteHistoryItem,
    clearRecentHistory,
    selectHistoryItem,
    resetCurrentQuery,
    setCurrentResult,
    loadHistory,
  };
}

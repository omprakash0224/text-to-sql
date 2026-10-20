/**
 * DataSpeak — Query Execution & History Hook
 * Manages query execution lifecycle, realistic progress stepper transitions,
 * and persistent query history.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { queryService } from '../services/api';
import type { QueryResult, QueryHistoryItem, QueryProgressStep, ProgressStepId } from '../types';

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
  const [history, setHistory] = useState<QueryHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRefs = useRef<number[]>([]);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
    } catch (e) {
      console.warn('Could not save query history to localStorage:', e);
    }
  }, [history]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      timerRefs.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const clearTimers = () => {
    timerRefs.current.forEach((id) => clearTimeout(id));
    timerRefs.current = [];
  };

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

        // Add to history
        const newHistoryItem: QueryHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          question,
          timestamp: new Date().toISOString(),
          result,
          isSaved: false,
        };
        setHistory((prev) => [newHistoryItem, ...prev.filter((item) => item.question !== question)]);

        return result;
      } catch (err: unknown) {
        clearTimers();
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Query execution failed.'
            : 'Failed to process natural language query.';
        setError(msg);
        return null;
      } finally {
        setIsRunning(false);
        setActiveStepId(null);
      }
    },
    []
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

  const toggleSaveHistory = useCallback((id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSaved: !item.isSaved } : item))
    );
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const selectHistoryItem = useCallback((item: QueryHistoryItem) => {
    setCurrentQuestion(item.question);
    setCurrentResult(item.result);
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
    executeQuestion,
    cancelQuery,
    toggleSaveHistory,
    deleteHistoryItem,
    selectHistoryItem,
    resetCurrentQuery,
    setCurrentResult,
  };
}

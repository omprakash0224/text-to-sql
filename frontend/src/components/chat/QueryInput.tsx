/**
 * DataSpeak — PostHog Conversational Prompt Box (QueryInput.tsx)
 * White card on warm cream canvas with PostHog yellow CTA submit button,
 * suggestion chips, and pastel blue progress stepper during query execution.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Sparkles,
  Database,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import type { QueryProgressStep, DatabaseConnection } from '../../types';

interface QueryInputProps {
  onSubmit: (question: string) => void;
  onCancel: () => void;
  isRunning: boolean;
  steps: QueryProgressStep[];
  activeConnection: DatabaseConnection | null;
  onOpenConnectModal: () => void;
  externalPrompt?: string;
}

const DEFAULT_SUGGESTIONS = [
  'What are the top 5 products by revenue?',
  'Show total sales revenue by category',
  'Who are the top 10 customers with the most orders?',
  'What is the monthly revenue trend over time?',
];

export const QueryInput: React.FC<QueryInputProps> = ({
  onSubmit,
  onCancel,
  isRunning,
  steps,
  activeConnection,
  onOpenConnectModal,
  externalPrompt,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync external prompt when user clicks a suggestion chip or schema table
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [externalPrompt]);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 52), 180)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isRunning) return;
    if (!activeConnection) {
      onOpenConnectModal();
      return;
    }
    onSubmit(prompt.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-3">
      {/* PostHog Pastel Blue Stepper Banner during Query Execution */}
      {isRunning && (
        <div className="rounded-md bg-[#dceaf6] border border-[#2c84e0]/30 p-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold text-[#1d4ed8]">
            <span className="text-sm">⚡</span>
            <span>Orchestrating Text-to-SQL with Groq Llama 3.3 70B & AST Guardrails...</span>
          </div>

          <div className="space-y-2">
            {steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              const isBlocked = step.status === 'blocked';

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 text-xs transition-colors ${
                    isBlocked
                      ? 'text-[#cd4239] font-bold'
                      : isCompleted
                      ? 'text-[#33342d]'
                      : isActive
                      ? 'text-[#1d4ed8] font-bold'
                      : 'text-[#6c6e63]'
                  }`}
                >
                  {isBlocked ? (
                    <ShieldAlert className="h-4 w-4 text-[#cd4239] shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        step.id === 'validating_guardrails' ? 'text-[#2c8c66]' : 'text-[#4d4f46]'
                      }`}
                    />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-[#1d4ed8] animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-[#bfc1b7] shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Prompt Input Box (White Card on Cream) */}
      <div
        className={`relative rounded-md bg-white border transition-all ${
          isFocused
            ? 'border-[#23251d] ring-2 ring-[#3b82f6]/40'
            : 'border-[#bfc1b7] hover:border-[#23251d]'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={isRunning}
          rows={2}
          placeholder={
            activeConnection
              ? `Ask anything about ${activeConnection.name}...`
              : 'Connect a database first to start querying in plain English...'
          }
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-sm text-[#23251d] placeholder-[#6c6e63] resize-none focus:outline-none leading-relaxed disabled:opacity-60"
        />

        {/* Input Footer Row */}
        <div className="px-4 py-2.5 flex items-center justify-between border-t border-[#dcdfd2] text-xs bg-[#fcfcfa] rounded-b-md">
          {/* Database Chip Selector */}
          <div className="flex items-center gap-2">
            {activeConnection ? (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#eeefe9] hover:bg-[#dcdfd2] text-[#23251d] font-semibold transition-colors cursor-pointer border border-[#bfc1b7]"
                title="Change or reconnect database"
              >
                <Database className="h-3 w-3 text-[#1078a3]" />
                <span className="truncate max-w-[150px] font-mono text-[11px]">{activeConnection.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#dceaf6] hover:bg-[#c3e0fa] text-[#1d4ed8] font-bold transition-colors"
              >
                <Database className="h-3 w-3" />
                <span>Connect Database</span>
              </button>
            )}

            <span className="hidden sm:inline text-[11px] text-[#6c6e63]">
              ↵ to ask · ⇧↵ new line
            </span>
          </div>

          {/* Submit / Cancel Action Button (PostHog Yellow CTA) */}
          <div>
            {isRunning ? (
              <button
                type="button"
                onClick={onCancel}
                className="h-8 w-8 rounded-md bg-[#e5e7e0] hover:bg-[#f7d6d3] text-[#cd4239] flex items-center justify-center transition-colors"
                title="Cancel query execution"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                className="h-9 w-9 rounded-full bg-[#f7a501] hover:bg-[#dd9001] active:bg-[#b17816] disabled:bg-[#e5e7e0] disabled:text-[#9b9c92] text-[#23251d] flex items-center justify-center transition-all disabled:opacity-50 font-bold"
                title="Ask question"
              >
                <ArrowUp className="h-4 w-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Chips (PostHog Pill-Tabs) */}
      {!isRunning && (
        <div className="flex items-center flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6c6e63] uppercase tracking-wider pl-1">
            <Sparkles className="h-3 w-3 text-[#f7a501]" /> Suggestions:
          </span>
          {DEFAULT_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSelectSuggestion(sug)}
              className="px-3 py-1 text-xs rounded-full bg-white hover:bg-[#eeefe9] border border-[#bfc1b7] text-[#23251d] hover:border-[#23251d] transition-colors truncate max-w-full text-left font-medium"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

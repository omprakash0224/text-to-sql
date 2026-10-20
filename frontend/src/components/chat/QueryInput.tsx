/**
 * DataSpeak — Conversational Prompt Box (QueryInput.tsx)
 * Notion / Linear inspired input craft with auto-growing textarea, suggestion chips,
 * and animated multi-step progress stepper during query execution.
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
      {/* Dynamic Progress Stepper during Query Execution */}
      {isRunning && (
        <div className="rounded-xl bg-white border border-[#c9e0f6] p-4 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-[#0075de]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing your question with AI & AST guardrails...</span>
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
                      ? 'text-[#cd4239] font-medium'
                      : isCompleted
                      ? 'text-[#31302e]'
                      : isActive
                      ? 'text-[#0075de] font-semibold'
                      : 'text-[#a39e98]'
                  }`}
                >
                  {isBlocked ? (
                    <ShieldAlert className="h-4 w-4 text-[#cd4239] shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        step.id === 'validating_guardrails' ? 'text-[#2c8c66]' : 'text-[#615d59]'
                      }`}
                    />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-[#0075de] animate-spin shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-[#dddddd] shrink-0" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Prompt Input Box */}
      <div
        className={`relative rounded-2xl bg-white border transition-all ${
          isFocused
            ? 'border-[#0075de] ring-2 ring-[#0075de]/25 shadow-sm'
            : 'border-[#dddddd] hover:border-[#a39e98] shadow-xs'
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
              ? `Ask a question about ${activeConnection.name || 'your database'}...`
              : 'Connect a database first to start querying in plain English...'
          }
          className="w-full px-5 pt-4 pb-2 bg-transparent text-sm text-[#0d0d0d] placeholder-[#a39e98] resize-none focus:outline-none leading-relaxed disabled:opacity-60"
        />

        {/* Input Footer Row */}
        <div className="px-4 py-2.5 flex items-center justify-between border-t border-[#eeeeec]/70 text-xs">
          {/* Database Chip Selector */}
          <div className="flex items-center gap-2">
            {activeConnection ? (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#efeeec] hover:bg-[#dddddd] text-[#31302e] font-medium transition-colors cursor-pointer"
                title="Change or reconnect database"
              >
                <Database className="h-3 w-3 text-[#0075de]" />
                <span className="truncate max-w-[160px] font-mono text-[11px]">{activeConnection.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#eaf3fc] hover:bg-[#c9e0f6] text-[#0075de] font-semibold transition-colors"
              >
                <Database className="h-3 w-3" />
                <span>Connect Database</span>
              </button>
            )}

            <span className="hidden sm:inline text-[11px] text-[#a39e98]">
              ↵ to ask · ⇧↵ new line
            </span>
          </div>

          {/* Submit / Cancel Action Button */}
          <div>
            {isRunning ? (
              <button
                type="button"
                onClick={onCancel}
                className="h-9 w-9 rounded-full bg-[#efeeec] hover:bg-[#f7d6d3] text-[#cd4239] flex items-center justify-center transition-colors"
                title="Cancel query execution"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                className="h-9 w-9 rounded-full bg-[#0075de] hover:bg-[#005bab] disabled:bg-[#efeeec] disabled:text-[#a39e98] text-white flex items-center justify-center transition-all shadow-xs disabled:shadow-none"
                title="Ask question"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      {!isRunning && (
        <div className="flex items-center flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#615d59] uppercase tracking-wider pl-1">
            <Sparkles className="h-3 w-3 text-[#0075de]" /> Suggestions:
          </span>
          {DEFAULT_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSelectSuggestion(sug)}
              className="px-3 py-1 text-xs rounded-full bg-white hover:bg-[#f8fafc] border border-[#e6e6e6] text-[#31302e] hover:border-[#0075de]/40 hover:text-[#0075de] transition-colors truncate max-w-full text-left"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

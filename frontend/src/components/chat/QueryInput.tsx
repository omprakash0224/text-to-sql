/**
 * DataSpeak — Conversational Prompt Box (QueryInput.tsx)
 * Framed-sheet style: Auto-growing textarea, suggestion chips,
 * and animated progress stepper with strict anti-slop rules.
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
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 160)}px`;
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
    <div className="w-full max-w-3xl mx-auto space-y-2.5">
      {/* Dynamic Progress Stepper during Query Execution */}
      {isRunning && (
        <div className="rounded-lg bg-white border border-[#e2e4e8] p-3.5">
          <div className="flex items-center gap-2 mb-2.5 text-xs font-medium text-[#1b6c80]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Analyzing schema and generating SQL...</span>
          </div>

          <div className="space-y-1.5">
            {steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              const isBlocked = step.status === 'blocked';

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 text-xs transition-colors ${
                    isBlocked
                      ? 'text-[#c4242a] font-medium'
                      : isCompleted
                      ? 'text-[#131416]'
                      : isActive
                      ? 'text-[#1b6c80] font-medium'
                      : 'text-[#5d5f60]'
                  }`}
                >
                  {isBlocked ? (
                    <ShieldAlert className="h-3.5 w-3.5 text-[#c4242a] shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle2
                      className={`h-3.5 w-3.5 shrink-0 ${
                        step.id === 'validating_guardrails' ? 'text-[#1e7b4f]' : 'text-[#5d5f60]'
                      }`}
                    />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 text-[#1b6c80] animate-spin shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-[#cdced1] shrink-0" />
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
        className={`relative rounded-xl bg-white border transition-colors ${
          isFocused ? 'border-[#1b6c80] ring-1 ring-[#1b6c80]' : 'border-[#e2e4e8] hover:border-[#cdced1]'
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
              ? `Ask a question about ${activeConnection.name}...`
              : 'Connect a database first to start asking questions in plain English...'
          }
          className="w-full px-4 pt-3.5 pb-2 bg-transparent text-xs sm:text-sm text-[#131416] placeholder-[#5d5f60] resize-none focus:outline-none leading-relaxed disabled:opacity-60"
        />

        {/* Input Footer Row */}
        <div className="px-3.5 py-2 flex items-center justify-between border-t border-[#eceef0] text-xs">
          {/* Database Chip Selector */}
          <div className="flex items-center gap-2">
            {activeConnection ? (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#f7f8fa] hover:bg-[#ebedee] border border-[#e2e4e8] text-[#131416] text-xs transition-colors cursor-pointer"
                title="Change or reconnect database"
              >
                <Database className="h-3 w-3 text-[#1b6c80]" />
                <span className="truncate max-w-[160px]">{activeConnection.name}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenConnectModal}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#ebedee] hover:bg-[#e2e4e8] text-[#131416] font-medium transition-colors"
              >
                <Database className="h-3 w-3 text-[#1b6c80]" />
                <span>Connect Database</span>
              </button>
            )}

            <span className="hidden sm:inline text-[11px] text-[#5d5f60]">
              Enter to ask · Shift+Enter new line
            </span>
          </div>

          {/* Submit / Cancel Action Button */}
          <div>
            {isRunning ? (
              <button
                type="button"
                onClick={onCancel}
                className="h-7 w-7 rounded-md bg-[#ffedea] hover:bg-[#fde68a] text-[#c4242a] flex items-center justify-center transition-colors"
                title="Cancel query execution"
              >
                <Square className="h-3 w-3 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                className="h-7 w-7 rounded-md bg-[#131416] hover:bg-[#222428] disabled:bg-[#ebedee] disabled:text-[#5d5f60] text-white flex items-center justify-center transition-colors"
                title="Ask question"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Chips */}
      {!isRunning && (
        <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
          <span className="inline-flex items-center gap-1 text-xs text-[#5d5f60] pr-1">
            <Sparkles className="h-3 w-3 text-[#1b6c80]" /> Suggestions:
          </span>
          {DEFAULT_SUGGESTIONS.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSelectSuggestion(sug)}
              className="px-2.5 py-0.5 text-xs rounded-md bg-[#f7f8fa] hover:bg-white border border-[#e2e4e8] hover:border-[#1b6c80] text-[#131416] transition-colors truncate max-w-full text-left"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

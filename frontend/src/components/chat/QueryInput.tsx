/**
 * DataSpeak — Conversational Prompt Box (QueryInput.tsx)
 * Calm Analytics Workspace (docs/ui-example/code1.html)
 * Hero / Linear-inspired craft:
 * Crisp white card, subtle hairline border, auto-expanding textarea,
 * bottom bar with active DB pill, keyboard helper, and blue circular arrow button.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
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
  defaultSuggestions?: string[];
}

const FALLBACK_SUGGESTIONS = [
  'Top 10 churning customers',
  'Average order value by category',
  'Quarterly sales pipeline by rep',
];

export const QueryInput: React.FC<QueryInputProps> = ({
  onSubmit,
  onCancel,
  isRunning,
  steps,
  activeConnection,
  onOpenConnectModal,
  externalPrompt,
  defaultSuggestions = FALLBACK_SUGGESTIONS,
}) => {
  const [prompt, setPrompt] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync external prompt when user clicks a suggestion chip or schema table
  useEffect(() => {
    if (externalPrompt !== undefined && externalPrompt !== null) {
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
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 48), 200)}px`;
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

  const dbLabel = activeConnection ? activeConnection.name : 'No Database Connected';

  return (
    <section className="w-full flex flex-col gap-2.5">
      {/* Execution Progress Stepper */}
      {isRunning && (
        <div className="bg-[#eaf3fc] border border-[#c9e0f6] rounded-lg p-4 sm:p-5 shadow-2xs animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-2 mb-3 text-[13px] font-semibold text-[#005bab]">
            <Loader2 className="h-4 w-4 animate-spin text-[#0075de]" />
            <span>Generating SQL with Llama 3.3 70B &amp; AST Guardrails...</span>
          </div>

          <div className="space-y-2">
            {steps.map((step) => {
              const isCompleted = step.status === 'completed';
              const isActive = step.status === 'active';
              const isBlocked = step.status === 'blocked';

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-2.5 text-[12px] sm:text-[13px] transition-colors ${
                    isBlocked
                      ? 'text-[#cd4239] font-semibold'
                      : isCompleted
                      ? 'text-[#31302e]'
                      : isActive
                      ? 'text-[#005bab] font-semibold'
                      : 'text-[#a39e98]'
                  }`}
                >
                  {isBlocked ? (
                    <ShieldAlert className="h-4 w-4 text-[#cd4239] shrink-0" />
                  ) : isCompleted ? (
                    <CheckCircle2
                      className={`h-4 w-4 shrink-0 ${
                        step.id === 'validating_guardrails' ? 'text-[#2c8c66]' : 'text-[#0075de]'
                      }`}
                    />
                  ) : isActive ? (
                    <Loader2 className="h-4 w-4 text-[#0075de] animate-spin shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-[#dddddd] shrink-0 ml-0.5" />
                  )}
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Prompt Card */}
      <div className="bg-white rounded-xl border border-[#dddddd] p-4 sm:p-5 shadow-2xs focus-within:border-[#0075de] focus-within:ring-2 focus-within:ring-[#0075de]/20 transition-all">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          rows={2}
          id="prompt-input"
          placeholder="Ask anything about your database in plain English..."
          className="w-full bg-transparent resize-none border-0 p-0 text-[#0d0d0d] text-[16px] sm:text-[17px] leading-relaxed placeholder:text-[#a39e98] focus:ring-0 focus:outline-none"
        />

        <div className="flex items-center justify-between pt-3 border-t border-[#eeeeec] mt-1">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenConnectModal}
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-semibold tnum transition-colors cursor-pointer ${
                activeConnection
                  ? 'bg-[#efeeec] hover:bg-[#e6e6e6] text-[#31302e]'
                  : 'bg-[#fff5e5] hover:bg-[#faebd0] text-[#a36900] border border-[#f7a501]/30'
              }`}
              title={activeConnection ? 'Click to switch database' : 'Click to connect a database'}
            >
              <Database className="h-3 w-3" />
              <span>{dbLabel}</span>
            </button>
            <span className="text-[12px] text-[#a39e98] hidden sm:inline">
              ↵ to ask · ⇧ ↵ new line
            </span>
          </div>

          <div>
            {isRunning ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-9 h-9 rounded-full bg-[#f7d6d3] hover:bg-[#f3bcba] text-[#cd4239] flex items-center justify-center transition-colors shadow-2xs"
                title="Cancel query execution"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim()}
                className="w-9 h-9 rounded-full bg-[#0075de] hover:bg-[#005bab] active:scale-95 disabled:bg-[#efeeec] disabled:text-[#a39e98] text-white flex items-center justify-center transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                title="Ask question"
              >
                <ArrowUp className="h-4.5 w-4.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestion Chips Below Prompt */}
      {!isRunning && (
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 text-[13px] no-scrollbar">
          <span className="text-[#615d59] text-[12px] font-medium shrink-0">
            Try asking:
          </span>
          {defaultSuggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => handleSelectSuggestion(sug)}
              className="shrink-0 px-3 py-1 bg-white hover:bg-[#f8fafc] text-[#31302e] hover:text-[#0d0d0d] text-[13px] rounded-full border border-[#e6e6e6] transition-colors shadow-2xs cursor-pointer"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

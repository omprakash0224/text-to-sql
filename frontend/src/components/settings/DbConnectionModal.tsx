/**
 * DataSpeak — Database Connection Modal (DbConnectionModal.tsx)
 * Calm Analytics Workspace (docs/ui-example/code.html)
 * Features Engine Selector tabs (PostgreSQL, MySQL 8.0, SQLite / Turso),
 * one-click cloud provider chips (Neon Cloud, Supabase, AWS RDS),
 * connection URI with show/hide password toggle, SSL enforcement verification,
 * and test latency + schema reflection triggers.
 */

import React, { useState } from 'react';
import {
  X,
  Database,
  Lock,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { connectionService } from '../../services/api';
import type { ConnectionParams, ConnectionTestResponse, DatabaseDialect } from '../../types';

interface DbConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (params: ConnectionParams) => Promise<void>;
}

export const DbConnectionModal: React.FC<DbConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [selectedEngine, setSelectedEngine] = useState<DatabaseDialect>('postgresql');
  const [connectionUri, setConnectionUri] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isDemoSqlite, setIsDemoSqlite] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectEngine = (engine: DatabaseDialect) => {
    setSelectedEngine(engine);
    setIsDemoSqlite(false);
    setTestResult(null);
    setErrorMessage(null);
  };

  const handleSelectProviderPreset = (provider: 'neon' | 'supabase' | 'rds' | 'sample') => {
    setSelectedEngine(provider === 'sample' ? 'sqlite' : 'postgresql');
    setIsDemoSqlite(provider === 'sample');
    setTestResult(null);
    setErrorMessage(null);

    if (provider === 'neon') {
      setName('Neon Cloud Postgres');
      setConnectionUri('postgresql://<user>:<password>@<ep-endpoint>.us-east-2.aws.neon.tech/neondb?sslmode=require');
    } else if (provider === 'supabase') {
      setName('Supabase DB (Pooled)');
      setConnectionUri('postgresql://postgres.<project-ref>:<password>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require');
    } else if (provider === 'rds') {
      setName('AWS RDS PostgreSQL');
      setConnectionUri('postgresql://<user>:<password>@<rds-instance>.us-east-1.rds.amazonaws.com:5432/<dbname>?sslmode=require');
    } else if (provider === 'sample') {
      setName('Demo E-Commerce Database');
      setConnectionUri('sqlite:///ecommerce.db');
    }
  };

  const buildPayload = (): ConnectionParams => {
    if (isDemoSqlite) {
      return {
        name,
        dialect: 'sqlite',
        is_sample_db: true,
      };
    }

    return {
      name: name.trim() || `${selectedEngine} Database`,
      dialect: selectedEngine,
      connection_string: connectionUri.trim(),
      ssl: true,
    };
  };

  const handleTestLatency = async () => {
    setIsTesting(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const payload = buildPayload();
      const res = await connectionService.test(payload);
      setTestResult(res);
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message:
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Connection test failed.'
            : 'Unable to connect to database.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = buildPayload();
      await onConnected(payload);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to connect and index database schema.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d0d0d]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in-50 duration-150">
      <div className="w-full max-w-lg rounded-lg bg-white border border-[#dddddd] p-6 shadow-xl flex flex-col gap-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#e6e6e6]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#eaf3fc] border border-[#c9e0f6] flex items-center justify-center text-[#0075de]">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-semibold text-[16px] text-[#0d0d0d]">
                Add / Switch Database Connection
              </h3>
              <span className="text-[11px] text-[#615d59] uppercase tracking-wider font-medium">
                AST Read-Only Guardrails Enforced
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#615d59] hover:text-[#0d0d0d] p-1 rounded hover:bg-[#efeeec] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Engine Selector Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-md bg-[#efeeec] border border-[#e6e6e6]">
          <button
            type="button"
            onClick={() => handleSelectEngine('postgresql')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-[13px] transition-all cursor-pointer ${
              selectedEngine === 'postgresql' && !isDemoSqlite
                ? 'bg-white text-[#0d0d0d] font-semibold shadow-2xs border border-[#e6e6e6]'
                : 'text-[#31302e] hover:text-[#0d0d0d]'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-[#0075de]" />
            <span>PostgreSQL</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectEngine('mysql')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-[13px] transition-all cursor-pointer ${
              selectedEngine === 'mysql'
                ? 'bg-white text-[#0d0d0d] font-semibold shadow-2xs border border-[#e6e6e6]'
                : 'text-[#31302e] hover:text-[#0d0d0d]'
            }`}
          >
            <Server className="h-3.5 w-3.5 text-[#f7a501]" />
            <span>MySQL 8.0</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectEngine('sqlite')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-[13px] transition-all cursor-pointer ${
              selectedEngine === 'sqlite' || isDemoSqlite
                ? 'bg-white text-[#0d0d0d] font-semibold shadow-2xs border border-[#e6e6e6]'
                : 'text-[#31302e] hover:text-[#0d0d0d]'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-[#2a9d99]" />
            <span>SQLite / Turso</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Supported Providers Chips */}
          <div className="flex items-center gap-2 text-[12px] flex-wrap">
            <span className="text-[#615d59]">Supported Providers:</span>
            <button
              type="button"
              onClick={() => handleSelectProviderPreset('neon')}
              className="px-2 py-0.5 rounded bg-[#efeeec] hover:bg-[#e6e6e6] border border-[#e6e6e6] text-[#0d0d0d] font-mono text-[11px] cursor-pointer"
            >
              Neon Cloud
            </button>
            <button
              type="button"
              onClick={() => handleSelectProviderPreset('supabase')}
              className="px-2 py-0.5 rounded bg-[#efeeec] hover:bg-[#e6e6e6] border border-[#e6e6e6] text-[#0d0d0d] font-mono text-[11px] cursor-pointer"
            >
              Supabase
            </button>
            <button
              type="button"
              onClick={() => handleSelectProviderPreset('rds')}
              className="px-2 py-0.5 rounded bg-[#efeeec] hover:bg-[#e6e6e6] border border-[#e6e6e6] text-[#0d0d0d] font-mono text-[11px] cursor-pointer"
            >
              AWS RDS
            </button>
            <button
              type="button"
              onClick={() => handleSelectProviderPreset('sample')}
              className="px-2 py-0.5 rounded bg-[#eaf3fc] hover:bg-[#d5e7f9] border border-[#c9e0f6] text-[#0075de] font-mono text-[11px] font-semibold cursor-pointer"
            >
              Demo SQLite
            </button>
          </div>

          {/* Connection Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#615d59] uppercase tracking-wider">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#dddddd] text-[#0d0d0d] text-[13px] px-3 py-1.5 rounded outline-none focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] transition-all"
              placeholder={
                selectedEngine === 'postgresql'
                  ? 'e.g. Neon Analytics Database'
                  : selectedEngine === 'mysql'
                  ? 'e.g. Production MySQL 8.0'
                  : 'e.g. SQLite Local Database'
              }
            />
          </div>

          {/* Connection URI or Demo Mode */}
          {isDemoSqlite ? (
            <div className="p-3.5 rounded-md bg-[#eaf3fc] border border-[#c9e0f6] text-[13px] text-[#0d0d0d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0075de]" />
                <span>Pre-seeded SQLite e-commerce dataset (6 relational tables ready)</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-[#615d59] uppercase tracking-wider">
                {selectedEngine === 'postgresql' ? 'Postgres Connection URI' : 'Connection URI'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={connectionUri}
                  onChange={(e) => setConnectionUri(e.target.value)}
                  className="w-full bg-white border border-[#dddddd] text-[#0d0d0d] font-mono text-[12px] sm:text-[13px] px-3 py-2 rounded outline-none pr-10 focus:border-[#0075de] focus:ring-1 focus:ring-[#0075de] transition-all"
                  placeholder={
                    selectedEngine === 'postgresql'
                      ? 'postgresql://user:password@host:port/dbname?sslmode=require'
                      : selectedEngine === 'mysql'
                      ? 'mysql://user:password@127.0.0.1:3306/dbname'
                      : 'sqlite:///path/to/database.db'
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-[#615d59] hover:text-[#0d0d0d] cursor-pointer"
                  title="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <span className="text-[11px] text-[#615d59]">
                Supports pooler URIs (`pgbouncer=true`). Passwords encrypted at rest.
              </span>
            </div>
          )}

          {/* SSL Mode & Read-only enforcement indicator */}
          <div className="flex items-center justify-between p-3 rounded-md bg-[#f6f5f4] border border-[#e6e6e6]">
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-[#2c8c66]" />
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[#0d0d0d]">SSL Enforcement</span>
                <span className="text-[11px] text-[#615d59]">require / verify-full</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d9eddf] text-[#17543b] text-[11px] font-semibold border border-[#2c8c66]/30">
              <Check className="h-3 w-3 text-[#2c8c66]" /> Enforced
            </span>
          </div>

          {/* Test connection output if ran */}
          {testResult && (
            <div
              className={`p-3 rounded-md text-[12px] flex items-center justify-between ${
                testResult.success
                  ? 'bg-[#d9eddf] text-[#17543b] border border-[#2c8c66]/30'
                  : 'bg-[#f7d6d3] text-[#86241d] border border-[#cd4239]/30'
              }`}
            >
              <span>{testResult.message}</span>
              {testResult.latency_ms && (
                <span className="font-mono font-bold">{testResult.latency_ms}ms</span>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-md bg-[#f7d6d3] text-[#86241d] border border-[#cd4239]/30 text-[12px]">
              {errorMessage}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[#e6e6e6]">
            {!isDemoSqlite ? (
              <button
                type="button"
                onClick={handleTestLatency}
                disabled={isTesting}
                className="px-3 py-1.5 text-[12px] text-[#31302e] hover:text-[#0d0d0d] rounded border border-[#dddddd] hover:bg-[#f8fafc] transition-colors cursor-pointer"
              >
                {isTesting ? 'Testing...' : 'Test Latency'}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md bg-white border border-[#dddddd] text-[#0d0d0d] hover:bg-[#f8fafc] transition-colors text-[13px] font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#0075de] hover:bg-[#005bab] text-white transition-colors text-[13px] font-medium shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>{isSubmitting ? 'Reflecting...' : 'Save & Reflect Schema'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

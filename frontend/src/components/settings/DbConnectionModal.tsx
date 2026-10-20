/**
 * DataSpeak — PostHog Database Connection Modal (DbConnectionModal.tsx)
 * Features one-click presets for Demo SQLite, PostgreSQL, Neon, and Supabase.
 * Uses PostHog yellow primary CTA pill and clear read-only guidance.
 */

import React, { useState } from 'react';
import {
  X,
  Database,
  Server,
  Zap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { connectionService } from '../../services/api';
import type { ConnectionParams, ConnectionTestResponse, DatabaseDialect } from '../../types';

interface DbConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: (params: ConnectionParams) => Promise<void>;
}

type PresetType = 'sqlite_sample' | 'postgres' | 'neon' | 'supabase';

export const DbConnectionModal: React.FC<DbConnectionModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('sqlite_sample');
  const [name, setName] = useState('Sample E-Commerce Database');
  const [dialect, setDialect] = useState<DatabaseDialect>('sqlite');
  const [host, setHost] = useState('');
  const [port, setPort] = useState<number>(5432);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(true);
  const [connectionString, setConnectionString] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResponse | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PresetType) => {
    setSelectedPreset(preset);
    setTestResult(null);
    setConnectError(null);

    switch (preset) {
      case 'sqlite_sample':
        setName('Sample E-Commerce Database');
        setDialect('sqlite');
        break;
      case 'postgres':
        setName('Production PostgreSQL');
        setDialect('postgresql');
        setPort(5432);
        setSsl(false);
        break;
      case 'neon':
        setName('Neon Serverless DB');
        setDialect('postgresql');
        setPort(5432);
        setSsl(true);
        break;
      case 'supabase':
        setName('Supabase DB');
        setDialect('postgresql');
        setPort(6543);
        setSsl(true);
        break;
    }
  };

  const buildConnectionPayload = (): ConnectionParams => {
    if (selectedPreset === 'sqlite_sample') {
      return {
        name,
        dialect: 'sqlite',
        is_sample_db: true,
      };
    }

    if (connectionString.trim()) {
      return {
        name: name.trim() || `${dialect} Database`,
        dialect,
        connection_string: connectionString.trim(),
        ssl,
      };
    }

    return {
      name: name.trim() || `${dialect} Database`,
      dialect,
      host: host.trim(),
      port: Number(port) || 5432,
      database: database.trim(),
      username: username.trim(),
      password,
      ssl,
    };
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setConnectError(null);
    try {
      const payload = buildConnectionPayload();
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

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectError(null);
    try {
      const payload = buildConnectionPayload();
      await onConnected(payload);
      onClose();
    } catch (err: unknown) {
      setConnectError(err instanceof Error ? err.message : 'Failed to connect and index database.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-[#bfc1b7] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with standard 8-pt padding */}
        <div className="px-6 sm:px-8 py-5 border-b border-[#bfc1b7] flex items-center justify-between bg-[#eeefe9] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-white text-[#1078a3] flex items-center justify-center border border-[#bfc1b7] shadow-xs">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#23251d] tracking-tight">Connect Database</h2>
              <p className="text-xs sm:text-sm text-[#4d4f46]">Select a ready-to-query preset or provide credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6c6e63] hover:text-[#23251d] hover:bg-[#e5e7e0] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body with generous 24px-32px padding */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-7">
          {/* Preset Selector Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#6c6e63] mb-3">
              Connection Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={() => handleSelectPreset('sqlite_sample')}
                className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'sqlite_sample'
                    ? 'border-[#23251d] bg-[#fcfcfa] ring-2 ring-[#f7a501] shadow-xs'
                    : 'border-[#bfc1b7] bg-white hover:bg-[#eeefe9]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#23251d] mb-1.5">
                  <Sparkles className="h-4 w-4 text-[#f7a501]" />
                  <span>Demo SQLite</span>
                </div>
                <p className="text-xs text-[#6c6e63] leading-relaxed">Instant e-commerce dataset (6 tables)</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('postgres')}
                className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'postgres'
                    ? 'border-[#23251d] bg-[#fcfcfa] ring-2 ring-[#f7a501] shadow-xs'
                    : 'border-[#bfc1b7] bg-white hover:bg-[#eeefe9]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#23251d] mb-1.5">
                  <Server className="h-4 w-4 text-[#1078a3]" />
                  <span>PostgreSQL</span>
                </div>
                <p className="text-xs text-[#6c6e63] leading-relaxed">Standard relational Postgres or AWS RDS</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('neon')}
                className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'neon'
                    ? 'border-[#23251d] bg-[#fcfcfa] ring-2 ring-[#f7a501] shadow-xs'
                    : 'border-[#bfc1b7] bg-white hover:bg-[#eeefe9]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#23251d] mb-1.5">
                  <Zap className="h-4 w-4 text-[#f7a501]" />
                  <span>Neon</span>
                </div>
                <p className="text-xs text-[#6c6e63] leading-relaxed">Serverless pooled cloud database</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('supabase')}
                className={`p-4 sm:p-5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'supabase'
                    ? 'border-[#23251d] bg-[#fcfcfa] ring-2 ring-[#f7a501] shadow-xs'
                    : 'border-[#bfc1b7] bg-white hover:bg-[#eeefe9]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#23251d] mb-1.5">
                  <Layers className="h-4 w-4 text-[#7c44a6]" />
                  <span>Supabase</span>
                </div>
                <p className="text-xs text-[#6c6e63] leading-relaxed">Port 6543 transaction pooler</p>
              </button>
            </div>
          </div>

          {/* Read-Only Safety Callout (Pastel Green Banner) */}
          <div className="rounded-xl bg-[#d9eddf] border border-[#2c8c66]/40 p-5 sm:p-6 flex items-start gap-3.5 shadow-xs">
            <ShieldCheck className="h-5 w-5 text-[#2c8c66] shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-[#23251d] leading-relaxed max-w-prose">
              <span className="font-bold text-[#17543b]">Zero-Trust Read-Only Protection: </span>
              Create a read-only database user for DataSpeak. In addition, all queries are parsed into
              Abstract Syntax Trees (AST) via sqlglot to strictly reject mutation or schema-altering commands.
            </div>
          </div>

          {/* Form Fields */}
          {selectedPreset === 'sqlite_sample' ? (
            <div className="p-5 sm:p-6 rounded-xl border border-[#bfc1b7] bg-[#eeefe9] text-xs sm:text-sm text-[#33342d] space-y-3">
              <div className="font-bold text-[#23251d] text-sm">Demo SQLite E-Commerce Database:</div>
              <p className="text-[#4d4f46] leading-relaxed">
                Includes 6 interrelated tables with realistic prices, foreign keys, and customer reviews:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {['customers', 'categories', 'products', 'orders', 'order_items', 'reviews'].map((t) => (
                  <span key={t} className="px-3 py-1 rounded-lg bg-white border border-[#bfc1b7] font-mono text-xs text-[#23251d] font-semibold shadow-2xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#33342d] mb-1.5">Connection Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Analytics Production"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg focus:outline-none focus:border-[#23251d] focus:ring-1 focus:ring-[#23251d]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#33342d] mb-1.5">Connection String (Optional)</label>
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="postgresql://user:password@host:port/dbname?sslmode=require"
                  className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg font-mono text-xs focus:outline-none focus:border-[#23251d] focus:ring-1 focus:ring-[#23251d]"
                />
                <p className="text-xs text-[#6c6e63] mt-1.5 leading-relaxed">Overrides individual host/port fields if provided.</p>
              </div>

              {!connectionString && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#33342d] mb-1.5">Host</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="db.example.com or localhost"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg focus:outline-none focus:border-[#23251d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#33342d] mb-1.5">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg focus:outline-none focus:border-[#23251d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#33342d] mb-1.5">Database Name</label>
                    <input
                      type="text"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="main"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg focus:outline-none focus:border-[#23251d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#33342d] mb-1.5">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="readonly_user"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg focus:outline-none focus:border-[#23251d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#33342d] mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-sm bg-white border border-[#bfc1b7] rounded-lg focus:outline-none focus:border-[#23251d]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="ssl_toggle"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  className="h-4.5 w-4.5 rounded text-[#f7a501] focus:ring-[#f7a501]"
                />
                <label htmlFor="ssl_toggle" className="text-xs sm:text-sm text-[#33342d] font-semibold cursor-pointer">
                  Enforce SSL/TLS encryption (recommended for Neon & Supabase)
                </label>
              </div>
            </div>
          )}

          {/* Live Test Feedback */}
          {testResult && (
            <div
              className={`p-4 sm:p-5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 shadow-xs ${
                testResult.success
                  ? 'bg-[#d9eddf] border-[#2c8c66] text-[#17543b]'
                  : 'bg-[#f7d6d3] border-[#cd4239] text-[#86241d]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2c8c66] mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-[#cd4239] mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold leading-snug">{testResult.message}</div>
                {testResult.latency_ms !== undefined && (
                  <div className="mt-2 flex items-center gap-4 text-xs opacity-90 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" /> Latency: {testResult.latency_ms.toFixed(1)}ms
                    </span>
                    {testResult.database_version && <span>Version: {testResult.database_version}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {connectError && (
            <div className="p-4 rounded-xl bg-[#f7d6d3] border border-[#cd4239] text-[#86241d] text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-semibold leading-relaxed">{connectError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer with standard 8-pt padding */}
        <div className="px-6 sm:px-8 py-5 bg-[#eeefe9] border-t border-[#bfc1b7] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isConnecting}
            className="posthog-button-secondary text-xs sm:text-sm font-semibold"
          >
            {isTesting && <Loader2 className="h-4 w-4 animate-spin text-[#f7a501]" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isConnecting}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg text-[#4d4f46] hover:bg-[#e5e7e0] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="posthog-button-primary text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm"
            >
              {isConnecting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{selectedPreset === 'sqlite_sample' ? 'Load Sample Database' : 'Connect & Index'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

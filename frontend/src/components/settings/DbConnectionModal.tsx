/**
 * DataSpeak — Database Connection Modal (DbConnectionModal.tsx)
 * Features one-click presets for Demo SQLite, PostgreSQL, Neon, and Supabase.
 * Interactive latency testing and strict read-only recommendations.
 * Follows framed-sheet rules: no placeholder examples, no glass, sentence case.
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

  // Handle Preset Selection
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
        setPort(6543); // Transaction pooler default
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-overlay border border-[#e2e4e8] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#eceef0] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#f7f8fa] text-[#1b6c80] flex items-center justify-center border border-[#e2e4e8]">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#131416] tracking-tight">Connect Database</h2>
              <p className="text-[11px] text-[#5d5f60]">Choose a database preset or enter connection parameters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-[#5d5f60] hover:text-[#131416] hover:bg-[#ebedee] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Preset Selector Grid */}
          <div>
            <label className="block text-xs font-medium text-[#5d5f60] mb-2">
              Connection presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => handleSelectPreset('sqlite_sample')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedPreset === 'sqlite_sample'
                    ? 'border-[#1b6c80] bg-[#f7f8fa] ring-1 ring-[#1b6c80]'
                    : 'border-[#e2e4e8] bg-white hover:bg-[#f7f8fa]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1b6c80] mb-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Demo SQLite</span>
                </div>
                <p className="text-[11px] text-[#5d5f60] leading-tight">Instant e-commerce dataset (zero setup)</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('postgres')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedPreset === 'postgres'
                    ? 'border-[#1b6c80] bg-[#f7f8fa] ring-1 ring-[#1b6c80]'
                    : 'border-[#e2e4e8] bg-white hover:bg-[#f7f8fa]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#131416] mb-1">
                  <Server className="h-3.5 w-3.5 text-[#1b6c80]" />
                  <span>PostgreSQL</span>
                </div>
                <p className="text-[11px] text-[#5d5f60] leading-tight">Standard relational Postgres or AWS RDS</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('neon')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedPreset === 'neon'
                    ? 'border-[#1b6c80] bg-[#f7f8fa] ring-1 ring-[#1b6c80]'
                    : 'border-[#e2e4e8] bg-white hover:bg-[#f7f8fa]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#131416] mb-1">
                  <Zap className="h-3.5 w-3.5 text-[#1b6c80]" />
                  <span>Neon</span>
                </div>
                <p className="text-[11px] text-[#5d5f60] leading-tight">Serverless pooled cloud database</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('supabase')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedPreset === 'supabase'
                    ? 'border-[#1b6c80] bg-[#f7f8fa] ring-1 ring-[#1b6c80]'
                    : 'border-[#e2e4e8] bg-white hover:bg-[#f7f8fa]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#131416] mb-1">
                  <Layers className="h-3.5 w-3.5 text-[#1b6c80]" />
                  <span>Supabase</span>
                </div>
                <p className="text-[11px] text-[#5d5f60] leading-tight">Port 6543 transaction pooler</p>
              </button>
            </div>
          </div>

          {/* Read-Only Safety Disclaimer */}
          <div className="rounded-lg bg-[#f7f8fa] border border-[#e2e4e8] p-3 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[#1e7b4f] shrink-0 mt-0.5" />
            <div className="text-xs text-[#5d5f60] leading-relaxed">
              <span className="font-semibold text-[#131416]">Zero-trust read-only policy: </span>
              All queries are validated via sqlglot AST parsing before execution. Mutation statements (INSERT, UPDATE, DELETE, DROP) are strictly refused.
            </div>
          </div>

          {/* Form Fields */}
          {selectedPreset === 'sqlite_sample' ? (
            <div className="p-3.5 rounded-lg border border-[#e2e4e8] bg-[#f7f8fa] text-xs text-[#5d5f60] space-y-1.5">
              <div className="font-semibold text-[#131416]">Demo SQLite database included:</div>
              <p>Contains 6 relational tables with realistic orders, products, and customer records:</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['customers', 'categories', 'products', 'orders', 'order_items', 'reviews'].map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-white border border-[#e2e4e8] text-[11px] text-[#131416]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#131416] mb-1">Connection name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Analytics Replica"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md focus:outline-none focus:border-[#1b6c80]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#131416] mb-1">Connection string (optional)</label>
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="postgresql://user:password@host:5432/dbname?sslmode=require"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md font-mono focus:outline-none focus:border-[#1b6c80]"
                />
                <p className="text-[11px] text-[#5d5f60] mt-0.5">If provided, this overrides individual host/port fields.</p>
              </div>

              {!connectionString && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#131416] mb-1">Host</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="ep-cool-lake-123456.us-east-2.aws.neon.tech or localhost"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md focus:outline-none focus:border-[#1b6c80]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#131416] mb-1">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md focus:outline-none focus:border-[#1b6c80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#131416] mb-1">Database name</label>
                    <input
                      type="text"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md focus:outline-none focus:border-[#1b6c80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#131416] mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="readonly_user"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md focus:outline-none focus:border-[#1b6c80]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#131416] mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#e2e4e8] rounded-md focus:outline-none focus:border-[#1b6c80]"
                    />
                  </div>
                </div>
              )}

              {/* Cloud SSL / TLS Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ssl-toggle"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  className="rounded border-[#e2e4e8] text-[#1b6c80] focus:ring-[#1b6c80]"
                />
                <label htmlFor="ssl-toggle" className="text-xs text-[#131416] select-none cursor-pointer">
                  Require SSL/TLS encryption (recommended for Neon & Supabase cloud connections)
                </label>
              </div>
            </div>
          )}

          {/* Test Connection Results Card */}
          {testResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-[#dcfae5] border-[#1e7b4f]/40 text-[#04250e]'
                  : 'bg-[#ffedea] border-[#c4242a]/40 text-[#831c1e]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 text-[#1e7b4f] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-[#c4242a] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-semibold">{testResult.success ? 'Connection verified: ' : 'Failed: '}</span>
                <span>{testResult.message}</span>
                {testResult.latency_ms !== undefined && (
                  <span className="block text-[11px] mt-0.5 tnum">
                    Latency: {testResult.latency_ms.toFixed(1)}ms · Dialect: {testResult.dialect || 'SQL'}
                  </span>
                )}
              </div>
            </div>
          )}

          {connectError && (
            <div className="p-3 rounded-lg bg-[#ffedea] border border-[#c4242a]/40 text-[#831c1e] text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{connectError}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#eceef0] bg-[#f7f8fa] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isConnecting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-[#e2e4e8] text-[#131416] hover:bg-[#ebedee] disabled:opacity-50 transition-colors"
          >
            {isTesting && <Loader2 className="h-3 w-3 animate-spin text-[#1b6c80]" />}
            <span>{isTesting ? 'Testing...' : 'Test connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-[#5d5f60] hover:text-[#131416] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting || isTesting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md bg-[#131416] hover:bg-[#222428] text-white disabled:opacity-50 transition-colors"
            >
              {isConnecting && <Loader2 className="h-3 w-3 animate-spin text-white" />}
              <span>{isConnecting ? 'Connecting...' : 'Connect and index'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

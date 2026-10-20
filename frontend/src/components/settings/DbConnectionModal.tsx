/**
 * DataSpeak — Database Connection Modal (DbConnectionModal.tsx)
 * Features one-click presets for Demo SQLite, PostgreSQL, Neon, and Supabase.
 * Interactive latency testing and strict read-only recommendations.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-floating border border-[#dddddd] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#eeeeec] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#eaf3fc] text-[#0075de] flex items-center justify-center border border-[#c9e0f6]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0d0d0d] tracking-tight">Connect Database</h2>
              <p className="text-xs text-[#615d59]">Select a ready-to-query preset or provide connection parameters</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#615d59] hover:text-[#0d0d0d] hover:bg-[#efeeec] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Selector Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#615d59] mb-3">
              Connection Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleSelectPreset('sqlite_sample')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'sqlite_sample'
                    ? 'border-[#0075de] bg-[#eaf3fc] ring-2 ring-[#0075de]/20'
                    : 'border-[#dddddd] bg-white hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0075de] mb-1">
                  <Sparkles className="h-4 w-4" />
                  <span>Demo SQLite</span>
                </div>
                <p className="text-[11px] text-[#615d59] leading-tight">Instant e-commerce dataset (zero setup)</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('postgres')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'postgres'
                    ? 'border-[#0075de] bg-[#eaf3fc] ring-2 ring-[#0075de]/20'
                    : 'border-[#dddddd] bg-white hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d0d0d] mb-1">
                  <Server className="h-4 w-4 text-[#0075de]" />
                  <span>PostgreSQL</span>
                </div>
                <p className="text-[11px] text-[#615d59] leading-tight">Standard relational Postgres or AWS RDS</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('neon')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'neon'
                    ? 'border-[#0075de] bg-[#eaf3fc] ring-2 ring-[#0075de]/20'
                    : 'border-[#dddddd] bg-white hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d0d0d] mb-1">
                  <Zap className="h-4 w-4 text-[#0075de]" />
                  <span>Neon</span>
                </div>
                <p className="text-[11px] text-[#615d59] leading-tight">Serverless pooled cloud database</p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('supabase')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  selectedPreset === 'supabase'
                    ? 'border-[#0075de] bg-[#eaf3fc] ring-2 ring-[#0075de]/20'
                    : 'border-[#dddddd] bg-white hover:bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0d0d0d] mb-1">
                  <Layers className="h-4 w-4 text-[#0075de]" />
                  <span>Supabase</span>
                </div>
                <p className="text-[11px] text-[#615d59] leading-tight">Port 6543 transaction pooler</p>
              </button>
            </div>
          </div>

          {/* Read-Only Safety Disclaimer */}
          <div className="rounded-xl bg-[#eaf3fc] border border-[#c9e0f6] p-4 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-[#0075de] shrink-0 mt-0.5" />
            <div className="text-xs text-[#0d0d0d] leading-relaxed">
              <span className="font-semibold text-[#005bab]">Zero-Trust Read-Only Protection: </span>
              We recommend creating a read-only database user for DataSpeak. Furthermore, all queries are parsed into
              Abstract Syntax Trees (AST) via sqlglot to strictly forbid write operations on our end.
            </div>
          </div>

          {/* Form Fields */}
          {selectedPreset === 'sqlite_sample' ? (
            <div className="p-4 rounded-xl border border-[#e6e6e6] bg-[#f6f5f4] text-xs text-[#31302e] space-y-2">
              <div className="font-semibold text-[#0d0d0d]">Demo SQLite Database Included:</div>
              <p>Contains 6 interrelated tables with realistic data:</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['customers', 'categories', 'products', 'orders', 'order_items', 'reviews'].map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded bg-white border border-[#dddddd] font-mono text-[11px]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#31302e] mb-1">Connection Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Analytics Replica"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#31302e] mb-1">Connection String (Optional)</label>
                <input
                  type="text"
                  value={connectionString}
                  onChange={(e) => setConnectionString(e.target.value)}
                  placeholder="postgresql://user:password@host:port/dbname?sslmode=require"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg font-mono text-xs focus:outline-none focus:border-[#0075de] focus:ring-2 focus:ring-[#0075de]/20"
                />
                <p className="text-[11px] text-[#615d59] mt-1">If provided, this overrides individual host/port fields.</p>
              </div>

              {!connectionString && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#31302e] mb-1">Host</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="db.example.com or localhost"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#0075de]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#31302e] mb-1">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#0075de]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#31302e] mb-1">Database Name</label>
                    <input
                      type="text"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="main"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#0075de]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#31302e] mb-1">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="readonly_user"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#0075de]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#31302e] mb-1">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-sm bg-white border border-[#dddddd] rounded-lg focus:outline-none focus:border-[#0075de]"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ssl_toggle"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  className="h-4 w-4 rounded text-[#0075de] focus:ring-[#0075de]"
                />
                <label htmlFor="ssl_toggle" className="text-xs text-[#31302e] font-medium">
                  Enforce SSL/TLS encryption (recommended for Neon & Supabase)
                </label>
              </div>
            </div>
          )}

          {/* Live Test Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-[#d9eddf] border-[#2c8c66] text-[#17543b]'
                  : 'bg-[#f7d6d3] border-[#cd4239] text-[#86241d]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2c8c66] mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-[#cd4239] mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold">{testResult.message}</div>
                {testResult.latency_ms !== undefined && (
                  <div className="mt-1 flex items-center gap-3 text-[11px] opacity-90">
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Latency: {testResult.latency_ms.toFixed(1)}ms
                    </span>
                    {testResult.database_version && <span>Version: {testResult.database_version}</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {connectError && (
            <div className="p-3 rounded-lg bg-[#f7d6d3] border border-[#cd4239] text-[#86241d] text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{connectError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#f6f5f4] border-t border-[#eeeeec] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting || isConnecting}
            className="px-3.5 py-2 text-xs font-medium rounded-lg bg-white border border-[#dddddd] text-[#0d0d0d] hover:bg-[#f8fafc] disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin text-[#0075de]" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isConnecting}
              className="px-3.5 py-2 text-xs font-medium rounded-lg text-[#615d59] hover:bg-[#efeeec] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[#0075de] hover:bg-[#005bab] text-white shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isConnecting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{selectedPreset === 'sqlite_sample' ? 'Load Sample Database' : 'Connect & Index'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

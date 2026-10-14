/**
 * DataSpeak — TypeScript Type Definitions
 * Central type index for the frontend application.
 * All shared interfaces, enums, and type aliases live here.
 */

// ── API Response Envelope ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// ── Health Check ──────────────────────────────────────────────────────────
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  environment: string;
  version: string;
  uptime_seconds: number;
}

// ── Database Connection ────────────────────────────────────────────────────
export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite';

export interface DatabaseConnection {
  id: string;
  name: string;
  dialect: DatabaseDialect;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  ssl?: boolean;
  connectedAt?: string;
}

// ── Schema ────────────────────────────────────────────────────────────────
export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  foreignKey?: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  rowCount?: number;
}

export interface DatabaseSchema {
  tables: TableSchema[];
  reflectedAt: string;
}

// ── Query & Results ───────────────────────────────────────────────────────
export type ChartType = 'bar' | 'line' | 'pie' | 'none';

export interface ChartConfig {
  type: ChartType;
  xKey: string;
  yKey: string;
  title?: string;
}

export interface QueryResult {
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
  chart?: ChartConfig;
  summary?: string;
}

export interface QueryRequest {
  question: string;
  connectionId: string;
}

// ── UI State ──────────────────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  durationMs?: number;
}

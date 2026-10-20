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

// ── Authentication ────────────────────────────────────────────────────────
export interface AuthUser {
  user_id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  org_id?: string;
  session_claims?: Record<string, unknown>;
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
  is_sample_db?: boolean;
  table_count?: number;
  connected_at: string;
  connectedAt?: string;
}

export interface ConnectionParams {
  name?: string;
  dialect?: DatabaseDialect;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connection_string?: string;
  ssl?: boolean;
  is_sample_db?: boolean;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  latency_ms?: number;
  dialect?: string;
  database_version?: string;
}

// ── Schema ────────────────────────────────────────────────────────────────
export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  default_value?: string;
  foreignKey?: string;
}

export interface ForeignKeyDefinition {
  constrained_column: string;
  referred_table: string;
  referred_column: string;
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  primary_keys?: string[];
  foreign_keys?: ForeignKeyDefinition[];
  rowCount?: number;
  row_count_estimate?: number;
  sample_rows?: Record<string, unknown>[];
}

export interface DatabaseSchema {
  dialect?: string;
  database_name?: string;
  tables: TableSchema[];
  table_count?: number;
  reflected_at: string;
  reflectedAt?: string;
  summary_prompt?: string;
}

// ── Query & Results ───────────────────────────────────────────────────────
export type ChartType = 'bar' | 'line' | 'pie' | 'none';

export interface ChartConfig {
  type: ChartType;
  xKey?: string;
  yKey?: string;
  x_key?: string;
  y_key?: string;
  title?: string;
}

export interface QueryResult {
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount?: number;
  row_count?: number;
  executionTimeMs?: number;
  execution_time_ms?: number;
  chart?: ChartConfig;
  summary?: string;
  status?: 'success' | 'error' | 'blocked';
  error_message?: string;
}

export interface QueryRequest {
  question: string;
  connectionId?: string;
}


// ── UI State ──────────────────────────────────────────────────────────────
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  durationMs?: number;
}

// ── Query History & Interactive Stepper ──────────────────────────────────
export interface QueryHistoryItem {
  id: string;
  question: string;
  timestamp: string;
  result: QueryResult;
  isSaved?: boolean;
}

export type ProgressStepId =
  | 'reading_schema'
  | 'generating_sql'
  | 'validating_guardrails'
  | 'executing_query'
  | 'summarizing';

export interface QueryProgressStep {
  id: ProgressStepId;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
}

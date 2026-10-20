/**
 * DataSpeak — API Client
 * Centralized Axios instance configured with Clerk Bearer token interceptor.
 */

import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';
import type {
  AuthUser,
  HealthCheckResponse,
  ConnectionParams,
  ConnectionTestResponse,
  DatabaseConnection,
  DatabaseSchema,
  QueryResult,
  QueryHistoryItem,
  QueryHistoryListResponse,
  DeleteHistoryResponse,
  BatchImportResponse,
} from '../types';

// API base URL: defaults to empty string so requests leverage Vite proxy (/api/v1)
// or can be overridden with VITE_API_BASE_URL (e.g. http://localhost:8000)
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamic token provider function registered by Clerk Auth Provider
type TokenGetter = () => Promise<string | null>;
let currentTokenGetter: TokenGetter | null = null;

/**
 * Register a function that retrieves the latest Clerk session Bearer token.
 * Called inside Clerk auth context (e.g., in App or ProtectedRoute).
 */
export const setAuthTokenGetter = (getter: TokenGetter | null): void => {
  currentTokenGetter = getter;
};

// ── Request Interceptor: Attach Clerk Bearer Token ──────────────────────────
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    if (currentTokenGetter) {
      try {
        const token = await currentTokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('Failed to retrieve Clerk session token for request:', err);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor: Error Handling, 401 & 429 Detection ───────────────
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Dispatches custom window event so UI can react (e.g. prompt re-login)
      window.dispatchEvent(
        new CustomEvent('dataspeak:unauthorized', {
          detail: { url: error.config?.url },
        })
      );
    } else if (error.response?.status === 429) {
      // Rate limit hit: extract Retry-After header or default to 60 seconds
      const headers = error.response.headers;
      const retryAfterHeader = headers ? (headers['retry-after'] || headers['Retry-After']) : null;
      let retryAfter = 60;
      if (retryAfterHeader) {
        const parsed = parseInt(String(retryAfterHeader), 10);
        if (!isNaN(parsed) && parsed > 0) {
          retryAfter = parsed;
        }
      }
      const detailMsg =
        (error.response.data as { detail?: string } | undefined)?.detail ||
        'Rate limit exceeded. Please wait before retrying.';
      window.dispatchEvent(
        new CustomEvent('dataspeak:ratelimit', {
          detail: {
            retryAfter,
            message: detailMsg,
            url: error.config?.url,
          },
        })
      );
    }
    return Promise.reject(error);
  }
);

// ── Auth & Health Service Helpers ──────────────────────────────────────────
export const authService = {
  /**
   * Get the current authenticated user details from the backend.
   * Requires a valid Clerk Bearer token.
   */
  async getCurrentUser(): Promise<AuthUser> {
    const res = await apiClient.get<AuthUser>('/api/v1/auth/me');
    return res.data;
  },

  /**
   * Health check endpoint to verify backend status.
   */
  async getHealth(): Promise<HealthCheckResponse> {
    const res = await apiClient.get<HealthCheckResponse>('/health');
    return res.data;
  },
};

// ── Database Connection Service ─────────────────────────────────────────────
export const connectionService = {
  /**
   * Test database connectivity and latency without registering a session.
   */
  async test(params: ConnectionParams): Promise<ConnectionTestResponse> {
    const res = await apiClient.post<ConnectionTestResponse>('/api/v1/connections/test', params);
    return res.data;
  },

  /**
   * Connect to database, reflect schema, and store session cache.
   */
  async connect(params: ConnectionParams): Promise<DatabaseConnection> {
    const res = await apiClient.post<DatabaseConnection>('/api/v1/connections/connect', params);
    return res.data;
  },

  /**
   * Retrieve active connection metadata for current user session.
   */
  async getCurrent(): Promise<DatabaseConnection | null> {
    try {
      const res = await apiClient.get<DatabaseConnection>('/api/v1/connections/current');
      return res.data;
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Disconnect active database and purge session cache.
   */
  async disconnect(): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/api/v1/connections/disconnect');
    return res.data;
  },
};

// ── Schema Reflection Service ───────────────────────────────────────────────
export const schemaService = {
  /**
   * Get current database schema (tables, columns, types, sample rows).
   */
  async get(): Promise<DatabaseSchema> {
    const res = await apiClient.get<DatabaseSchema>('/api/v1/schema');
    return res.data;
  },

  /**
   * Force re-reflection of active database schema.
   */
  async refresh(): Promise<DatabaseSchema> {
    const res = await apiClient.post<DatabaseSchema>('/api/v1/schema/refresh');
    return res.data;
  },
};

// ── AI Natural Language Query Service ──────────────────────────────────────
export const queryService = {
  /**
   * Submit a natural language question to the LangGraph Text-to-SQL pipeline.
   */
  async ask(question: string): Promise<QueryResult> {
    const res = await apiClient.post<QueryResult>('/api/v1/queries/ask', { question });
    return res.data;
  },
};

// ── Server-Side Query History Service ───────────────────────────────────────
export const historyService = {
  /**
   * List paginated query history with optional filtering.
   */
  async list(params?: {
    saved_only?: boolean;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<QueryHistoryListResponse> {
    const res = await apiClient.get<QueryHistoryListResponse>('/api/v1/history', {
      params,
    });
    return res.data;
  },

  /**
   * Get a specific query history record by ID.
   */
  async get(id: string): Promise<QueryHistoryItem> {
    const res = await apiClient.get<QueryHistoryItem>(`/api/v1/history/${id}`);
    return res.data;
  },

  /**
   * Toggle saved / starred bookmark status for a query.
   */
  async toggleSave(id: string): Promise<QueryHistoryItem> {
    const res = await apiClient.post<QueryHistoryItem>(`/api/v1/history/${id}/toggle-save`);
    return res.data;
  },

  /**
   * Delete a specific query from history.
   */
  async delete(id: string): Promise<DeleteHistoryResponse> {
    const res = await apiClient.delete<DeleteHistoryResponse>(`/api/v1/history/${id}`);
    return res.data;
  },

  /**
   * Clear all recent unsaved queries for current user while preserving saved queries.
   */
  async clearRecent(): Promise<DeleteHistoryResponse> {
    const res = await apiClient.delete<DeleteHistoryResponse>('/api/v1/history');
    return res.data;
  },

  /**
   * One-time batch import of historical queries from localStorage.
   */
  async importLocal(items: QueryHistoryItem[]): Promise<BatchImportResponse> {
    // Map items to match backend QueryHistoryImport schema cleanly
    const payloadItems = items.map((item) => ({
      id: item.id,
      question: item.question,
      sql: item.sql || item.result?.sql || '',
      status: item.status || item.result?.status || 'success',
      execution_time_ms:
        item.execution_time_ms ??
        item.result?.executionTimeMs ??
        item.result?.execution_time_ms ??
        0,
      row_count:
        item.row_count ??
        item.result?.rowCount ??
        item.result?.row_count ??
        (item.result?.rows?.length ?? 0),
      chart_config: item.chart_config || item.result?.chart || undefined,
      summary: item.summary || item.result?.summary || undefined,
      error_message: item.error_message || item.result?.error_message || undefined,
      is_saved: Boolean(item.is_saved ?? item.isSaved),
      database_name: item.database_name || 'database',
      created_at: item.created_at || item.timestamp || new Date().toISOString(),
    }));

    const res = await apiClient.post<BatchImportResponse>('/api/v1/history/import', {
      items: payloadItems,
    });
    return res.data;
  },
};


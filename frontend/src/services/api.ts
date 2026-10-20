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

// ── Response Interceptor: Error Handling & 401 Detection ────────────────────
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

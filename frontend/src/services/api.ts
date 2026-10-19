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
import type { AuthUser, HealthCheckResponse } from '../types';

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

/**
 * DataSpeak — Database State Hook
 * Manages active connection, schema reflection cache, and connection modal visibility.
 */

import { useState, useEffect, useCallback } from 'react';
import { connectionService, schemaService } from '../services/api';
import type { DatabaseConnection, DatabaseSchema, ConnectionParams } from '../types';

export function useDatabase(isClerkReady: boolean) {
  const [activeConnection, setActiveConnection] = useState<DatabaseConnection | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load current connection and schema on initialization if authenticated
  const loadActiveConnection = useCallback(async () => {
    if (!isClerkReady) return;
    setIsLoading(true);
    setError(null);
    try {
      const conn = await connectionService.getCurrent();
      setActiveConnection(conn);
      if (conn) {
        const sch = await schemaService.get();
        setSchema(sch);
      } else {
        setSchema(null);
      }
    } catch (err: unknown) {
      console.warn('Could not load current database session:', err);
      setActiveConnection(null);
      setSchema(null);
    } finally {
      setIsLoading(false);
    }
  }, [isClerkReady]);

  useEffect(() => {
    loadActiveConnection();
  }, [loadActiveConnection]);

  // Connect to database (either sample demo or custom user database)
  const connectDatabase = async (params: ConnectionParams): Promise<DatabaseConnection> => {
    setIsLoading(true);
    setError(null);
    try {
      const conn = await connectionService.connect(params);
      setActiveConnection(conn);
      // Fetch reflected schema
      const sch = await schemaService.get();
      setSchema(sch);
      setIsModalOpen(false);
      return conn;
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Connection failed.'
          : 'Failed to connect to database.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect active database
  const disconnectDatabase = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await connectionService.disconnect();
      setActiveConnection(null);
      setSchema(null);
    } catch (err: unknown) {
      console.error('Error disconnecting database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-inspect active database schema
  const refreshSchema = async (): Promise<DatabaseSchema | null> => {
    if (!activeConnection) return null;
    setIsRefreshing(true);
    try {
      const newSchema = await schemaService.refresh();
      setSchema(newSchema);
      return newSchema;
    } catch (err: unknown) {
      console.error('Failed to refresh schema:', err);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    activeConnection,
    schema,
    isLoading,
    isRefreshing,
    error,
    isModalOpen,
    setIsModalOpen,
    connectDatabase,
    disconnectDatabase,
    refreshSchema,
    reload: loadActiveConnection,
  };
}

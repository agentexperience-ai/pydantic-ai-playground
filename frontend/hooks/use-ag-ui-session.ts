"use client";

import { useState, useCallback } from 'react';
import { agUiClient, AgUiSession } from '@/lib/ag-ui-client';

export interface UseAgUiSessionReturn {
  // State
  session: AgUiSession | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  loadSession: (sessionId: string) => Promise<void>;
  createSession: () => Promise<void>;

  // Status
  hasSession: boolean;
}

export function useAgUiSession(): UseAgUiSessionReturn {
  const [session, setSession] = useState<AgUiSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load an existing session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionData = await agUiClient.getSession(sessionId);
      setSession(sessionData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load session');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new session
  const createSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionData = await agUiClient.createSession();
      setSession(sessionData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create session');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    session,
    isLoading,
    error,

    // Actions
    loadSession,
    createSession,

    // Status
    hasSession: !!session,
  };
}
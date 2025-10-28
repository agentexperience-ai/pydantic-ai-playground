"use client";

import { useState, useCallback } from 'react';
import { agUiClient } from '@/lib/ag-ui-client';

export interface MemorySummary {
  user_preferences: number;
  user_facts: number;
  notes: number;
  conversation_history: number;
  created_at?: string;
  updated_at?: string;
}

export interface UseAgUiMemoryReturn {
  // State
  memorySummary: MemorySummary | null;
  isLoading: boolean;
  error: Error | null;

  // Actions
  loadMemorySummary: () => Promise<void>;
  addUserFact: (factKey: string, factValue: string) => Promise<void>;
  clearMemory: () => Promise<void>;

  // Status
  hasMemory: boolean;
}

export function useAgUiMemory(): UseAgUiMemoryReturn {
  const [memorySummary, setMemorySummary] = useState<MemorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load memory summary
  const loadMemorySummary = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const summary = await agUiClient.getMemorySummary();
      setMemorySummary(summary);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load memory summary');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add a user fact to memory
  const addUserFact = useCallback(async (factKey: string, factValue: string) => {
    try {
      setIsLoading(true);
      setError(null);

      await agUiClient.addUserFact(factKey, factValue);

      // Reload memory summary to reflect the change
      await loadMemorySummary();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add user fact');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [loadMemorySummary]);

  // Clear all memory
  const clearMemory = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await agUiClient.clearMemory();
      setMemorySummary(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to clear memory');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    memorySummary,
    isLoading,
    error,

    // Actions
    loadMemorySummary,
    addUserFact,
    clearMemory,

    // Status
    hasMemory: !!memorySummary && (
      memorySummary.user_preferences > 0 ||
      memorySummary.user_facts > 0 ||
      memorySummary.notes > 0 ||
      memorySummary.conversation_history > 0
    ),
  };
}
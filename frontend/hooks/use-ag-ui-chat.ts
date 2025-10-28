"use client";

import { useState, useCallback, useRef } from 'react';
import { agUiClient, AgUiMessage, AgUiResponse, AgUiStreamChunk } from '@/lib/ag-ui-client';

export interface UseAgUiChatOptions {
  initialSessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseAgUiChatReturn {
  // State
  messages: AgUiMessage[];
  sessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  createSession: () => Promise<void>;
  clearMessages: () => void;
  setSessionId: (sessionId: string) => void;

  // Status
  hasSession: boolean;
}

export function useAgUiChat(options: UseAgUiChatOptions = {}): UseAgUiChatReturn {
  const { initialSessionId, onSessionChange, onError } = options;

  const [messages, setMessages] = useState<AgUiMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a new session
  const createSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await agUiClient.createSession();
      setSessionId(session.session_id);
      setMessages([]);

      onSessionChange?.(session.session_id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create session');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSessionChange, onError]);

  // Send a message to the AG-UI backend
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setIsLoading(true);
        setIsStreaming(true);
        setError(null);

        // Add user message immediately
        const userMessage: AgUiMessage = {
          role: 'user',
          content: message,
          timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);

        // Create session if none exists
        let currentSessionId = sessionId;
        if (!currentSessionId) {
          const session = await agUiClient.createSession();
          currentSessionId = session.session_id;
          setSessionId(currentSessionId);
          onSessionChange?.(currentSessionId);
        }

        // Add assistant message placeholder
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          },
        ]);

        // Send message and handle streaming response
        await agUiClient.sendMessage(
          message,
          currentSessionId,
          (chunk: AgUiStreamChunk) => {
            // Handle AG-UI protocol events
            if (chunk.type === 'TEXT_MESSAGE_CONTENT' && chunk.data.message) {
              // Update the assistant message with streaming content
              setMessages(prev => {
                const newMessages = [...prev];
                const assistantMessageIndex = newMessages.length - 1; // Last message is the assistant
                if (newMessages[assistantMessageIndex] && newMessages[assistantMessageIndex].role === 'assistant') {
                  newMessages[assistantMessageIndex] = {
                    ...newMessages[assistantMessageIndex],
                    content: (newMessages[assistantMessageIndex].content || '') + chunk.data.message,
                  };
                }
                return newMessages;
              });
            }

            // Handle thinking parts
            if (chunk.thinking_part) {
              setMessages(prev => {
                const newMessages = [...prev];
                const assistantMessageIndex = newMessages.length - 1; // Last message is the assistant
                if (newMessages[assistantMessageIndex] && newMessages[assistantMessageIndex].role === 'assistant') {
                  const currentThinkingParts = newMessages[assistantMessageIndex].thinking_parts || [];
                  newMessages[assistantMessageIndex] = {
                    ...newMessages[assistantMessageIndex],
                    thinking_parts: [...currentThinkingParts, chunk.thinking_part!],
                  };
                }
                return newMessages;
              });
            }

            if (chunk.type === 'RUN_FINISHED') {
              setIsStreaming(false);
            }
          }
        );
      } catch (err) {
        // Don't set error for aborted requests
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const error = err instanceof Error ? err : new Error('Failed to send message');
        setError(error);
        onError?.(error);

        // Remove the assistant message placeholder on error
        setMessages(prev => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [sessionId, onSessionChange, onError]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Update session ID
  const updateSessionId = useCallback(
    (newSessionId: string) => {
      setSessionId(newSessionId);
      setMessages([]);
      setError(null);
      onSessionChange?.(newSessionId);
    },
    [onSessionChange]
  );

  return {
    // State
    messages,
    sessionId,
    isLoading,
    isStreaming,
    error,

    // Actions
    sendMessage,
    createSession,
    clearMessages,
    setSessionId: updateSessionId,

    // Status
    hasSession: !!sessionId,
  };
}
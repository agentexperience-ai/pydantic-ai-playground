"use client";

import { useState, useCallback, useRef } from 'react';
import { agUiClient, AgUiMessage, AgUiStreamChunk } from '@/lib/ag-ui-client';

export interface UseAgUiChatOptions {
  initialSessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export interface AgUiToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'pending' | 'executing' | 'completed' | 'error';
  tool_call_id?: string;
}

export interface AgUiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
}

export interface AgUiTask {
  key: string;
  value: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface AgUiSource {
  href: string;
  title: string;
}

export interface AgUiChainOfThoughtStep {
  label: string;
  description: string;
  status: 'active' | 'complete' | 'pending';
  content: string;
  type?: 'text' | 'reasoning' | 'function_call';
}

export interface UseAgUiChatReturn {
  // State
  messages: AgUiMessage[];
  sessionId: string | null;
  isLoading: boolean;
  isStreaming: boolean;
  error: Error | null;
  toolCalls: AgUiToolCall[];
  tokenUsage: AgUiTokenUsage | null;
  suggestions: string[];
  tasks: AgUiTask[];
  sources: AgUiSource[];
  chainOfThought: AgUiChainOfThoughtStep[];

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
  const [toolCalls, setToolCalls] = useState<AgUiToolCall[]>([]);
  const [tokenUsage, setTokenUsage] = useState<AgUiTokenUsage | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tasks, setTasks] = useState<AgUiTask[]>([]);
  const [sources, setSources] = useState<AgUiSource[]>([]);
  const [chainOfThought, setChainOfThought] = useState<AgUiChainOfThoughtStep[]>([]);

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
            // RUN LIFECYCLE EVENTS
            if (chunk.type === 'RUN_STARTED') {
              console.log('[AG-UI] Run started');
              setIsStreaming(true);
            }

            if (chunk.type === 'RUN_FINISHED') {
              console.log('[AG-UI] Run finished');
              setIsStreaming(false);
            }

            if (chunk.type === 'RUN_ERROR' && chunk.error) {
              console.error('[AG-UI] Run error:', chunk.error);
              setError(new Error(chunk.error));
            }

            // TEXT MESSAGE EVENTS
            if (chunk.type === 'TEXT_MESSAGE_START') {
              console.log('[AG-UI] Text message started');
            }

            if (chunk.type === 'TEXT_MESSAGE_CONTENT' && chunk.data?.message) {
              setMessages(prev => {
                const newMessages = [...prev];
                const assistantMessageIndex = newMessages.length - 1;
                if (newMessages[assistantMessageIndex] && newMessages[assistantMessageIndex].role === 'assistant') {
                  newMessages[assistantMessageIndex] = {
                    ...newMessages[assistantMessageIndex],
                    content: (newMessages[assistantMessageIndex].content || '') + (chunk.data?.message || ''),
                  };
                }
                return newMessages;
              });
            }

            if (chunk.type === 'TEXT_MESSAGE_CHUNK' && chunk.delta) {
              setMessages(prev => {
                const newMessages = [...prev];
                const assistantMessageIndex = newMessages.length - 1;
                if (newMessages[assistantMessageIndex] && newMessages[assistantMessageIndex].role === 'assistant') {
                  newMessages[assistantMessageIndex] = {
                    ...newMessages[assistantMessageIndex],
                    content: (newMessages[assistantMessageIndex].content || '') + chunk.delta,
                  };
                }
                return newMessages;
              });
            }

            if (chunk.type === 'TEXT_MESSAGE_END') {
              console.log('[AG-UI] Text message ended');
            }

            // THINKING EVENTS
            if (chunk.type === 'THINKING_START') {
              console.log('[AG-UI] Thinking started');
              setChainOfThought(prev => [
                ...prev,
                { label: 'Thinking', description: 'AI is thinking...', status: 'active', content: '', type: 'reasoning' },
              ]);
            }

            if (chunk.type === 'THINKING_TEXT_MESSAGE_START') {
              console.log('[AG-UI] Thinking text message started');
            }

            if (chunk.type === 'THINKING_TEXT_MESSAGE_CONTENT' && chunk.thinking_part) {
              const thinkingPart = chunk.thinking_part;
              setMessages(prev => {
                const newMessages = [...prev];
                const assistantMessageIndex = newMessages.length - 1;
                if (newMessages[assistantMessageIndex] && newMessages[assistantMessageIndex].role === 'assistant') {
                  const currentThinkingParts = newMessages[assistantMessageIndex].thinking_parts || [];
                  newMessages[assistantMessageIndex] = {
                    ...newMessages[assistantMessageIndex],
                    thinking_parts: [...currentThinkingParts, thinkingPart],
                  };
                }
                return newMessages;
              });

              // Update chain of thought
              const thinkingContent = chunk.thinking_part.content || '';
              if (thinkingContent) {
                setChainOfThought(prev =>
                  prev.map((step, idx) =>
                    idx === prev.length - 1 && step.type === 'reasoning'
                      ? { ...step, content: step.content + thinkingContent }
                      : step
                  )
                );
              }
            }

            if (chunk.type === 'THINKING_TEXT_MESSAGE_END') {
              console.log('[AG-UI] Thinking text message ended');
            }

            if (chunk.type === 'THINKING_END') {
              console.log('[AG-UI] Thinking ended');
              setChainOfThought(prev =>
                prev.map((step, idx) =>
                  idx === prev.length - 1 && step.type === 'reasoning' ? { ...step, status: 'complete' } : step
                )
              );
            }

            // TOOL CALL EVENTS
            if (chunk.type === 'TOOL_CALL_START' && chunk.tool_name) {
              console.log('[AG-UI] Tool call started:', chunk.tool_name);
              setToolCalls(prev => [
                ...prev,
                {
                  name: chunk.tool_name!,
                  arguments: {},
                  status: 'pending',
                  tool_call_id: chunk.tool_call_id,
                },
              ]);

              setTasks(prev => [
                ...prev,
                {
                  key: chunk.tool_call_id || chunk.tool_name!,
                  value: `Starting ${chunk.tool_name}...`,
                  status: 'pending',
                },
              ]);

              setChainOfThought(prev => [
                ...prev,
                {
                  label: chunk.tool_name!,
                  description: `Calling ${chunk.tool_name}`,
                  status: 'active',
                  content: '',
                  type: 'function_call',
                },
              ]);
            }

            if (chunk.type === 'TOOL_CALL_ARGS' && chunk.tool_call_id) {
              console.log('[AG-UI] Tool call args:', chunk.args);
              setToolCalls(prev =>
                prev.map(tc =>
                  tc.tool_call_id === chunk.tool_call_id
                    ? { ...tc, arguments: { ...tc.arguments, ...(chunk.args || {}) }, status: 'executing' }
                    : tc
                )
              );

              setTasks(prev =>
                prev.map(task =>
                  task.key === chunk.tool_call_id
                    ? { ...task, value: `Executing with args: ${JSON.stringify(chunk.args).substring(0, 50)}...`, status: 'in_progress' as const }
                    : task
                )
              );
            }

            if (chunk.type === 'TOOL_CALL_CHUNK' && chunk.delta) {
              console.log('[AG-UI] Tool call chunk:', chunk.delta);
            }

            if (chunk.type === 'TOOL_CALL_RESULT' && chunk.tool_call_id) {
              console.log('[AG-UI] Tool call result:', chunk.result);
              setToolCalls(prev =>
                prev.map(tc =>
                  tc.tool_call_id === chunk.tool_call_id ? { ...tc, result: chunk.result, status: 'completed' } : tc
                )
              );

              setTasks(prev =>
                prev.map(task =>
                  task.key === chunk.tool_call_id ? { ...task, value: 'Completed successfully', status: 'completed' as const } : task
                )
              );

              setChainOfThought(prev =>
                prev.map(step =>
                  step.type === 'function_call' && step.status === 'active'
                    ? { ...step, status: 'complete', content: JSON.stringify(chunk.result).substring(0, 100) }
                    : step
                )
              );
            }

            if (chunk.type === 'TOOL_CALL_END') {
              console.log('[AG-UI] Tool call ended');
            }

            // STATE EVENTS
            if (chunk.type === 'STATE_SNAPSHOT' && chunk.data) {
              console.log('[AG-UI] State snapshot received');
              const snapshot = chunk.data as { tasks?: AgUiTask[]; sources?: AgUiSource[] };
              if (snapshot.tasks && Array.isArray(snapshot.tasks)) {
                setTasks(snapshot.tasks);
              }
              if (snapshot.sources && Array.isArray(snapshot.sources)) {
                setSources(snapshot.sources);
              }
            }

            if (chunk.type === 'STATE_DELTA' && chunk.data) {
              console.log('[AG-UI] State delta received');
            }

            if (chunk.type === 'MESSAGES_SNAPSHOT' && chunk.data) {
              console.log('[AG-UI] Messages snapshot received');
            }

            // STEP EVENTS
            if (chunk.type === 'STEP_STARTED') {
              console.log('[AG-UI] Step started');
              setTasks(prev => [
                ...prev,
                {
                  key: chunk.tool_name || chunk.messageId || 'unknown',
                  value: chunk.content || chunk.delta || 'Processing...',
                  status: 'in_progress',
                },
              ]);
            }

            if (chunk.type === 'STEP_FINISHED') {
              console.log('[AG-UI] Step finished');
              setTasks(prev =>
                prev.map(task =>
                  task.key === (chunk.tool_name || chunk.messageId) ? { ...task, status: 'completed' as const } : task
                )
              );
            }

            // CUSTOM EVENTS
            if (chunk.type === 'CUSTOM') {
              // Handle custom events with name and value structure
              const customData = chunk.data || chunk;

              // Token usage event
              if (chunk.usage) {
                console.log('[AG-UI] Token usage:', chunk.usage);
                setTokenUsage(chunk.usage);
              }
              if (customData && customData.usage) {
                console.log('[AG-UI] Token usage from data:', customData.usage);
                setTokenUsage(customData.usage);
              }

              // Suggestions event (name='suggestions')
              if (chunk.suggestions) {
                console.log('[AG-UI] Suggestions:', chunk.suggestions);
                setSuggestions(chunk.suggestions);
              }
              if (customData && customData.name === 'suggestions' && customData.value) {
                const suggestionData = customData.value;
                console.log('[AG-UI] Suggestions from custom:', suggestionData);
                if (Array.isArray(suggestionData)) {
                  setSuggestions(suggestionData);
                }
              }

              // Task update event (name='task_update')
              if (customData && customData.name === 'task_update' && customData.value?.tasks) {
                console.log('[AG-UI] Task update:', customData.value.tasks);
                setTasks(customData.value.tasks);
              }

              // Token usage event (name='token_usage')
              if (customData && customData.name === 'token_usage' && customData.value) {
                console.log('[AG-UI] Token usage from custom:', customData.value);
                setTokenUsage(customData.value);
              }
            }

            // RAW EVENTS
            if (chunk.type === 'RAW') {
              console.log('[AG-UI] Raw event:', chunk);
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
    toolCalls,
    tokenUsage,
    suggestions,
    tasks,
    sources,
    chainOfThought,

    // Actions
    sendMessage,
    createSession,
    clearMessages,
    setSessionId: updateSessionId,

    // Status
    hasSession: !!sessionId,
  };
}
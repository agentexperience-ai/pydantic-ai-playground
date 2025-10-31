"use client";

import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';

export interface MonitorEvent {
  type: 'agent_status' | 'tool_execution' | 'message_chunk' | 'custom_event';
  timestamp: number;
  data: unknown;
}

export interface UseAgUiMonitorOptions {
  onEvent?: (event: MonitorEvent) => void;
  onError?: (error: Error) => void;
}

export interface UseAgUiMonitorReturn {
  // State
  events: MonitorEvent[];
  isMonitoring: boolean;
  error: Error | null;

  // Actions
  startMonitoring: (sessionId: string, message: string) => Promise<void>;
  stopMonitoring: () => void;
  clearEvents: () => void;

  // Node/Edge update callbacks
  onAgentStatusChange: (status: 'idle' | 'running' | 'error') => void;
  onToolExecution: (toolId: string, executing: boolean) => void;
  onNewEvent: (
    eventType: 'TEXT_MESSAGE_CHUNK' | 'CUSTOM' | 'SUGGESTIONS' | 'TASK_UPDATE',
    label: string
  ) => void;
}

export function useAgUiMonitor(
  options: UseAgUiMonitorOptions = {}
): UseAgUiMonitorReturn {
  const { onEvent, onError } = options;

  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const onAgentStatusChange = useCallback(
    (status: 'idle' | 'running' | 'error') => {
      const event: MonitorEvent = {
        type: 'agent_status',
        timestamp: Date.now(),
        data: { status },
      };
      setEvents((prev) => [...prev, event]);
      onEvent?.(event);
    },
    [onEvent]
  );

  const onToolExecution = useCallback(
    (toolId: string, executing: boolean) => {
      const event: MonitorEvent = {
        type: 'tool_execution',
        timestamp: Date.now(),
        data: { toolId, executing },
      };
      setEvents((prev) => [...prev, event]);
      onEvent?.(event);
    },
    [onEvent]
  );

  const onNewEvent = useCallback(
    (
      eventType: 'TEXT_MESSAGE_CHUNK' | 'CUSTOM' | 'SUGGESTIONS' | 'TASK_UPDATE',
      label: string
    ) => {
      const event: MonitorEvent = {
        type: 'custom_event',
        timestamp: Date.now(),
        data: { eventType, label },
      };
      setEvents((prev) => [...prev, event]);
      onEvent?.(event);
    },
    [onEvent]
  );

  const startMonitoring = useCallback(
    async (sessionId: string, message: string) => {
      try {
        setIsMonitoring(true);
        setError(null);
        onAgentStatusChange('running');

        // Create abort controller
        abortControllerRef.current = new AbortController();

        // Send AG-UI request to backend
        const response = await fetch('http://localhost:8000/agui', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            threadId: sessionId,
            runId: `run-${Date.now()}`,
            state: [],
            messages: [
              {
                role: 'user',
                content: message,
                id: `user-${Date.now()}`,
              },
            ],
            tools: [],
            context: [],
            forwardedProps: {},
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onAgentStatusChange('idle');
            setIsMonitoring(false);
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();

              // Skip empty data lines
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);

                // Track different event types
                if (data.type === 'TEXT_MESSAGE_CHUNK') {
                  onNewEvent('TEXT_MESSAGE_CHUNK', 'Message Chunk');
                }

                if (data.type === 'CUSTOM') {
                  const customData = data.data || data;

                  if (customData.name === 'suggestions') {
                    onNewEvent('SUGGESTIONS', 'Suggestions');
                  }

                  if (customData.name === 'task_update') {
                    onNewEvent('TASK_UPDATE', 'Task Update');
                  }

                  // Tool execution detection
                  if (customData.name === 'tool_call') {
                    onToolExecution(customData.value?.tool_id || 'unknown', true);
                  }
                }
              } catch (parseError) {
                // Log the problematic line for debugging
                console.warn('Failed to parse SSE data:', {
                  error: parseError,
                  line: dataStr.substring(0, 100),
                });
                // Continue processing other lines
              }
            }
          }
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error('Monitoring failed');
        setError(errorObj);
        onError?.(errorObj);
        onAgentStatusChange('error');
        setIsMonitoring(false);
      }
    },
    [onAgentStatusChange, onNewEvent, onToolExecution, onError]
  );

  const stopMonitoring = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsMonitoring(false);
    onAgentStatusChange('idle');
  }, [onAgentStatusChange]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
    clearEvents,
    onAgentStatusChange,
    onToolExecution,
    onNewEvent,
  };
}

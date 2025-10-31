/**
 * AG-UI (Agent User Interaction) Protocol Client
 *
 * Provides type-safe communication with the pydantic-ai AG-UI backend
 */

export interface AgUiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  thinking_parts?: AgUiThinkingPart[];
}

export interface AgUiThinkingPart {
  type: 'reasoning' | 'text' | 'function_call';
  content: string;
  id?: string;
}

export interface AgUiToolCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'executing' | 'completed' | 'error';
}

export interface AgUiResponse {
  message: string;
  tool_calls?: AgUiToolCall[];
  metadata?: {
    streaming?: boolean;
    complete?: boolean;
    session_id?: string;
  };
}

export interface AgUiSession {
  session_id: string;
  messages: AgUiMessage[];
  metadata?: Record<string, any>;
}

export interface AgUiTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
}

export interface AgUiStreamChunk {
  // Standard AG-UI protocol event types
  type:
    | 'RUN_STARTED'
    | 'RUN_FINISHED'
    | 'RUN_ERROR'
    | 'TEXT_MESSAGE_START'
    | 'TEXT_MESSAGE_CONTENT'
    | 'TEXT_MESSAGE_END'
    | 'TEXT_MESSAGE_CHUNK'
    | 'THINKING_START'
    | 'THINKING_END'
    | 'THINKING_TEXT_MESSAGE_START'
    | 'THINKING_TEXT_MESSAGE_CONTENT'
    | 'THINKING_TEXT_MESSAGE_END'
    | 'TOOL_CALL_START'
    | 'TOOL_CALL_ARGS'
    | 'TOOL_CALL_END'
    | 'TOOL_CALL_RESULT'
    | 'TOOL_CALL_CHUNK'
    | 'STATE_SNAPSHOT'
    | 'STATE_DELTA'
    | 'MESSAGES_SNAPSHOT'
    | 'STEP_STARTED'
    | 'STEP_FINISHED'
    | 'CUSTOM'
    | 'RAW';
  data?: Partial<AgUiResponse> & {
    name?: string;
    value?: any;
    usage?: AgUiTokenUsage;
    tasks?: any[];
  };
  session_id?: string;
  // Standard AG-UI fields
  delta?: string;
  messageId?: string;
  tool_call_id?: string;
  tool_name?: string;
  args?: Record<string, any>;
  content?: string;
  result?: any;
  role?: string;
  error?: string;
  // Custom fields for our app
  thinking_part?: AgUiThinkingPart;
  usage?: AgUiTokenUsage;
  suggestions?: string[];
  // Custom event fields
  name?: string;
  value?: any;
}

class AgUiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a message to the AG-UI endpoint and get streaming response
   */
  async sendMessage(
    message: string,
    sessionId?: string,
    onChunk?: (chunk: AgUiStreamChunk) => void
  ): Promise<AgUiResponse> {
    // Generate IDs for AG-UI protocol
    const threadId = sessionId || `thread-${Date.now()}`;
    const runId = `run-${Date.now()}`;

    const response = await fetch(`${this.baseUrl}/agui`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId,
        runId,
        state: [],
        messages: [{
          role: "user",
          content: message,
          id: "user-1"
        }],
        tools: [],
        context: [],
        forwardedProps: {}
      }),
    });

    if (!response.ok) {
      throw new Error(`AG-UI request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from AG-UI endpoint');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let currentMessageId: string | null = null;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              // Handle standard AG-UI protocol events
              if (data.type === 'TEXT_MESSAGE_START') {
                currentMessageId = data.message_id;
                fullResponse = '';
              } else if (data.type === 'TEXT_MESSAGE_CONTENT') {
                if (data.delta) {
                  fullResponse += data.delta;
                }
              }

              if (onChunk) {
                const chunkData: AgUiStreamChunk = {
                  type: data.type || 'TEXT_MESSAGE_CONTENT',
                  data: {
                    message: data.delta || fullResponse,
                    metadata: {
                      streaming: data.type !== 'RUN_FINISHED',
                      complete: data.type === 'RUN_FINISHED',
                      session_id: threadId,
                    },
                  },
                  session_id: threadId,
                  // Map AG-UI fields - use currentMessageId to track message across chunks
                  delta: data.delta,
                  messageId: currentMessageId || data.message_id,
                  tool_call_id: data.tool_call_id,
                  tool_name: data.tool_name,
                  args: data.args,
                  content: data.content,
                  result: data.result,
                  role: data.role,
                  error: data.error,
                };

                // Handle thinking content
                if (data.type === 'THINKING_TEXT_MESSAGE_CONTENT' && data.delta) {
                  chunkData.thinking_part = {
                    type: 'reasoning',
                    content: data.delta,
                  };
                }

                // Handle CUSTOM events for token usage and suggestions
                if (data.type === 'CUSTOM') {
                  if (data.name === 'token_usage' && data.value) {
                    chunkData.usage = data.value;
                  } else if (data.name === 'suggestions' && Array.isArray(data.value)) {
                    chunkData.suggestions = data.value;
                  }
                }

                onChunk(chunkData);
              }
            } catch (e) {
              console.warn('Failed to parse AG-UI chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Create properly typed response
    const agUiResponse: AgUiResponse = {
      message: fullResponse,
      metadata: {
        streaming: false,
        complete: true,
        session_id: threadId,
      },
    };

    return agUiResponse;
  }

  /**
   * Create a new chat session
   */
  async createSession(): Promise<AgUiSession> {
    const response = await fetch(`${this.baseUrl}/api/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      session_id: data.session_id,
      messages: [],
      metadata: {},
    };
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<AgUiSession> {
    const response = await fetch(`${this.baseUrl}/api/session/${sessionId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Session not found: ${sessionId}`);
      }
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      session_id: data.session_id,
      messages: data.messages || [],
      metadata: data.metadata || {},
    };
  }

  /**
   * Get memory summary
   */
  async getMemorySummary(): Promise<{
    user_preferences: number;
    user_facts: number;
    notes: number;
    conversation_history: number;
    created_at?: string;
    updated_at?: string;
  }> {
    const response = await fetch(`${this.baseUrl}/api/memory`);

    if (!response.ok) {
      throw new Error(`Failed to get memory summary: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Add a user fact to memory
   */
  async addUserFact(factKey: string, factValue: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/memory/fact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fact_key: factKey,
        fact_value: factValue,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to add user fact: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Clear all memory
   */
  async clearMemory(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/memory`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear memory: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get available models
   */
  async getAvailableModels(): Promise<{
    models: Array<{
      id: string;
      name: string;
      provider: string;
      family: string;
      supports_thinking: boolean;
      description: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/api/models`);

    if (!response.ok) {
      throw new Error(`Failed to get available models: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelId: string): Promise<{ message: string; current_model: string }> {
    const response = await fetch(`${this.baseUrl}/api/model/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_id: modelId }),
    });

    if (!response.ok) {
      throw new Error(`Failed to switch model: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Create and export a singleton instance
export const agUiClient = new AgUiClient();

// Export the class for testing or custom instances
export { AgUiClient };
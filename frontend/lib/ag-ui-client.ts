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
  type: 'message' | 'tool_call' | 'metadata' | 'RUN_STARTED' | 'TEXT_MESSAGE_START' | 'TEXT_MESSAGE_CONTENT' | 'TEXT_MESSAGE_END' | 'RUN_FINISHED' | 'THINKING_PART' | 'TOKEN_USAGE' | 'SUGGESTIONS' | 'TOOL_CALL' | 'ERROR';
  data: Partial<AgUiResponse>;
  session_id?: string;
  thinking_part?: AgUiThinkingPart;
  usage?: AgUiTokenUsage;
  suggestions?: string[];
  toolName?: string;
  args?: Record<string, any>;
  error?: string;
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

              // Handle AG-UI protocol events
              if (data.type === 'TEXT_MESSAGE_START') {
                currentMessageId = data.messageId;
                fullResponse = '';
              } else if (data.type === 'TEXT_MESSAGE_CONTENT' && data.messageId === currentMessageId) {
                fullResponse += data.delta;
              }

              if (onChunk) {
                const chunkData: AgUiStreamChunk = {
                  type: data.type || 'message',
                  data: {
                    message: data.delta || fullResponse,
                    tool_calls: data.tool_calls,
                    metadata: {
                      streaming: data.type !== 'RUN_FINISHED',
                      complete: data.type === 'RUN_FINISHED',
                      session_id: data.threadId,
                    },
                  },
                  session_id: data.threadId,
                };

                // Handle thinking parts if present
                if (data.thinking_part) {
                  chunkData.thinking_part = {
                    type: data.thinking_part.type,
                    content: data.thinking_part.content,
                    id: data.thinking_part.id,
                  };
                }

                // Handle token usage if present
                if (data.usage) {
                  chunkData.usage = data.usage;
                }

                // Handle suggestions if present
                if (data.suggestions) {
                  chunkData.suggestions = data.suggestions;
                }

                // Handle tool calls if present
                if (data.toolName) {
                  chunkData.toolName = data.toolName;
                  chunkData.args = data.args;
                }

                // Handle errors if present
                if (data.error) {
                  chunkData.error = data.error;
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

    return {
      message: fullResponse,
      metadata: {
        streaming: false,
        complete: true,
        session_id: threadId,
      },
    };
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
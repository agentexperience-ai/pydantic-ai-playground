/**
 * Demo AG-UI Data Loader
 *
 * Loads comprehensive demo data that mimics real AG-UI responses
 * to showcase all available components when no conversation is active
 */

import demoData from './demo-ag-ui-data.json';
import type { AgUiMessage } from './ag-ui-client';

export interface DemoToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  status: 'pending' | 'executing' | 'completed' | 'error';
}

export interface DemoTokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedInputTokens: number;
  reasoningTokens: number;
}

export interface DemoChainOfThoughtStep {
  label: string;
  description: string;
  status: 'active' | 'complete' | 'pending';
  content: string;
  type?: 'text' | 'reasoning' | 'function_call';
}

export interface DemoSource {
  href: string;
  title: string;
}

export interface DemoTask {
  key: string;
  value: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface DemoPlanStep {
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
}

export interface DemoQueueItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  attachments: Array<{
    type: 'image' | 'file';
    name: string;
    description: string;
  }>;
}

export interface DemoImage {
  alt: string;
  base64: string;
  mediaType: string;
  caption?: string;
}

export interface DemoInlineCitation {
  text: string;
  sources: Array<{
    title: string;
    url: string;
    description: string;
  }>;
}

export interface DemoAgUiData {
  messages: AgUiMessage[];
  toolCalls: DemoToolCall[];
  tokenUsage: DemoTokenUsage;
  suggestions: string[];
  chainOfThought: DemoChainOfThoughtStep[];
  tasks: DemoTask[];
  sources: DemoSource[];
  plan: {
    title: string;
    description: string;
    steps: DemoPlanStep[];
  };
  queue: {
    pending: DemoQueueItem[];
  };
  context: {
    modelId: string;
    maxTokens: number;
    usedTokens: number;
    usage: DemoTokenUsage;
  };
  branch: {
    current: number;
    alternatives: Array<{
      id: number;
      message: string;
      timestamp: number;
    }>;
  };
  images: DemoImage[];
  webPreview: {
    url: string;
    title: string;
    description: string;
  };
  inlineCitation: DemoInlineCitation;
}

/**
 * Load demo AG-UI data
 * This data showcases all available components with realistic content
 */
export function loadDemoAgUiData(): DemoAgUiData {
  return {
    messages: demoData.messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      timestamp: msg.timestamp,
      thinking_parts: (msg as typeof demoData.messages[1])?.thinking_parts?.map(part => ({
        type: part.type as 'reasoning' | 'text' | 'function_call',
        content: part.content,
        id: part.id,
      })),
    })),
    toolCalls: demoData.toolCalls.map(call => ({
      name: call.name,
      arguments: call.arguments,
      result: call.result,
      status: call.status as 'completed',
    })),
    tokenUsage: demoData.tokenUsage,
    suggestions: demoData.suggestions,
    chainOfThought: demoData.chainOfThought.map(step => ({
      label: step.label,
      description: step.description,
      status: step.status as 'active' | 'complete' | 'pending',
      content: step.content,
      type: step.type as 'text' | 'reasoning' | 'function_call' | undefined,
    })),
    tasks: demoData.tasks.map(task => ({
      key: task.key,
      value: task.value,
      status: task.status as 'pending' | 'in_progress' | 'completed' | undefined,
    })),
    sources: demoData.sources,
    plan: {
      title: demoData.plan.title,
      description: demoData.plan.description,
      steps: demoData.plan.steps.map(step => ({
        title: step.title,
        description: step.description,
        status: step.status as 'completed' | 'in_progress' | 'pending',
      })),
    },
    queue: {
      pending: demoData.queue.pending.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        priority: item.priority as 'high' | 'medium' | 'low',
        attachments: item.attachments.map(att => ({
          type: att.type as 'image' | 'file',
          name: att.name,
          description: att.description,
        })),
      })),
    },
    context: {
      modelId: demoData.context.modelId,
      maxTokens: demoData.context.maxTokens,
      usedTokens: demoData.context.usedTokens,
      usage: demoData.context.usage,
    },
    branch: demoData.branch,
    images: demoData.images,
    webPreview: demoData.webPreview,
    inlineCitation: demoData.inlineCitation,
  };
}

/**
 * Check if we should use demo data
 * Demo data is used when there are no real AG-UI messages
 */
export function shouldUseDemoData(realMessagesCount: number): boolean {
  return realMessagesCount === 0;
}

/**
 * Get empty state message for a component type
 */
export function getEmptyStateMessage(componentType: string): string {
  const emptyStates: Record<string, string> = {
    chainOfThought: 'No reasoning steps available yet. Start a conversation to see the AI\'s thought process.',
    toolCalls: 'No tool calls yet. The AI will use tools when needed to answer your questions.',
    sources: 'No sources cited yet. Ask questions that require external references.',
    tasks: 'No tasks identified yet. Complex queries will generate task breakdowns.',
    queue: 'No pending items. Future follow-up tasks will appear here.',
    images: 'No images generated yet. Ask for visualizations or diagrams.',
    webPreview: 'No web content to preview. Ask for web-based resources.',
    branch: 'No alternative branches yet. You can explore different conversation paths.',
    suggestions: 'No suggestions available. Start a conversation to see contextual follow-up questions.',
  };

  return emptyStates[componentType] || 'No data available yet for this component.';
}

'use client';

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

// AI Elements Components - ALL COMPONENTS INCLUDED
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message"
import { Actions, Action } from "@/components/ai-elements/actions"
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactActions, ArtifactAction, ArtifactContent } from "@/components/ai-elements/artifact"
import { CodeBlock, CodeBlockCopyButton } from "@/components/ai-elements/code-block"
import { Loader } from "@/components/ai-elements/loader"
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources"
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion"
import { Task, TaskTrigger, TaskContent, TaskItem, TaskItemFile } from "@/components/ai-elements/task"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep, ChainOfThoughtSearchResults, ChainOfThoughtSearchResult, ChainOfThoughtImage } from "@/components/ai-elements/chain-of-thought"
import { Plan, PlanHeader, PlanTitle, PlanDescription, PlanContent, PlanTrigger } from "@/components/ai-elements/plan"
import { Response } from "@/components/ai-elements/response"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { Branch, BranchMessages, BranchSelector, BranchPrevious, BranchPage, BranchNext } from "@/components/ai-elements/branch"
import { Context, ContextTrigger, ContextContent, ContextContentHeader, ContextContentBody, ContextInputUsage, ContextOutputUsage, ContextReasoningUsage, ContextCacheUsage, ContextContentFooter } from "@/components/ai-elements/context"
import { Image } from "@/components/ai-elements/image"
import { OpenIn, OpenInTrigger, OpenInContent, OpenInChatGPT, OpenInClaude, OpenInT3, OpenInScira, OpenInv0, OpenInCursor } from "@/components/ai-elements/open-in-chat"
import { Queue, QueueSection, QueueSectionTrigger, QueueSectionLabel, QueueSectionContent, QueueList, QueueItem, QueueItemIndicator, QueueItemContent, QueueItemActions, QueueItemAction, QueueItemAttachment, QueueItemImage, QueueItemFile, QueueItemDescription } from "@/components/ai-elements/queue"
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool"
import { WebPreview, WebPreviewNavigation, WebPreviewNavigationButton, WebPreviewUrl, WebPreviewBody, WebPreviewConsole } from "@/components/ai-elements/web-preview"
import { InlineCitation, InlineCitationText, InlineCitationCard, InlineCitationCardTrigger, InlineCitationCardBody, InlineCitationCarousel, InlineCitationCarouselHeader, InlineCitationCarouselPrev, InlineCitationCarouselNext, InlineCitationCarouselIndex, InlineCitationCarouselContent, InlineCitationCarouselItem, InlineCitationSource } from "@/components/ai-elements/inline-citation"
import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputFooter, PromptInputTools, PromptInputSubmit, PromptInputActionMenu, PromptInputActionMenuTrigger, PromptInputActionMenuContent, PromptInputActionAddAttachments, PromptInputSpeechButton, PromptInputButton, PromptInputModelSelect, PromptInputModelSelectTrigger, PromptInputModelSelectValue, PromptInputModelSelectContent, PromptInputModelSelectItem, PromptInputAttachments, PromptInputAttachment } from "@/components/ai-elements/prompt-input"

// AG-UI Hooks
import { useAgUiChat } from '@/hooks/use-ag-ui-chat'
import { useAgUiMemory } from '@/hooks/use-ag-ui-memory'
import { agUiClient } from '@/lib/ag-ui-client'

// Demo Data Loader
import { loadDemoAgUiData, shouldUseDemoData, getEmptyStateMessage } from '@/lib/demo-ag-ui-loader'

import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  ShareIcon,
  PlayIcon,
  DownloadIcon,
  GlobeIcon,
  RefreshCcwIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  Maximize2Icon,
  MousePointerClickIcon,
  ImageIcon,
  SearchIcon,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { useState, useEffect, useMemo } from 'react'

// Types for AG-UI structured data
type ChainOfThoughtStep = {
  label: string;
  description: string;
  status: 'active' | 'complete' | 'pending';
  content: string;
  type?: 'text' | 'reasoning' | 'function_call';
};

type SourceData = {
  href: string;
  title: string;
};

type TaskData = {
  key: string;
  value: string;
};

type ReasoningData = {
  content: string;
  parts?: Array<{ type: string; content: string; id?: string }>;
};

type AgUiComponentData = {
  type: 'message' | 'chain_of_thought' | 'plan' | 'artifact' | 'sources' | 'tasks' | 'reasoning' | 'response' | 'branch' | 'context' | 'image' | 'open_in' | 'queue' | 'tool' | 'web_preview' | 'inline_citation';
  data:
    | ChainOfThoughtStep[]
    | SourceData[]
    | TaskData[]
    | ReasoningData
    | { content: string; timestamp?: number }
    | { title: string; description: string; code: string; language: string }
    | Record<string, unknown>;
};

export default function Page() {
  // AG-UI Chat Hook
  const {
    messages: agUiMessages,
    isLoading,
    isStreaming,
    sendMessage,
    toolCalls,
    tokenUsage,
    suggestions: dynamicSuggestions,
    tasks: dynamicTasks,
    sources: dynamicSources,
    chainOfThought: dynamicChainOfThought,
  } = useAgUiChat({
    onSessionChange: (newSessionId) => {
      console.log('Session changed:', newSessionId);
    },
    onError: (error) => {
      console.error('AG-UI Error:', error);
    },
  });

  // AG-UI Memory Hook
  const { loadMemorySummary } = useAgUiMemory();

  // Load demo data for showcase when no conversation
  const demoData = useMemo(() => loadDemoAgUiData(), []);
  const useDemo = shouldUseDemoData(agUiMessages.length);

  // Models state
  const [availableModels, setAvailableModels] = useState<Array<{
    id: string;
    name: string;
    provider: string;
    family: string;
    supports_thinking: boolean;
    description: string;
  }>>([]);

  // Load memory summary and models on component mount
  useEffect(() => {
    loadMemorySummary();

    // Load available models
    const loadModels = async () => {
      try {
        const modelsData = await agUiClient.getAvailableModels();
        setAvailableModels(modelsData.models);
      } catch (error) {
        console.error('Failed to load models:', error);
      }
    };

    loadModels();
  }, [loadMemorySummary]);

  // Data source selectors - use demo when no real conversation
  const activeMessages = useDemo ? demoData.messages : agUiMessages;
  const activeSuggestions = useDemo ? demoData.suggestions : (dynamicSuggestions.length > 0 ? dynamicSuggestions : []);
  const activeToolCalls = useDemo ? demoData.toolCalls : toolCalls;
  const activeTokenUsage = useDemo ? demoData.tokenUsage : tokenUsage;
  const activeChainOfThought = useDemo ? demoData.chainOfThought : dynamicChainOfThought;
  const activeTasks = useDemo ? demoData.tasks : dynamicTasks;
  const activeSources = useDemo ? demoData.sources : dynamicSources;

  // Parse AG-UI messages and extract structured data for components
  const structuredData = useMemo(() => {
    if (useDemo) {
      // Use pre-structured demo data
      const parsedData: AgUiComponentData[] = [];

      // Add demo chain of thought
      if (demoData.chainOfThought.length > 0) {
        parsedData.push({
          type: 'chain_of_thought',
          data: demoData.chainOfThought
        });
      }

      // Add demo artifacts (extract code blocks from demo messages)
      demoData.messages.forEach((msg) => {
        if (msg.role === 'assistant') {
          const codeBlocks = msg.content.match(/```(?:\w+)?\n([\s\S]*?)```/g);
          if (codeBlocks) {
            codeBlocks.forEach((block, blockIndex) => {
              const codeMatch = block.match(/```(\w+)?\n([\s\S]*?)```/);
              if (codeMatch) {
                parsedData.push({
                  type: 'artifact',
                  data: {
                    title: `Code Block ${blockIndex + 1}`,
                    description: 'Demo implementation from comprehensive example',
                    code: codeMatch[2],
                    language: codeMatch[1] || 'python',
                  }
                });
              }
            });
          }

          // Add demo response
          parsedData.push({
            type: 'response',
            data: {
              content: msg.content,
              timestamp: msg.timestamp
            }
          });
        }
      });

      // Add demo sources
      if (demoData.sources.length > 0) {
        parsedData.push({
          type: 'sources',
          data: demoData.sources
        });
      }

      // Add demo reasoning
      if (demoData.messages.some(m => m.thinking_parts)) {
        const thinkingMsg = demoData.messages.find(m => m.thinking_parts);
        if (thinkingMsg?.thinking_parts) {
          parsedData.push({
            type: 'reasoning',
            data: {
              content: thinkingMsg.thinking_parts.map(part => part.content).join('\n\n'),
              parts: thinkingMsg.thinking_parts
            }
          });
        }
      }

      return parsedData;
    }

    // Original real AG-UI data parsing logic
    const parsedData: AgUiComponentData[] = [];

    // Process each AG-UI message to extract structured information
    agUiMessages.forEach((msg, index) => {
      if (msg.role === 'assistant') {
        // Handle thinking parts from AG-UI protocol - PRIMARY SOURCE OF REASONING DATA
        if (msg.thinking_parts && msg.thinking_parts.length > 0) {
          // Create Chain of Thought from structured thinking parts
          const reasoningSteps = msg.thinking_parts.map((thinkingPart, partIndex) => ({
            label: `Step ${partIndex + 1}`,
            description: thinkingPart.content.substring(0, 100) + '...',
            status: (partIndex === msg.thinking_parts!.length - 1 ? 'active' : 'complete') as 'active' | 'complete' | 'pending',
            content: thinkingPart.content,
            type: thinkingPart.type
          }));

          parsedData.push({
            type: 'chain_of_thought',
            data: reasoningSteps
          });

          // Also create Reasoning component for thinking parts
          parsedData.push({
            type: 'reasoning',
            data: {
              content: msg.thinking_parts.map(part => part.content).join('\n\n'),
              parts: msg.thinking_parts
            }
          });
        }

        // Parse the content to extract structured information
        const content = msg.content || '';

        // Extract code blocks for Artifact component
        const codeBlocks = content.match(/```(?:\w+)?\n([\s\S]*?)```/g);
        if (codeBlocks) {
          codeBlocks.forEach((block, blockIndex) => {
            const codeMatch = block.match(/```(?:\w+)?\n([\s\S]*?)```/);
            if (codeMatch) {
              parsedData.push({
                type: 'artifact',
                data: {
                  title: `Code Block ${blockIndex + 1}`,
                  description: 'Generated code implementation',
                  code: codeMatch[1],
                  language: 'python',
                }
              });
            }
          });
        }

        // Extract URLs for Sources component
        const urlRegex = /https?:\/\/[^\s)]+/g;
        const urls = content.match(urlRegex);
        if (urls && urls.length > 0) {
          parsedData.push({
            type: 'sources',
            data: urls.map(url => ({
              href: url,
              title: url.split('/')[2] // Extract domain name
            }))
          });
        }

        // Extract step-by-step reasoning for Chain of Thought (if no thinking parts)
        if (!msg.thinking_parts || msg.thinking_parts.length === 0) {
          const steps = content.split(/\d+\.\s+/).filter(step => step.trim().length > 0);
          if (steps.length > 1) {
            parsedData.push({
              type: 'chain_of_thought',
              data: steps.map((step, stepIndex) => ({
                label: `Step ${stepIndex + 1}`,
                description: step.substring(0, 100) + '...',
                status: (stepIndex === steps.length - 1 ? 'active' : 'complete') as 'active' | 'complete' | 'pending',
                content: step
              }))
            });
          }
        }

        // Extract tasks/todo items
        const taskRegex = /[-•*]\s+(.+?)(?=\n[-•*]|\n\n|$)/g;
        const tasks = [];
        let match;
        while ((match = taskRegex.exec(content)) !== null) {
          tasks.push(match[1]);
        }
        if (tasks.length > 0) {
          parsedData.push({
            type: 'tasks',
            data: tasks.map((task, taskIndex) => ({
              key: `task-${index}-${taskIndex}`,
              value: task
            }))
          });
        }

        // Add main message as Response component
        parsedData.push({
          type: 'response',
          data: {
            content: content,
            timestamp: msg.timestamp
          }
        });
      }
    });

    return parsedData;
  }, [useDemo, demoData, agUiMessages]);

  // Convert AG-UI messages to dashboard format
  const messages = activeMessages.map((msg, index) => ({
    key: `msg-${index}-${msg.timestamp || index}`,
    from: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
    content: msg.content,
    avatar: msg.role === 'user'
      ? 'https://github.com/haydenbleasel.png'
      : 'https://github.com/openai.png',
    name: msg.role === 'user' ? 'User' : 'AI Assistant',
    type: 'message' as const,
  }));

  const [inputText, setInputText] = useState('')
  const [model, setModel] = useState('openai:gpt-5')

  const handleSubmit = async (message: { text?: string }) => {
    if (!message.text?.trim()) return

    try {
      await sendMessage(message.text);
      setInputText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  const handleModelChange = async (newModelId: string) => {
    try {
      await agUiClient.switchModel(newModelId);
      setModel(newModelId);
      console.log(`Switched to model: ${newModelId}`);
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion)
  }

  const suggestions = [
    'Explain how Dijkstra\'s algorithm works',
    'Show me a Python implementation',
    'What are the time and space complexities?',
    'Can you provide a visualization?',
    'How does it compare to other pathfinding algorithms?'
  ]

  const sampleSources = [
    { href: 'https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm', title: 'Dijkstra\'s Algorithm - Wikipedia' },
    { href: 'https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/', title: 'GeeksforGeeks Implementation' },
    { href: 'https://docs.python.org/3/library/heapq.html', title: 'Python heapq Documentation' }
  ]

  const sampleTasks = [
    { key: nanoid(), value: 'Analyzing algorithm requirements' },
    { key: nanoid(), value: 'Implementing priority queue with heapq' },
    { key: nanoid(), value: 'Testing with sample graph data' },
    { key: nanoid(), value: 'Optimizing for performance' }
  ]

  const dijkstraCode = `import heapq

def dijkstra(graph, start):
    distances = {node: float('inf') for node in graph}
    distances[start] = 0
    heap = [(0, start)]
    visited = set()

    while heap:
        current_distance, current_node = heapq.heappop(heap)
        if current_node in visited:
            continue
        visited.add(current_node)

        for neighbor, weight in graph[current_node].items():
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                heapq.heappush(heap, (distance, neighbor))

    return distances

# Example usage
graph = {
    'A': {'B': 1, 'C': 4},
    'B': {'A': 1, 'C': 2, 'D': 5},
    'C': {'A': 4, 'B': 2, 'D': 1},
    'D': {'B': 5, 'C': 1}
}

print(dijkstra(graph, 'A'))  # Output: {'A': 0, 'B': 1, 'C': 3, 'D': 4}`

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    AI Assistant
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Chat Interface</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col h-[calc(100vh-4rem)]">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* AI Elements Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 flex-1 min-h-0">
              {/* Left Column - Chat Interface */}
              <div className="lg:col-span-2 space-y-4">
                {/* Conversation Component */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Conversation className="h-96">
                    <ConversationContent>
                      {messages.length === 0 ? (
                        <ConversationEmptyState
                          icon={<div className="size-6 bg-blue-500 rounded-full flex items-center justify-center text-white">AI</div>}
                          title="Start a conversation"
                          description="Ask me anything about algorithms, code, or AI concepts"
                        />
                      ) : (
                        <>
                          {messages.map((message) => (
                            <Message from={message.from} key={message.key}>
                              <MessageContent>{message.content}</MessageContent>
                              <MessageAvatar name={message.name} src={message.avatar} />
                              {message.from === 'assistant' && (
                                <Actions className="mt-2">
                                  <Action label="Like">
                                    <ThumbsUpIcon className="size-4" />
                                  </Action>
                                  <Action label="Dislike">
                                    <ThumbsDownIcon className="size-4" />
                                  </Action>
                                  <Action label="Copy">
                                    <CopyIcon className="size-4" />
                                  </Action>
                                  <Action label="Share">
                                    <ShareIcon className="size-4" />
                                  </Action>
                                </Actions>
                              )}
                            </Message>
                          ))}
                          {(isLoading || isStreaming) && (
                            <Message from="assistant">
                              <MessageContent>
                                <div className="flex items-center gap-2">
                                  <Loader />
                                  <Shimmer>
                                    {isStreaming ? 'Streaming response...' : 'Generating response...'}
                                  </Shimmer>
                                </div>
                              </MessageContent>
                              <MessageAvatar name="AI Assistant" src="https://github.com/openai.png" />
                            </Message>
                          )}
                        </>
                      )}
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>
                </div>

                {/* Dynamically rendered AI Elements components from AG-UI data */}
                {structuredData.map((component, index) => {
                  switch (component.type) {
                    case 'chain_of_thought':
                      const chainData = component.data as ChainOfThoughtStep[];
                      return (
                        <ChainOfThought key={`cot-${index}`} defaultOpen>
                          <ChainOfThoughtHeader>
                            Reasoning Process
                          </ChainOfThoughtHeader>
                          <ChainOfThoughtContent>
                            {chainData.map((step, stepIndex) => (
                              <ChainOfThoughtStep
                                key={`step-${stepIndex}`}
                                label={step.label}
                                description={step.description}
                                status={step.status}
                              >
                                <Response>
                                  {step.content}
                                </Response>
                              </ChainOfThoughtStep>
                            ))}
                          </ChainOfThoughtContent>
                        </ChainOfThought>
                      );

                    case 'artifact':
                      const artifactData = component.data as { title: string; description: string; code: string; language: string };
                      return (
                        <Artifact key={`artifact-${index}`}>
                          <ArtifactHeader>
                            <div>
                              <ArtifactTitle>{artifactData.title}</ArtifactTitle>
                              <ArtifactDescription>{artifactData.description}</ArtifactDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <ArtifactActions>
                                <ArtifactAction
                                  icon={PlayIcon}
                                  label="Run"
                                  onClick={() => console.log('Run code')}
                                  tooltip="Run code"
                                />
                                <ArtifactAction
                                  icon={CopyIcon}
                                  label="Copy"
                                  onClick={() => console.log('Copy code')}
                                  tooltip="Copy to clipboard"
                                />
                                <ArtifactAction
                                  icon={DownloadIcon}
                                  label="Download"
                                  onClick={() => console.log('Download')}
                                  tooltip="Download file"
                                />
                              </ArtifactActions>
                            </div>
                          </ArtifactHeader>
                          <ArtifactContent className="p-0">
                            <CodeBlock
                              className="border-none"
                              code={artifactData.code}
                              language={artifactData.language}
                              showLineNumbers
                            >
                              <CodeBlockCopyButton
                                onCopy={() => console.log('Code copied to clipboard')}
                                onError={() => console.error('Failed to copy code')}
                              />
                            </CodeBlock>
                          </ArtifactContent>
                        </Artifact>
                      );

                    case 'sources':
                      const sourcesData = component.data as SourceData[];
                      return (
                        <Sources key={`sources-${index}`}>
                          <SourcesTrigger count={sourcesData.length} />
                          <SourcesContent>
                            {sourcesData.map((source, sourceIndex) => (
                              <Source href={source.href} key={`source-${sourceIndex}`} title={source.title} />
                            ))}
                          </SourcesContent>
                        </Sources>
                      );

                    case 'reasoning':
                      const reasoningData = component.data as ReasoningData;
                      return (
                        <div key={`reasoning-${index}`} className="bg-card rounded-lg border shadow-sm">
                          <Reasoning>
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {reasoningData.content}
                            </ReasoningContent>
                          </Reasoning>
                        </div>
                      );

                    case 'response':
                      const responseData = component.data as { content: string; timestamp?: number };
                      return (
                        <div key={`response-${index}`} className="bg-card rounded-lg border shadow-sm p-4">
                          <h3 className="font-semibold mb-2">Response</h3>
                          <Response>
                            {responseData.content}
                          </Response>
                        </div>
                      );

                    default:
                      return null;
                  }
                })}

                {/* Show static components only when no AG-UI data is available */}
                {structuredData.length === 0 && agUiMessages.length === 0 && (
                  <>
                    {/* Chain of Thought Component */}
                    <ChainOfThought defaultOpen>
                      <ChainOfThoughtHeader>
                        Algorithm Analysis Process
                      </ChainOfThoughtHeader>
                      <ChainOfThoughtContent>
                        <ChainOfThoughtStep
                          icon={SearchIcon}
                          label="Understanding the problem"
                          description="Analyzing shortest path requirements"
                          status="complete"
                        >
                          <Response>
                            The user needs to find the shortest path between nodes in a weighted graph.
                          </Response>
                          <ChainOfThoughtSearchResults>
                            <ChainOfThoughtSearchResult>
                              <div className="size-4 bg-blue-500 rounded flex items-center justify-center text-white text-xs">G</div>
                              Graph Theory
                            </ChainOfThoughtSearchResult>
                            <ChainOfThoughtSearchResult>
                              <div className="size-4 bg-green-500 rounded flex items-center justify-center text-white text-xs">W</div>
                              Weighted Graphs
                            </ChainOfThoughtSearchResult>
                          </ChainOfThoughtSearchResults>
                        </ChainOfThoughtStep>
                        <ChainOfThoughtStep
                          icon={SearchIcon}
                          label="Selecting the algorithm"
                          description="Choosing Dijkstra's algorithm for non-negative weights"
                          status="complete"
                        >
                          <Response>
                            Dijkstra algorithm is optimal for graphs with non-negative edge weights.
                          </Response>
                        </ChainOfThoughtStep>
                        <ChainOfThoughtStep
                          icon={ImageIcon}
                          label="Implementation planning"
                          description="Designing the priority queue structure"
                          status="active"
                        >
                          <Response>
                            Using Python heapq module for efficient priority queue operations.
                          </Response>
                          <ChainOfThoughtImage caption="Priority queue visualization for Dijkstra's algorithm">
                            <div className="h-32 w-full bg-linear-to-r from-blue-500 to-purple-600 rounded-md flex items-center justify-center text-white font-semibold">
                              Priority Queue Diagram
                            </div>
                          </ChainOfThoughtImage>
                        </ChainOfThoughtStep>
                        <ChainOfThoughtStep
                          label="Testing and validation"
                          description="Verifying correctness with sample data"
                          status="pending"
                        />
                      </ChainOfThoughtContent>
                    </ChainOfThought>

                    {/* Plan Component */}
                    <Plan defaultOpen>
                      <PlanHeader>
                        <div>
                          <PlanTitle>Implementation Roadmap</PlanTitle>
                          <PlanDescription>Step-by-step plan for Dijkstra algorithm</PlanDescription>
                        </div>
                        <PlanTrigger />
                      </PlanHeader>
                      <PlanContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="size-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Initialize distance dictionary</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">Set up priority queue with heapq</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-2 bg-blue-500 rounded-full"></div>
                            <span className="text-sm">Implement main algorithm loop</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-2 bg-gray-300 rounded-full"></div>
                            <span className="text-sm">Test with sample graph data</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="size-2 bg-gray-300 rounded-full"></div>
                            <span className="text-sm">Optimize for edge cases</span>
                          </div>
                        </div>
                      </PlanContent>
                    </Plan>

                    {/* Artifact Component */}
                    <Artifact>
                      <ArtifactHeader>
                        <div>
                          <ArtifactTitle>Dijkstra&apos;s Algorithm Implementation</ArtifactTitle>
                          <ArtifactDescription>Python implementation with heapq</ArtifactDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArtifactActions>
                            <ArtifactAction
                              icon={PlayIcon}
                              label="Run"
                              onClick={() => console.log('Run code')}
                              tooltip="Run code"
                            />
                            <ArtifactAction
                              icon={CopyIcon}
                              label="Copy"
                              onClick={() => console.log('Copy code')}
                              tooltip="Copy to clipboard"
                            />
                            <ArtifactAction
                              icon={DownloadIcon}
                              label="Download"
                              onClick={() => console.log('Download')}
                              tooltip="Download file"
                            />
                          </ArtifactActions>
                        </div>
                      </ArtifactHeader>
                      <ArtifactContent className="p-0">
                        <CodeBlock
                          className="border-none"
                          code={dijkstraCode}
                          language="python"
                          showLineNumbers
                        >
                          <CodeBlockCopyButton
                            onCopy={() => console.log('Code copied to clipboard')}
                            onError={() => console.error('Failed to copy code')}
                          />
                        </CodeBlock>
                      </ArtifactContent>
                    </Artifact>

                    {/* Sources Component */}
                    <Sources>
                      <SourcesTrigger count={sampleSources.length} />
                      <SourcesContent>
                        {sampleSources.map((source) => (
                          <Source href={source.href} key={source.href} title={source.title} />
                        ))}
                      </SourcesContent>
                    </Sources>
                  </>
                )}
              </div>

              {/* Right Column - Additional Components */}
              <div className="space-y-4">
                {/* Suggestions Component - Dynamic from AG-UI */}
                <div className="bg-card rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-3">Suggested Questions</h3>
                  <Suggestions>
                    {activeSuggestions.length > 0 ? activeSuggestions.map((suggestion) => (
                      <Suggestion
                        key={suggestion}
                        onClick={handleSuggestionClick}
                        suggestion={suggestion}
                      />
                    )) : (
                      <div className="text-sm text-muted-foreground p-2">
                        {getEmptyStateMessage('suggestions')}
                      </div>
                    )}
                  </Suggestions>
                </div>

                {/* Task Component - Show dynamic tasks from AG-UI data */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Task>
                    <TaskTrigger title="Current Tasks" />
                    <TaskContent>
                      {activeTasks.length > 0 ? (
                        activeTasks.map((task, index) => (
                          <TaskItem key={`task-${index}`}>
                            <strong>{task.key}:</strong> {task.value}
                            {task.status && <span className="ml-2 text-xs text-muted-foreground">({task.status})</span>}
                          </TaskItem>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground p-4">
                          {getEmptyStateMessage('tasks')}
                        </div>
                      )}
                    </TaskContent>
                  </Task>
                </div>

                {/* Reasoning Component - Show dynamic reasoning from AG-UI data */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Reasoning>
                    <ReasoningTrigger />
                    <ReasoningContent>
                      {(() => {
                        // Convert the reasoning data to a string for ReasoningContent
                        const reasoningComponents = structuredData.filter(comp => comp.type === 'reasoning');
                        const chainOfThoughtComponents = structuredData.filter(comp => comp.type === 'chain_of_thought');

                        if (reasoningComponents.length > 0) {
                          return reasoningComponents.map((comp) => {
                            const reasoningData = comp.data as ReasoningData;
                            if (reasoningData.parts && reasoningData.parts.length > 0) {
                              return reasoningData.parts.map(part =>
                                `${part.type === 'reasoning' ? '🧠 Reasoning' : part.type === 'function_call' ? '⚙️ Function Call' : '📝 Text'}: ${part.content}`
                              ).join('\n\n');
                            }
                            return reasoningData.content;
                          }).join('\n\n');
                        } else if (chainOfThoughtComponents.length > 0) {
                          return chainOfThoughtComponents.map((comp) => {
                            const steps = comp.data as ChainOfThoughtStep[];
                            return steps.map(step => `${step.label}: ${step.description}`).join('\n');
                          }).join('\n\n');
                        } else {
                          return "I'm analyzing the graph structure and determining the optimal path using Dijkstra's algorithm. The implementation uses a priority queue for efficient node selection.";
                        }
                      })()}
                    </ReasoningContent>
                  </Reasoning>
                </div>

                {/* Response Component - Show dynamic responses from AG-UI data */}
                <div className="bg-card rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-2">Quick Response</h3>
                  <Response>
                    {structuredData.filter(comp => comp.type === 'response').length > 0 ? (
                      (structuredData
                        .filter(comp => comp.type === 'response')
                        .slice(-1)[0]?.data as { content: string; timestamp?: number }).content.substring(0, 200) + '...'
                    ) : (
                      "Dijkstra's algorithm finds the shortest path between nodes in a graph with non-negative edge weights. Time complexity is O((V+E) log V) using a priority queue."
                    )}
                  </Response>
                </div>

                {/* Branch Component */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Branch defaultBranch={0} onBranchChange={(index) => console.log('Branch changed to:', index)}>
                    <BranchMessages>
                      <Message from="user">
                        <MessageContent>What are the key strategies for optimizing React performance?</MessageContent>
                        <MessageAvatar name="User" src="https://github.com/haydenbleasel.png" />
                      </Message>
                    </BranchMessages>
                    <BranchSelector from="user">
                      <BranchPrevious />
                      <BranchPage />
                      <BranchNext />
                    </BranchSelector>
                  </Branch>
                </div>

                {/* Context Component - Dynamic Token Usage from AG-UI */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Context
                    maxTokens={useDemo ? demoData.context.maxTokens : 128_000}
                    modelId={useDemo ? demoData.context.modelId : model}
                    usage={{
                      inputTokens: activeTokenUsage?.inputTokens || 0,
                      outputTokens: activeTokenUsage?.outputTokens || 0,
                      totalTokens: activeTokenUsage?.totalTokens || 0,
                      cachedInputTokens: activeTokenUsage?.cachedInputTokens || 0,
                      reasoningTokens: activeTokenUsage?.reasoningTokens || 0,
                    }}
                    usedTokens={activeTokenUsage?.totalTokens || 0}
                  >
                    <ContextTrigger />
                    <ContextContent>
                      <ContextContentHeader />
                      <ContextContentBody>
                        <ContextInputUsage />
                        <ContextOutputUsage />
                        <ContextReasoningUsage />
                        <ContextCacheUsage />
                      </ContextContentBody>
                      <ContextContentFooter />
                    </ContextContent>
                  </Context>
                </div>

                {/* Demo Components - Only show when in demo mode */}
                {useDemo && (
                  <>
                    {/* Demo Images */}
                    {demoData.images.length > 0 && demoData.images.map((image, index) => (
                      <div key={`image-${index}`} className="bg-card rounded-lg border shadow-sm p-4">
                        <h3 className="font-semibold mb-2">{image.caption || image.alt}</h3>
                        <Image
                          alt={image.alt}
                          className="h-32 w-full object-cover rounded-md"
                          base64={image.base64}
                          mediaType={image.mediaType}
                          uint8Array={new Uint8Array([])}
                        />
                      </div>
                    ))}

                    {/* OpenIn Component */}
                    <div className="bg-card rounded-lg border shadow-sm">
                      <OpenIn query="How to implement Dijkstra's algorithm in Python?">
                        <OpenInTrigger />
                        <OpenInContent>
                          <OpenInChatGPT />
                          <OpenInClaude />
                          <OpenInT3 />
                          <OpenInScira />
                          <OpenInv0 />
                          <OpenInCursor />
                        </OpenInContent>
                      </OpenIn>
                    </div>

                    {/* Queue Component with Demo Data */}
                    {demoData.queue.pending.length > 0 && (
                      <div className="bg-card rounded-lg border shadow-sm">
                        <Queue>
                          <QueueSection>
                            <QueueSectionTrigger>
                              <QueueSectionLabel count={demoData.queue.pending.length} label="Queued" />
                            </QueueSectionTrigger>
                            <QueueSectionContent>
                              <QueueList>
                                {demoData.queue.pending.map((item) => (
                                  <QueueItem key={item.id}>
                                    <div className="flex items-center gap-2">
                                      <QueueItemIndicator />
                                      <QueueItemContent>{item.title}</QueueItemContent>
                                      <QueueItemActions>
                                        <QueueItemAction
                                          aria-label="Remove from queue"
                                          onClick={() => console.log('Remove', item.id)}
                                          title="Remove from queue"
                                        >
                                          <RefreshCcwIcon size={12} />
                                        </QueueItemAction>
                                      </QueueItemActions>
                                    </div>
                                    {item.attachments.length > 0 && (
                                      <QueueItemAttachment>
                                        {item.attachments.map((attachment, idx) => (
                                          attachment.type === 'file' ? (
                                            <QueueItemFile key={idx}>{attachment.name}</QueueItemFile>
                                          ) : (
                                            <QueueItemImage
                                              key={idx}
                                              alt={attachment.description}
                                              src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjM2I4MmY2Ii8+Cjx0ZXh0IHg9IjI1IiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+SU1HPC90ZXh0Pgo8L3N2Zz4K"
                                            />
                                          )
                                        ))}
                                      </QueueItemAttachment>
                                    )}
                                    <QueueItemDescription>
                                      {item.description}
                                    </QueueItemDescription>
                                  </QueueItem>
                                ))}
                              </QueueList>
                            </QueueSectionContent>
                          </QueueSection>
                        </Queue>
                      </div>
                    )}

                {/* Tool Component - Dynamic from AG-UI Tool Calls */}
                {activeToolCalls.length > 0 ? (
                  activeToolCalls.map((toolCall, index) => (
                    <div key={`tool-${index}`} className="bg-card rounded-lg border shadow-sm">
                      <Tool>
                        <ToolHeader type={`tool-${toolCall.name}`} state="output-available" />
                        <ToolContent>
                          <ToolInput input={toolCall.arguments} />
                          <ToolOutput output={toolCall.result ? [toolCall.result] : []} errorText={undefined} />
                        </ToolContent>
                      </Tool>
                    </div>
                  ))
                ) : (
                  <div className="bg-card rounded-lg border shadow-sm p-4">
                    <div className="text-sm text-muted-foreground">
                      {getEmptyStateMessage('toolCalls')}
                    </div>
                  </div>
                )}

                    {/* WebPreview Component with Demo Data */}
                    {demoData.webPreview && (
                      <div className="bg-card rounded-lg border shadow-sm">
                        <WebPreview
                          defaultUrl={demoData.webPreview.url}
                          onUrlChange={(url) => console.log('URL changed to:', url)}
                          style={{ height: '200px' }}
                        >
                          <WebPreviewNavigation>
                            <WebPreviewNavigationButton
                              tooltip="Go back"
                              onClick={() => console.log('Go back')}
                            >
                              <ArrowLeftIcon className="size-4" />
                            </WebPreviewNavigationButton>
                            <WebPreviewNavigationButton
                              tooltip="Go forward"
                              onClick={() => console.log('Go forward')}
                            >
                              <ArrowRightIcon className="size-4" />
                            </WebPreviewNavigationButton>
                            <WebPreviewNavigationButton
                              tooltip="Reload"
                              onClick={() => console.log('Reload')}
                            >
                              <RefreshCcwIcon className="size-4" />
                            </WebPreviewNavigationButton>
                            <WebPreviewUrl />
                            <WebPreviewNavigationButton
                              tooltip="Select"
                              onClick={() => console.log('Select')}
                            >
                              <MousePointerClickIcon className="size-4" />
                            </WebPreviewNavigationButton>
                            <WebPreviewNavigationButton
                              tooltip="Open in new tab"
                              onClick={() => console.log('Open in new tab')}
                            >
                              <ExternalLinkIcon className="size-4" />
                            </WebPreviewNavigationButton>
                            <WebPreviewNavigationButton
                              tooltip="Maximize"
                              onClick={() => console.log('Maximize')}
                            >
                              <Maximize2Icon className="size-4" />
                            </WebPreviewNavigationButton>
                          </WebPreviewNavigation>
                          <WebPreviewBody src={demoData.webPreview.url} />
                          <WebPreviewConsole logs={[
                            {
                              level: 'log' as const,
                              message: demoData.webPreview.description,
                              timestamp: new Date(),
                            }
                          ]} />
                        </WebPreview>
                      </div>
                    )}

                    {/* InlineCitation Component with Demo Data */}
                    {demoData.inlineCitation && (
                      <div className="bg-card rounded-lg border shadow-sm p-4">
                        <h3 className="font-semibold mb-2">Algorithm Sources</h3>
                        <p className="text-sm text-muted-foreground">
                          {demoData.inlineCitation.text}{' '}
                          <InlineCitation>
                            <InlineCitationText>from authoritative sources</InlineCitationText>
                            <InlineCitationCard>
                              <InlineCitationCardTrigger
                                sources={demoData.inlineCitation.sources.map(s => s.url)}
                              />
                              <InlineCitationCardBody>
                                <InlineCitationCarousel>
                                  <InlineCitationCarouselHeader>
                                    <InlineCitationCarouselPrev />
                                    <InlineCitationCarouselNext />
                                    <InlineCitationCarouselIndex />
                                  </InlineCitationCarouselHeader>
                                  <InlineCitationCarouselContent>
                                    {demoData.inlineCitation.sources.map((source, idx) => (
                                      <InlineCitationCarouselItem key={idx}>
                                        <InlineCitationSource
                                          title={source.title}
                                          url={source.url}
                                          description={source.description}
                                        />
                                      </InlineCitationCarouselItem>
                                    ))}
                                  </InlineCitationCarouselContent>
                                </InlineCitationCarousel>
                              </InlineCitationCardBody>
                            </InlineCitationCard>
                          </InlineCitation>
                          .
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Fixed Prompt Input at Bottom */}
            <div className="border-t bg-background p-4 sticky bottom-0 z-10">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputBody>
                  <PromptInputAttachments>
                    {(attachment) => (
                      <PromptInputAttachment data={attachment} />
                    )}
                  </PromptInputAttachments>
                  <PromptInputTextarea
                    onChange={(e) => setInputText(e.target.value)}
                    value={inputText}
                    placeholder="Ask me anything about algorithms, code, or AI..."
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <PromptInputTools>
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <PromptInputSpeechButton
                      onTranscriptionChange={setInputText}
                    />
                    <PromptInputButton>
                      <GlobeIcon size={16} />
                      <span>Search</span>
                    </PromptInputButton>
                    <PromptInputModelSelect onValueChange={handleModelChange} value={model}>
                      <PromptInputModelSelectTrigger>
                        <PromptInputModelSelectValue />
                      </PromptInputModelSelectTrigger>
                      <PromptInputModelSelectContent>
                        {availableModels.map((modelData) => (
                          <PromptInputModelSelectItem
                            key={modelData.id}
                            value={modelData.id}
                          >
                            {modelData.name}
                          </PromptInputModelSelectItem>
                        ))}
                        {/* Fallback options if models fail to load */}
                        {availableModels.length === 0 && (
                          <>
                            <PromptInputModelSelectItem value="openai:gpt-5">GPT-5</PromptInputModelSelectItem>
                            <PromptInputModelSelectItem value="openai:gpt-5-mini">GPT-5 Mini</PromptInputModelSelectItem>
                            <PromptInputModelSelectItem value="openai:gpt-4o">GPT-4o</PromptInputModelSelectItem>
                            <PromptInputModelSelectItem value="openai:gpt-4o-mini">GPT-4o Mini</PromptInputModelSelectItem>
                            <PromptInputModelSelectItem value="openai:gpt-3.5-turbo">GPT-3.5 Turbo</PromptInputModelSelectItem>
                            <PromptInputModelSelectItem value="anthropic:claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</PromptInputModelSelectItem>
                          </>
                        )}
                      </PromptInputModelSelectContent>
                    </PromptInputModelSelect>
                  </PromptInputTools>
                  <PromptInputSubmit status={isLoading ? 'submitted' : 'ready'} />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

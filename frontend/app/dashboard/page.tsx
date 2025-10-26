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

// AI Elements Components
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai-elements/message"
import { Actions, Action } from "@/components/ai-elements/actions"
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactDescription, ArtifactActions, ArtifactAction, ArtifactContent } from "@/components/ai-elements/artifact"
import { CodeBlock } from "@/components/ai-elements/code-block"
import { Loader } from "@/components/ai-elements/loader"
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources"
import { Suggestions, Suggestion } from "@/components/ai-elements/suggestion"
import { Task, TaskTrigger, TaskContent, TaskItem } from "@/components/ai-elements/task"
import { Reasoning, ReasoningTrigger, ReasoningContent } from "@/components/ai-elements/reasoning"
import { ChainOfThought, ChainOfThoughtHeader, ChainOfThoughtContent, ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought"
import { Plan, PlanHeader, PlanTitle, PlanDescription, PlanContent, PlanTrigger } from "@/components/ai-elements/plan"
import { Response } from "@/components/ai-elements/response"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { PromptInput, PromptInputBody, PromptInputTextarea, PromptInputFooter, PromptInputTools, PromptInputSubmit, PromptInputActionMenu, PromptInputActionMenuTrigger, PromptInputActionMenuContent, PromptInputActionAddAttachments, PromptInputSpeechButton, PromptInputButton, PromptInputModelSelect, PromptInputModelSelectTrigger, PromptInputModelSelectValue, PromptInputModelSelectContent, PromptInputModelSelectItem } from "@/components/ai-elements/prompt-input"

import {
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  ShareIcon,
  PlayIcon,
  DownloadIcon,
  GlobeIcon,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { useState } from 'react'

export default function Page() {
  const [messages, setMessages] = useState<{
    key: string;
    from: 'user' | 'assistant';
    content: string;
    avatar: string;
    name: string;
    type?: 'message' | 'artifact' | 'tool' | 'reasoning';
  }[]>([
    {
      key: nanoid(),
      from: 'user',
      content: 'Hello! Can you help me implement Dijkstra\'s algorithm in Python?',
      avatar: 'https://github.com/haydenbleasel.png',
      name: 'User',
      type: 'message'
    },
    {
      key: nanoid(),
      from: 'assistant',
      content: 'Sure! I can help you implement Dijkstra\'s algorithm in Python.',
      avatar: 'https://github.com/openai.png',
      name: 'AI Assistant',
      type: 'message'
    }
  ])

  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState('gpt-4')

  const handleSubmit = (message: { text?: string }) => {
    if (!message.text?.trim()) return

    const newUserMessage = {
      key: nanoid(),
      from: 'user' as const,
      content: message.text,
      avatar: 'https://github.com/haydenbleasel.png',
      name: 'User',
      type: 'message' as const
    }

    setMessages(prev => [...prev, newUserMessage])
    setInputText('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        key: nanoid(),
        from: 'assistant' as const,
        content: 'I\'ve processed your request. Here\'s the implementation you asked for:',
        avatar: 'https://github.com/openai.png',
        name: 'AI Assistant',
        type: 'message' as const
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
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
                      {isLoading && (
                        <Message from="assistant">
                          <MessageContent>
                            <div className="flex items-center gap-2">
                              <Loader />
                              <span>Thinking...</span>
                            </div>
                          </MessageContent>
                          <MessageAvatar name="AI Assistant" src="https://github.com/openai.png" />
                        </Message>
                      )}
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>
                </div>

                {/* Chain of Thought Component */}
                <ChainOfThought defaultOpen>
                  <ChainOfThoughtHeader>
                    Algorithm Analysis Process
                  </ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    <ChainOfThoughtStep
                      label="Understanding the problem"
                      description="Analyzing shortest path requirements"
                      status="complete"
                    >
                      <Response>
                        The user needs to find the shortest path between nodes in a weighted graph.
                      </Response>
                    </ChainOfThoughtStep>
                    <ChainOfThoughtStep
                      label="Selecting the algorithm"
                      description="Choosing Dijkstra's algorithm for non-negative weights"
                      status="complete"
                    >
                      <Response>
                        Dijkstra's algorithm is optimal for graphs with non-negative edge weights.
                      </Response>
                    </ChainOfThoughtStep>
                    <ChainOfThoughtStep
                      label="Implementation planning"
                      description="Designing the priority queue structure"
                      status="active"
                    >
                      <Response>
                        Using Python's heapq module for efficient priority queue operations.
                      </Response>
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
                      <PlanDescription>Step-by-step plan for Dijkstra's algorithm</PlanDescription>
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
                    />
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
              </div>

              {/* Right Column - Additional Components */}
              <div className="space-y-4">
                {/* Suggestions Component */}
                <div className="bg-card rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-3">Suggested Questions</h3>
                  <Suggestions>
                    {suggestions.map((suggestion) => (
                      <Suggestion
                        key={suggestion}
                        onClick={handleSuggestionClick}
                        suggestion={suggestion}
                      />
                    ))}
                  </Suggestions>
                </div>

                {/* Task Component */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Task>
                    <TaskTrigger title="Current Tasks" />
                    <TaskContent>
                      {sampleTasks.map((task) => (
                        <TaskItem key={task.key}>{task.value}</TaskItem>
                      ))}
                    </TaskContent>
                  </Task>
                </div>

                {/* Reasoning Component */}
                <div className="bg-card rounded-lg border shadow-sm">
                  <Reasoning>
                    <ReasoningTrigger />
                    <ReasoningContent>
                      I&apos;m analyzing the graph structure and determining the optimal path using Dijkstra&apos;s algorithm. The implementation uses a priority queue for efficient node selection.
                    </ReasoningContent>
                  </Reasoning>
                </div>

                {/* Response Component */}
                <div className="bg-card rounded-lg border shadow-sm p-4">
                  <h3 className="font-semibold mb-2">Quick Response</h3>
                  <Response>
                    <p className="text-sm text-muted-foreground">
                      Dijkstra&apos;s algorithm finds the shortest path between nodes in a graph with non-negative edge weights. Time complexity is O((V+E) log V) using a priority queue.
                    </p>
                  </Response>
                </div>
              </div>
            </div>

            {/* Fixed Prompt Input at Bottom */}
            <div className="border-t bg-background p-4 sticky bottom-0 z-10">
              <PromptInput globalDrop multiple onSubmit={handleSubmit}>
                <PromptInputBody>
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
                    <PromptInputModelSelect onValueChange={setModel} value={model}>
                      <PromptInputModelSelectTrigger>
                        <PromptInputModelSelectValue />
                      </PromptInputModelSelectTrigger>
                      <PromptInputModelSelectContent>
                        <PromptInputModelSelectItem value="gpt-4">GPT-4</PromptInputModelSelectItem>
                        <PromptInputModelSelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</PromptInputModelSelectItem>
                        <PromptInputModelSelectItem value="claude-2">Claude 2</PromptInputModelSelectItem>
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

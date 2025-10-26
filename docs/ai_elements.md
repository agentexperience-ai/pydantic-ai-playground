
AI Elements
AI Elements is a component library and custom registry built on top of shadcn/ui to help you build AI-native applications faster. It provides pre-built components like conversations, messages and more.

You can install it with:

ai-elements
shadcn
npx shadcn@latest add @ai-elements/all
Here are some basic examples of what you can achieve using components from AI Elements.

OpenAIChatGPT
AnthropicClaude
X AIGrok
Can you explain how to use React hooks effectively?


Used 2 sources

React Hooks Best Practices
React hooks are a powerful feature that let you use state and other React features without writing classes. Here are some tips for using them effectively:

Rules of Hooks
Only call hooks at the top level of your component or custom hooks
Don't call hooks inside loops, conditions, or nested functions
Common Hooks
useState: For local component state
useEffect: For side effects like data fetching
useContext: For consuming context
useReducer: For complex state logic
useCallback: For memoizing functions
useMemo: For memoizing values
Example of useState and useEffect
jsx


function ProfilePage({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // This runs after render and when userId changes
    fetchUser(userId).then(userData => {
      setUser(userData);
    });
  }, [userId]);
  
  return user ? <Profile user={user} /> : <Loading />;
}
Would you like me to explain any specific hook in more detail?

Yes, could you explain useCallback and useMemo in more detail? When should I use one over the other?


1 of 3


Thought for 10 seconds

useCallback vs useMemo
Both hooks help with performance optimization, but they serve different purposes:

useCallback
useCallback memoizes functions to prevent unnecessary re-renders of child components that receive functions as props.

jsx


// Without useCallback - a new function is created on every render
const handleClick = () => {
  console.log(count);
};

// With useCallback - the function is only recreated when dependencies change
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
useMemo
useMemo memoizes values to avoid expensive recalculations on every render.

jsx


// Without useMemo - expensive calculation runs on every render
const sortedList = expensiveSort(items);

// With useMemo - calculation only runs when items change
const sortedList = useMemo(() => expensiveSort(items), [items]);
When to use which?
Use useCallback when:

Passing callbacks to optimized child components that rely on reference equality
Working with event handlers that you pass to child components
Use useMemo when:

You have computationally expensive calculations
You want to avoid recreating objects that are used as dependencies for other hooks
Performance Note
Don't overuse these hooks! They come with their own overhead. Only use them when you have identified a genuine performance issue.

Deprecated Methods
Note that class-based lifecycle methods like componentDidMount are now replaced by the useEffect hook in modern React development.

Ask anything
Analyze data
Surprise me
Summarize text
Code
Get advice
More
Components
Actions

Go to component
Code
Preview
tsx


'use client';

import { useState } from 'react';
import { Actions, Action } from '@/components/ai-elements/actions';
import { Message, MessageContent } from '@/components/ai-elements/message';
import {
  RefreshCcwIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  ShareIcon,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation';

const messages: {
  key: string;
  from: 'user' | 'assistant';
  content: string;
  avatar: string;
  name: string;
}[] = [
  {
    key: nanoid(),
    from: 'user',
    content: 'Hello, how are you?',
    avatar: 'https://github.com/haydenbleasel.png',
    name: 'Hayden Bleasel',
  },
  {
    key: nanoid(),
    from: 'assistant',
    content: 'I am fine, thank you!',
    avatar: 'https://github.com/openai.png',
    name: 'OpenAI',
  },
];

const Example = () => {
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const handleRetry = () => {};

  const handleCopy = () => {};

  const handleShare = () => {};

  const actions = [
    {
      icon: RefreshCcwIcon,
      label: 'Retry',
      onClick: handleRetry,
    },
    {
      icon: ThumbsUpIcon,
      label: 'Like',
      onClick: () => setLiked(!liked),
    },

    {
      icon: ThumbsDownIcon,
      label: 'Dislike',
      onClick: () => setDisliked(!disliked),
    },
    {
      icon: CopyIcon,
      label: 'Copy',
      onClick: () => handleCopy(),
    },
    {
      icon: ShareIcon,
      label: 'Share',
      onClick: () => handleShare(),
    },
  ];

  return (
    <Conversation className="relative w-full">
      <ConversationContent>
        {messages.map((message) => (
          <Message
            from={message.from}
            key={message.key}
            className={`flex flex-col gap-2 ${message.from === 'assistant' ? 'items-start' : 'items-end'}`}
          >
            <MessageContent>{message.content}</MessageContent>
            {message.from === 'assistant' && (
              <Actions className="mt-2">
                {actions.map((action) => (
                  <Action key={action.label} label={action.label}>
                    <action.icon className="size-4" />
                  </Action>
                ))}
              </Actions>
            )}
          </Message>
        ))}
      </ConversationContent>
    </Conversation>
  );
};

export default Example;
Artifact

Go to component
Code
Preview
tsx


'use client';

import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from '@/components/ai-elements/artifact';
import { CodeBlock } from '@/components/ai-elements/code-block';
import {
  CopyIcon,
  DownloadIcon,
  PlayIcon,
  RefreshCwIcon,
  ShareIcon,
} from 'lucide-react';

const code = `# Dijkstra's Algorithm implementation
import heapq

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

# Example graph
 graph = {
    'A': {'B': 1, 'C': 4},
    'B': {'A': 1, 'C': 2, 'D': 5},
    'C': {'A': 4, 'B': 2, 'D': 1},
    'D': {'B': 5, 'C': 1}
}

print(dijkstra(graph, 'A'))`;

const Example = () => (
  <Artifact>
    <ArtifactHeader>
      <div>
        <ArtifactTitle>Dijkstra's Algorithm Implementation</ArtifactTitle>
        <ArtifactDescription>Updated 1 minute ago</ArtifactDescription>
      </div>
      <div className="flex items-center gap-2">
        <ArtifactActions>
          <ArtifactAction
            icon={PlayIcon}
            label="Run"
            onClick={() => console.log('Run')}
            tooltip="Run code"
          />
          <ArtifactAction
            icon={CopyIcon}
            label="Copy"
            onClick={() => console.log('Copy')}
            tooltip="Copy to clipboard"
          />
          <ArtifactAction
            icon={RefreshCwIcon}
            label="Regenerate"
            onClick={() => console.log('Regenerate')}
            tooltip="Regenerate content"
          />
          <ArtifactAction
            icon={DownloadIcon}
            label="Download"
            onClick={() => console.log('Download')}
            tooltip="Download file"
          />
          <ArtifactAction
            icon={ShareIcon}
            label="Share"
            onClick={() => console.log('Share')}
            tooltip="Share artifact"
          />
        </ArtifactActions>
      </div>
    </ArtifactHeader>
    <ArtifactContent className="p-0">
      <CodeBlock
        className="border-none"
        code={code}
        language="python"
        showLineNumbers
      />
    </ArtifactContent>
  </Artifact>
);

export default Example;
Branch

Go to component
Code
Preview
tsx


'use client';

import {
  Branch,
  BranchMessages,
  BranchNext,
  BranchPage,
  BranchPrevious,
  BranchSelector,
} from '@/components/ai-elements/branch';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { nanoid } from 'nanoid';

const userMessages = [
  {
    id: nanoid(),
    content: 'What are the key strategies for optimizing React performance?',
  },
  {
    id: nanoid(),
    content: 'How can I improve the performance of my React application?',
  },
  {
    id: nanoid(),
    content: 'What performance optimization techniques should I use in React?',
  },
];

const assistantMessages = [
  {
    id: nanoid(),
    content:
      "Here's the first response to your question. This approach focuses on performance optimization.",
  },
  {
    id: nanoid(),
    content:
      "Here's an alternative response. This approach emphasizes code readability and maintainability over pure performance.",
  },
  {
    id: nanoid(),
    content:
      "And here's a third option. This balanced approach considers both performance and maintainability, making it suitable for most use cases.",
  },
];

const Example = () => {
  const handleBranchChange = (branchIndex: number) => {
    console.log('Branch changed to:', branchIndex);
  };

  return (
    <div style={{ height: '300px' }}>
      <Branch defaultBranch={0} onBranchChange={handleBranchChange}>
        <BranchMessages>
          {userMessages.map((message) => (
            <Message from="user" key={message.id}>
              <MessageContent>{message.content}</MessageContent>
              <MessageAvatar
                name="Hayden Bleasel"
                src="https://github.com/haydenbleasel.png"
              />
            </Message>
          ))}
        </BranchMessages>
        <BranchSelector from="user">
          <BranchPrevious />
          <BranchPage />
          <BranchNext />
        </BranchSelector>
      </Branch>

      <Branch defaultBranch={0} onBranchChange={handleBranchChange}>
        <BranchMessages>
          {assistantMessages.map((message) => (
            <Message from="assistant" key={message.id}>
              <MessageContent>{message.content}</MessageContent>
              <MessageAvatar name="AI" src="https://github.com/openai.png" />
            </Message>
          ))}
        </BranchMessages>
        <BranchSelector from="assistant">
          <BranchPrevious />
          <BranchPage />
          <BranchNext />
        </BranchSelector>
      </Branch>
    </div>
  );
};

export default Example;
Chain of Thought

Go to component
Code
Preview
tsx


'use client';

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtImage,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { ImageIcon, SearchIcon } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import ExampleImage from './image';

const ChainOfThoughtExample = () => {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setVisibleSteps((prev) => {
        if (prev >= 4) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[460px]">
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader />
        <ChainOfThoughtContent>
          {visibleSteps >= 1 && (
            <ChainOfThoughtStep
              icon={SearchIcon}
              label="Searching for profiles for Hayden Bleasel"
              status={visibleSteps === 1 ? 'active' : 'complete'}
            >
              <ChainOfThoughtSearchResults>
                {[
                  'https://www.x.com',
                  'https://www.instagram.com',
                  'https://www.github.com',
                ].map((website) => (
                  <ChainOfThoughtSearchResult key={website}>
                    <Image
                      alt=""
                      className="size-4"
                      height={16}
                      src={`https://img.logo.dev/${new URL(website).hostname}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
                      width={16}
                    />
                    {new URL(website).hostname}
                  </ChainOfThoughtSearchResult>
                ))}
              </ChainOfThoughtSearchResults>
            </ChainOfThoughtStep>
          )}

          {visibleSteps >= 2 && (
            <ChainOfThoughtStep
              icon={ImageIcon}
              label="Found the profile photo for Hayden Bleasel"
              status={visibleSteps === 2 ? 'active' : 'complete'}
            >
              <ChainOfThoughtImage caption="Hayden Bleasel's profile photo from x.com, showing a Ghibli-style man.">
                <ExampleImage />
              </ChainOfThoughtImage>
            </ChainOfThoughtStep>
          )}

          {visibleSteps >= 3 && (
            <ChainOfThoughtStep
              label="Hayden Bleasel is an Australian product designer, software engineer, and founder. He is currently based in the United States working for Vercel, an American cloud application company."
              status={visibleSteps === 3 ? 'active' : 'complete'}
            />
          )}

          {visibleSteps >= 4 && (
            <ChainOfThoughtStep
              icon={SearchIcon}
              label="Searching for recent work..."
              status="active"
            >
              <ChainOfThoughtSearchResults>
                {['https://www.github.com', 'https://www.dribbble.com'].map(
                  (website) => (
                    <ChainOfThoughtSearchResult key={website}>
                      <Image
                        alt=""
                        className="size-4"
                        height={16}
                        src={`https://img.logo.dev/${new URL(website).hostname}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
                        width={16}
                      />
                      {new URL(website).hostname}
                    </ChainOfThoughtSearchResult>
                  ),
                )}
              </ChainOfThoughtSearchResults>
            </ChainOfThoughtStep>
          )}
        </ChainOfThoughtContent>
      </ChainOfThought>
    </div>
  );
};

export default ChainOfThoughtExample;
Code Block

Go to component
Code
Preview
tsx


'use client';

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block';

const code = `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`;

const Example = () => (
  <CodeBlock code={code} language="jsx">
    <CodeBlockCopyButton
      onCopy={() => console.log('Copied code to clipboard')}
      onError={() => console.error('Failed to copy code to clipboard')}
    />
  </CodeBlock>
);

export default Example;
Context

Go to component
Code
Preview
tsx


'use client';

import {
  Context,
  ContextCacheUsage,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextTrigger,
} from '@/components/ai-elements/context';

const Example = () => (
  <div className="h-[300px] flex items-center justify-center">
    <div className="-mt-[156px]">
      <Context
        maxTokens={128_000}
        modelId="openai:gpt-5"
        usage={{
          inputTokens: 32_000,
          outputTokens: 8000,
          totalTokens: 40_000,
          cachedInputTokens: 0,
          reasoningTokens: 0,
        }}
        usedTokens={40_000}
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
  </div>
);

export default Example;
Conversation

Go to component
Code
Preview
tsx


'use client';

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { MessageSquareIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { useEffect, useState } from 'react';

const messages: { key: string; value: string; name: string; avatar: string }[] =
  [
    {
      key: nanoid(),
      value: 'Hello, how are you?',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: "I'm good, thank you! How can I assist you today?",
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: "I'm looking for information about your services.",
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value:
        'Sure! We offer a variety of AI solutions. What are you interested in?',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: "I'm interested in natural language processing tools.",
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: 'Great choice! We have several NLP APIs. Would you like a demo?',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'Yes, a demo would be helpful.',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: 'Alright, I can show you a sentiment analysis example. Ready?',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'Yes, please proceed.',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: "Here is a sample: 'I love this product!' → Positive sentiment.",
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'Impressive! Can it handle multiple languages?',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: 'Absolutely, our models support over 20 languages.',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'How do I get started with the API?',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: 'You can sign up on our website and get an API key instantly.',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'Is there a free trial available?',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: 'Yes, we offer a 14-day free trial with full access.',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'What kind of support do you provide?',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: 'We provide 24/7 chat and email support for all users.',
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
    {
      key: nanoid(),
      value: 'Thank you for the information!',
      name: 'Alex Johnson',
      avatar: 'https://github.com/haydenbleasel.png',
    },
    {
      key: nanoid(),
      value: "You're welcome! Let me know if you have any more questions.",
      name: 'AI Assistant',
      avatar: 'https://github.com/openai.png',
    },
  ];

const Example = () => {
  const [visibleMessages, setVisibleMessages] = useState<
    {
      key: string;
      value: string;
      name: string;
      avatar: string;
    }[]
  >([]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length && messages[currentIndex]) {
        const currentMessage = messages[currentIndex];
        setVisibleMessages((prev) => [
          ...prev,
          {
            key: currentMessage.key,
            value: currentMessage.value,
            name: currentMessage.name,
            avatar: currentMessage.avatar,
          },
        ]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <Conversation className="relative size-full" style={{ height: '498px' }}>
      <ConversationContent>
        {visibleMessages.length === 0 ? (
          <ConversationEmptyState
            icon={<MessageSquareIcon className="size-6" />}
            title="Start a conversation"
            description="Messages will appear here as the conversation progresses."
          />
        ) : (
          visibleMessages.map(({ key, value, name, avatar }, index) => (
            <Message from={index % 2 === 0 ? 'user' : 'assistant'} key={key}>
              <MessageContent>{value}</MessageContent>
              <MessageAvatar name={name} src={avatar} />
            </Message>
          ))
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
};

export default Example;
Image

Go to component
Code
Preview
tsx


'use client';

import { Image } from '@/components/ai-elements/image';

const exampleImage = {
  base64:
    '/9j/4AAQSkZJRgABAgEASABIAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/CABEIASwBLAMBEQACEQEDEQH/xAA5AAABAwUBAQEAAAAAAAAAAAACAQMEAAcICQoFBgsBAAICAwEBAAAAAAAAAAAAAAABAgQDBQYHCP/+2P5oZ4H9P5oH+/COk/wA1IdH8j4Gi+fiQhdNWOoB8APeZ0Jk4H91v29+H5oj+95Pvm50d+Afg+/Wj9/1/OulPU/ZAoVOYk6sP/npdedMkkc8e+qtGD7kv80ffA1k9+kgGqyb0FGZHr40ZPic0P7+mZ1RC693h0+dGhJofzRMnodEyeoHjR/Lzj3/dCQ+B8/BOFo0eIHvfWCePLf8ANN9AJ+vYWhLer94wtV7u/XfK0Z4kiOCH+nviNHPBG24H14xpS5PEIExGsdx8AhqyQyrKDL21uEWWIQfBa25js17zoS2KAjuBcVv2WgAQDuAfIB1//9k=',
  mediaType: 'image/jpeg',
  uint8Array: new Uint8Array([]),
};

const Example = () => (
  <Image
    {...exampleImage}
    alt="Example generated image"
    className="h-[150px] aspect-square border"
  />
);

export default Example;
Loader

Go to component
Code
Preview
tsx


'use client';

import { Loader } from '@/components/ai-elements/loader';

const Example = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader />
    </div>
  );
};

export default Example;
Message

Go to component
Code
Preview
tsx


'use client';

import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ai-elements/message';
import { nanoid } from 'nanoid';

const messages: {
  key: string;
  from: 'user' | 'assistant';
  content: string;
  avatar: string;
  name: string;
}[] = [
  {
    key: nanoid(),
    from: 'user',
    content: 'Hello, how are you?',
    avatar: 'https://github.com/haydenbleasel.png',
    name: 'Hayden Bleasel',
  },
];

const Example = () => (
  <>
    {messages.map(({ content, ...message }) => (
      <Message from={message.from} key={message.key}>
        <MessageContent>{content}</MessageContent>
        <MessageAvatar name={message.name} src={message.avatar} />
      </Message>
    ))}
  </>
);

export default Example;
Open In Chat

Go to component
Code
Preview
tsx


'use client';

import {
  OpenIn,
  OpenInChatGPT,
  OpenInClaude,
  OpenInContent,
  OpenInCursor,
  OpenInScira,
  OpenInT3,
  OpenInTrigger,
  OpenInv0,
} from '@/components/ai-elements/open-in-chat';

const Example = () => {
  const sampleQuery = 'How can I implement authentication in Next.js?';

  return (
    <div className="h-[242px]">
      <OpenIn query={sampleQuery}>
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
  );
};

export default Example;
Prompt Input

Go to component
Code
Preview
tsx


'use client';

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  type PromptInputMessage,
  PromptInputModelSelect,
  PromptInputModelSelectContent,
  PromptInputModelSelectItem,
  PromptInputModelSelectTrigger,
  PromptInputModelSelectValue,
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon } from 'lucide-react';
import { useRef, useState } from 'react';

const models = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  { id: 'claude-2', name: 'Claude 2' },
  { id: 'claude-instant', name: 'Claude Instant' },
  { id: 'palm-2', name: 'PaLM 2' },
  { id: 'llama-2-70b', name: 'Llama 2 70B' },
  { id: 'llama-2-13b', name: 'Llama 2 13B' },
  { id: 'cohere-command', name: 'Command' },
  { id: 'mistral-7b', name: 'Mistral 7B' },
];

const SUBMITTING_TIMEOUT = 200;
const STREAMING_TIMEOUT = 2000;

const Example = () => {
  const [text, setText] = useState<string>('');
  const [model, setModel] = useState<string>(models[0].id);
  const [status, setStatus] = useState<
    'submitted' | 'streaming' | 'ready' | 'error'
  >('ready');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stop = () => {
    console.log('Stopping request...');

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setStatus('ready');
  };

  const handleSubmit = (message: PromptInputMessage) => {
    // If currently streaming or submitted, stop instead of submitting
    if (status === 'streaming' || status === 'submitted') {
      stop();
      return;
    }

    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    setStatus('submitted');

    console.log('Submitting message:', message);

    setTimeout(() => {
      setStatus('streaming');
    }, SUBMITTING_TIMEOUT);

    timeoutRef.current = setTimeout(() => {
      setStatus('ready');
      timeoutRef.current = null;
    }, STREAMING_TIMEOUT);
  };

  return (
    <div className="flex flex-col justify-end size-full">
      <PromptInput globalDrop multiple onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputAttachments>
            {(attachment) => <PromptInputAttachment data={attachment} />}
          </PromptInputAttachments>
          <PromptInputTextarea
            onChange={(e) => setText(e.target.value)}
            ref={textareaRef}
            value={text}
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
              onTranscriptionChange={setText}
              textareaRef={textareaRef}
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
                {models.map((modelOption) => (
                  <PromptInputModelSelectItem
                    key={modelOption.id}
                    value={modelOption.id}
                  >
                    {modelOption.name}
                  </PromptInputModelSelectItem>
                ))}
              </PromptInputModelSelectContent>
            </PromptInputModelSelect>
          </PromptInputTools>
          <PromptInputSubmit className="!h-8" status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
};

export default Example;
Queue

Go to component
Code
Preview
tsx


'use client';

import {
  Queue,
  QueueItem,
  QueueItemAction,
  QueueItemActions,
  QueueItemAttachment,
  QueueItemContent,
  QueueItemDescription,
  QueueItemFile,
  QueueItemImage,
  QueueItemIndicator,
  QueueList,
  type QueueMessage,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
  type QueueTodo,
} from '@/components/ai-elements/queue';
import { ArrowUp, Trash2 } from 'lucide-react';
import { useState } from 'react';

const sampleMessages: QueueMessage[] = [
  {
    id: 'msg-1',
    parts: [{ type: 'text', text: 'How do I set up the project?' }],
  },
  {
    id: 'msg-2',
    parts: [{ type: 'text', text: 'What is the roadmap for Q4?' }],
  },
  {
    id: 'msg-3',
    parts: [{ type: 'text', text: 'Can you review my PR?' }],
  },
  {
    id: 'msg-4',
    parts: [{ type: 'text', text: 'Please generate a changelog.' }],
  },
  {
    id: 'msg-5',
    parts: [{ type: 'text', text: 'Add dark mode support.' }],
  },
  {
    id: 'msg-6',
    parts: [{ type: 'text', text: 'Optimize database queries.' }],
  },
  {
    id: 'msg-7',
    parts: [{ type: 'text', text: 'Set up CI/CD pipeline.' }],
  },
];

const sampleTodos: QueueTodo[] = [
  {
    id: 'todo-1',
    title: 'Write project documentation',
    description: 'Complete the README and API docs',
    status: 'completed',
  },
  {
    id: 'todo-2',
    title: 'Implement authentication',
    status: 'pending',
  },
  {
    id: 'todo-3',
    title: 'Fix bug #42',
    description: 'Resolve crash on settings page',
    status: 'pending',
  },
  {
    id: 'todo-4',
    title: 'Refactor queue logic',
    description: 'Unify queue and todo state management',
    status: 'pending',
  },
  {
    id: 'todo-5',
    title: 'Add unit tests',
    description: 'Increase test coverage for hooks',
    status: 'pending',
  },
];

const Example = () => {
  const [messages, setMessages] = useState(sampleMessages);
  const [todos, setTodos] = useState(sampleTodos);

  const handleRemoveMessage = (id: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  const handleRemoveTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const handleSendNow = (id: string) => {
    console.log('Send now:', id);
    handleRemoveMessage(id);
  };

  if (messages.length === 0 && todos.length === 0) {
    return null;
  }

  return (
    <Queue>
      {messages.length > 0 && (
        <QueueSection>
          <QueueSectionTrigger>
            <QueueSectionLabel count={messages.length} label="Queued" />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {messages.map((message) => {
                const summary = (() => {
                  const textParts = message.parts.filter(
                    (p) => p.type === 'text',
                  );
                  const text = textParts
                    .map((p) => p.text)
                    .join(' ')
                    .trim();
                  return text || '(queued message)';
                })();

                const hasFiles = message.parts.some(
                  (p) => p.type === 'file' && p.url,
                );

                return (
                  <QueueItem key={message.id}>
                    <div className="flex items-center gap-2">
                      <QueueItemIndicator />
                      <QueueItemContent>{summary}</QueueItemContent>
                      <QueueItemActions>
                        <QueueItemAction
                          aria-label="Remove from queue"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemoveMessage(message.id);
                          }}
                          title="Remove from queue"
                        >
                          <Trash2 size={12} />
                        </QueueItemAction>
                        <QueueItemAction
                          aria-label="Send now"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSendNow(message.id);
                          }}
                        >
                          <ArrowUp size={14} />
                        </QueueItemAction>
                      </QueueItemActions>
                    </div>
                    {hasFiles && (
                      <QueueItemAttachment>
                        {message.parts
                          .filter((p) => p.type === 'file' && p.url)
                          .map((file) => {
                            if (
                              file.mediaType?.startsWith('image/') &&
                              file.url
                            ) {
                              return (
                                <QueueItemImage
                                  alt={file.filename || 'attachment'}
                                  key={file.url}
                                  src={file.url}
                                />
                              );
                            }
                            return (
                              <QueueItemFile key={file.url}>
                                {file.filename || 'file'}
                              </QueueItemFile>
                            );
                          })}
                      </QueueItemAttachment>
                    )}
                  </QueueItem>
                );
              })}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      )}
      {todos.length > 0 && (
        <QueueSection>
          <QueueSectionTrigger>
            <QueueSectionLabel count={todos.length} label="Todo" />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {todos.map((todo) => {
                const isCompleted = todo.status === 'completed';

                return (
                  <QueueItem key={todo.id}>
                    <div className="flex items-center gap-2">
                      <QueueItemIndicator completed={isCompleted} />
                      <QueueItemContent completed={isCompleted}>
                        {todo.title}
                      </QueueItemContent>
                      <QueueItemActions>
                        <QueueItemAction
                          aria-label="Remove todo"
                          onClick={() => handleRemoveTodo(todo.id)}
                        >
                          <Trash2 size={12} />
                        </QueueItemAction>
                      </QueueItemActions>
                    </div>
                    {todo.description && (
                      <QueueItemDescription completed={isCompleted}>
                        {todo.description}
                      </QueueItemDescription>
                    )}
                  </QueueItem>
                );
              })}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      )}
    </Queue>
  );
};

export default Example;
Reasoning

Go to component
Code
Preview
tsx


'use client';

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { useCallback, useEffect, useState } from 'react';

const reasoningSteps = [
  'Let me think about this problem step by step.',
  '\n\nFirst, I need to understand what the user is asking for.',
  '\n\nThey want a reasoning component that opens automatically when streaming begins and closes when streaming finishes. The component should be composable and follow existing patterns in the codebase.',
  '\n\nThis seems like a collapsible component with state management would be the right approach.',
].join('');

const Example = () => {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [tokens, setTokens] = useState<string[]>([]);

  // Function to chunk text into fake tokens of 3-4 characters
  const chunkIntoTokens = useCallback((text: string): string[] => {
    const tokens: string[] = [];
    let i = 0;
    while (i < text.length) {
      const chunkSize = Math.floor(Math.random() * 2) + 3; // Random size between 3-4
      tokens.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
    return tokens;
  }, []);

  useEffect(() => {
    const tokenizedSteps = chunkIntoTokens(reasoningSteps);
    setTokens(tokenizedSteps);
    setContent('');
    setCurrentTokenIndex(0);
    setIsStreaming(true);
  }, [chunkIntoTokens]);

  useEffect(() => {
    if (!isStreaming || currentTokenIndex >= tokens.length) {
      if (isStreaming) {
        setIsStreaming(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      setContent((prev) => prev + tokens[currentTokenIndex]);
      setCurrentTokenIndex((prev) => prev + 1);
    }, 25); // Faster interval since we're streaming smaller chunks

    return () => clearTimeout(timer);
  }, [isStreaming, currentTokenIndex, tokens]);

  return (
    <div className="w-full p-4" style={{ height: '300px' }}>
      <Reasoning className="w-full" isStreaming={isStreaming}>
        <ReasoningTrigger />
        <ReasoningContent>{content}</ReasoningContent>
      </Reasoning>
    </div>
  );
};

export default Example;
Response

Go to component
Code
Preview
tsx


'use client';

import { Response } from '@/components/ai-elements/response';
import { useEffect, useState } from 'react';

const tokens = [
  '### Hello',
  ' World',
  '\n\n',
  'This',
  ' is',
  ' a',
  ' **mark',
  'down',
  '**',
  ' response',
  ' from',
  ' an',
  ' AI',
  ' model',
  '.',
  '\n\n',
  '---',
  '\n\n',
  '## Tables',
  '\n\n',
  '| Column 1',
  ' | Column 2',
  ' | Column 3',
  ' |',
  '\n',
  '|----------|----------|----------|',
  '\n',
  '| Row 1, Col 1',
  ' | Row 1, Col 2',
  ' | Row 1, Col 3',
  ' |',
  '\n',
  '| Row 2, Col 1',
  ' | Row 2, Col 2',
  ' | Row 2, Col 3',
  ' |',
  '\n',
  '| Row 3, Col 1',
  ' | Row 3, Col 2',
  ' | Row 3, Col 3',
  ' |',
  '\n\n',
  '## Blockquotes',
  '\n\n',
  '> This',
  ' is',
  ' a',
  ' blockquote.',
  ' It',
  ' can',
  ' contain',
  ' multiple',
  ' lines',
  ' and',
  ' **formatted**',
  ' text.',
  '\n',
  '>',
  '\n',
  '> It',
  ' can',
  ' even',
  ' have',
  ' multiple',
  ' paragraphs.',
  '\n\n',
  '## Inline',
  ' Code',
  '\n\n',
  'Here',
  ' is',
  ' some',
  ' text',
  ' with',
  ' `inline',
  ' code`',
  ' in',
  ' the',
  ' middle',
  ' of',
  ' a',
  ' sentence.',
  ' You',
  ' can',
  ' also',
  ' use',
  ' `const',
  ' x',
  ' =',
  ' 42`',
  ' for',
  ' variable',
  ' declarations.',
  '\n\n',
  '## Code',
  ' Blocks',
  '\n\n',
  '```',
  'javascript',
  '\n',
  'const',
  ' greeting',
  ' = ',
  "'Hello, world!'",
  ';',
  '\n',
  'console',
  '.',
  'log',
  '(',
  'greeting',
  ')',
  ';',
  '\n',
  '```',
  '\n\n',
  '## Math',
  '\n\n',
  'It',
  ' also',
  ' supports',
  ' math',
  ' equations',
  '. ',
  ' Here',
  ' is',
  ' a',
  ' display',
  ' equation',
  ' for',
  ' the',
  ' quadratic',
  ' formula',
  ':',
  '\n\n',
  '$$',
  '\n',
  'x',
  ' = ',
  '\\frac',
  '{',
  '-b',
  ' \\pm',
  ' \\sqrt',
  '{',
  'b^2',
  ' -',
  ' 4ac',
  '}',
  '}',
  '{',
  '2a',
  '}',
  '\n',
  '$$',
  '\n\n',
  '## Links',
  ' and',
  ' Lists',
  '\n\n',
  "Here's",
  ' a',
  ' [',
  'link',
  '](',
  'https://example.com',
  ')',
  ' and',
  ' some',
  ' more',
  ' text',
  ' with',
  ' an',
  ' unordered',
  ' list',
  ':',
  '\n\n',
  '-',
  ' Item',
  ' one',
  '\n',
  '-',
  ' Item',
  ' two',
  '\n',
  '-',
  ' Item',
  ' three',
  '\n\n',
  '## Ordered',
  ' Lists',
  '\n\n',
  '1.',
  ' First',
  ' item',
  '\n',
  '2.',
  ' Second',
  ' item',
  '\n',
  '3.',
  ' Third',
  ' item',
];

const Example = () => {
  const [content, setContent] = useState('');

  useEffect(() => {
    let currentContent = '';
    let index = 0;

    const interval = setInterval(() => {
      if (index < tokens.length) {
        currentContent += tokens[index];
        setContent(currentContent);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return <Response className="h-[500px]">{content}</Response>;
};

export default Example;
Shimmer

Go to component
Code
Preview
tsx


'use client';

import { Shimmer } from '@/components/ai-elements/shimmer';

const Example = () => (
  <div className="flex items-center justify-center p-8 size-full">
    <Shimmer>Generating your response...</Shimmer>
  </div>
);

export default Example;
Sources

Go to component
Code
Preview
tsx


'use client';

import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from 'components/ai-elements/sources';

const sources = [
  { href: 'https://stripe.com/docs/api', title: 'Stripe API Documentation' },
  { href: 'https://docs.github.com/en/rest', title: 'GitHub REST API' },
  {
    href: 'https://docs.aws.amazon.com/sdk-for-javascript/',
    title: 'AWS SDK for JavaScript',
  },
];

const Example = () => (
  <div style={{ height: '110px' }}>
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((source) => (
          <Source href={source.href} key={source.href} title={source.title} />
        ))}
      </SourcesContent>
    </Sources>
  </div>
);

export default Example;
Suggestion

Go to component
Code
Preview
tsx


'use client';

import {
  Suggestion,
  Suggestions,
} from '@/components/ai-elements/suggestion';

const suggestions = [
  'What are the latest trends in AI?',
  'How does machine learning work?',
  'Explain quantum computing',
  'Best practices for React development',
  'Tell me about TypeScript benefits',
  'How to optimize database queries?',
  'What is the difference between SQL and NoSQL?',
  'Explain cloud computing basics',
];

const Example = () => {
  const handleSuggestionClick = (suggestion: string) => {
    console.log('Selected suggestion:', suggestion);
  };

  return (
    <Suggestions>
      {suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion}
          onClick={handleSuggestionClick}
          suggestion={suggestion}
        />
      ))}
    </Suggestions>
  );
};

export default Example;
Task

Go to component
Code
Preview
tsx


'use client';

import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from '@/components/ai-elements/task';
import { nanoid } from 'nanoid';
import type { ReactNode } from 'react';
import { SiReact } from '@icons-pack/react-simple-icons';

const Example = () => {
  const tasks: { key: string; value: ReactNode }[] = [
    { key: nanoid(), value: 'Searching "app/page.tsx, components structure"' },
    {
      key: nanoid(),
      value: (
        <span className="inline-flex items-center gap-1" key="read-page-tsx">
          Read
          <TaskItemFile>
            <SiReact color="#149ECA" className="size-4" />
            <span>page.tsx</span>
          </TaskItemFile>
        </span>
      ),
    },
    { key: nanoid(), value: 'Scanning 52 files' },
    { key: nanoid(), value: 'Scanning 2 files' },
    {
      key: nanoid(),
      value: (
        <span className="inline-flex items-center gap-1" key="read-layout-tsx">
          Reading files
          <TaskItemFile>
            <SiReact color="#149ECA" className="size-4" />
            <span>layout.tsx</span>
          </TaskItemFile>
        </span>
      ),
    },
  ];

  return (
    <div style={{ height: '200px' }}>
      <Task className="w-full">
        <TaskTrigger title="Found project files" />
        <TaskContent>
          {tasks.map((task) => (
            <TaskItem key={task.key}>{task.value}</TaskItem>
          ))}
        </TaskContent>
      </Task>
    </div>
  );
};

export default Example;
Tool

Go to component
Code
Preview
tsx


'use client';

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolOutput,
  ToolInput,
} from '@/components/ai-elements/tool';
import { nanoid } from 'nanoid';
import type { ToolUIPart } from 'ai';

const toolCall: ToolUIPart = {
  type: 'tool-database_query' as const,
  toolCallId: nanoid(),
  state: 'output-available' as const,
  input: {
    query: 'SELECT COUNT(*) FROM users WHERE created_at >= ?',
    params: ['2024-01-01'],
    database: 'analytics',
  },
  output: [
    {
      userId: 1,
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: '2024-01-15',
    },
    {
      userId: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: '2024-01-20',
    },
    {
      userId: 3,
      name: 'Bob Wilson',
      email: 'bob@example.com',
      createdAt: '2024-02-01',
    },
    {
      userId: 4,
      name: 'Alice Brown',
      email: 'alice@example.com',
      createdAt: '2024-02-10',
    },
    {
      userId: 5,
      name: 'Charlie Davis',
      email: 'charlie@example.com',
      createdAt: '2024-02-15',
    },
  ],
  errorText: undefined,
};

const Example = () => (
  <div style={{ height: '500px' }}>
    <Tool>
      <ToolHeader type={toolCall.type} state={toolCall.state} />
      <ToolContent>
        <ToolInput input={toolCall.input} />
        {toolCall.state === 'output-available' && (
          <ToolOutput errorText={toolCall.errorText} output={toolCall.output} />
        )}
      </ToolContent>
    </Tool>
  </div>
);

export default Example;
Web Preview

Go to component
Code
Preview
tsx


'use client';

import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewNavigationButton,
  WebPreviewUrl,
  WebPreviewBody,
  WebPreviewConsole,
} from '@/components/ai-elements/web-preview';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ExternalLinkIcon,
  Maximize2Icon,
  MousePointerClickIcon,
  RefreshCcwIcon,
} from 'lucide-react';
import { useState } from 'react';

const exampleLogs = [
  {
    level: 'log' as const,
    message: 'Page loaded successfully',
    timestamp: new Date(Date.now() - 10000),
  },
  {
    level: 'warn' as const,
    message: 'Deprecated API usage detected',
    timestamp: new Date(Date.now() - 5000),
  },
  {
    level: 'error' as const,
    message: 'Failed to load resource',
    timestamp: new Date(),
  },
];

const code = [
  {
    language: 'jsx',
    filename: 'MyComponent.jsx',
    code: `function MyComponent(props) {
  return (
    <div>
      <h1>Hello, {props.name}!</h1>
      <p>This is an example React component.</p>
    </div>
  );
}`,
  },
];

const Example = () => {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <WebPreview
      defaultUrl="/"
      onUrlChange={(url) => console.log('URL changed to:', url)}
      style={{ height: '400px' }}
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
          onClick={() => setFullscreen(!fullscreen)}
        >
          <Maximize2Icon className="size-4" />
        </WebPreviewNavigationButton>
      </WebPreviewNavigation>

      <WebPreviewBody src="https://ai-sdk.dev/" />

      <WebPreviewConsole logs={exampleLogs} />
    </WebPreview>
  );
};

export default Example;
Inline Citation

Go to component
Code
Preview
tsx


'use client';

import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardBody,
  InlineCitationCardTrigger,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationText,
} from '@/components/ai-elements/inline-citation';

const citation = {
  text: 'The technology continues to evolve rapidly, with new breakthroughs being announced regularly',
  sources: [
    {
      title: 'Advances in Natural Language Processing',
      url: 'https://example.com/nlp-advances',
      description:
        'A comprehensive study on the recent developments in natural language processing technologies and their applications.',
    },
    {
      title: 'Breakthroughs in Machine Learning',
      url: 'https://mlnews.org/breakthroughs',
      description:
        'An overview of the most significant machine learning breakthroughs in the past year.',
    },
    {
      title: 'AI in Healthcare: Current Trends',
      url: 'https://healthai.com/trends',
      description:
        'A report on how artificial intelligence is transforming healthcare and diagnostics.',
    },
    {
      title: 'Ethics of Artificial Intelligence',
      url: 'https://aiethics.org/overview',
      description:
        'A discussion on the ethical considerations and challenges in the development of AI.',
    },
    {
      title: 'Scaling Deep Learning Models',
      url: 'https://deeplearninghub.com/scaling-models',
      description:
        'Insights into the technical challenges and solutions for scaling deep learning architectures.',
    },
    {
      title: 'Natural Language Understanding Benchmarks',
      url: 'https://nlubenchmarks.com/latest',
      description:
        'A summary of the latest benchmarks and evaluation metrics for natural language understanding systems.',
    },
  ],
};

const Example = () => {
  return (
    <p className="text-sm leading-relaxed">
      According to recent studies, artificial intelligence has shown remarkable
      progress in natural language processing.{' '}
      <InlineCitation>
        <InlineCitationText>{citation.text}</InlineCitationText>
        <InlineCitationCard>
          <InlineCitationCardTrigger
            sources={citation.sources.map((source) => source.url)}
          />
          <InlineCitationCardBody>
            <InlineCitationCarousel>
              <InlineCitationCarouselHeader>
                <InlineCitationCarouselPrev />
                <InlineCitationCarouselNext />
                <InlineCitationCarouselIndex />
              </InlineCitationCarouselHeader>
              <InlineCitationCarouselContent>
                {citation.sources.map((source) => (
                  <InlineCitationCarouselItem key={source.url}>
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
  );
};

export default Example;
View the source code for all components on GitHub.

Next

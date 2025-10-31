'use client';

import { memo, useEffect, useState } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Activity, MessageSquare, Sparkles, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EventNodeData {
  label: string;
  type: 'TEXT_MESSAGE_CHUNK' | 'CUSTOM' | 'SUGGESTIONS' | 'TASK_UPDATE';
  timestamp?: number;
  autoRemove?: boolean;
}

export const EventNode = memo(({ data, selected }: NodeProps<EventNodeData>) => {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in animation
    const fadeInTimer = setTimeout(() => setOpacity(1), 50);

    if (data.autoRemove) {
      // Fade out after 5 seconds
      const fadeOutTimer = setTimeout(() => {
        setOpacity(0);
      }, 5000);

      return () => {
        clearTimeout(fadeInTimer);
        clearTimeout(fadeOutTimer);
      };
    }

    return () => clearTimeout(fadeInTimer);
  }, [data.autoRemove]);

  const eventIcons = {
    TEXT_MESSAGE_CHUNK: MessageSquare,
    CUSTOM: Activity,
    SUGGESTIONS: Sparkles,
    TASK_UPDATE: ListTodo,
  };

  const eventColors = {
    TEXT_MESSAGE_CHUNK: 'from-blue-400 to-blue-600',
    CUSTOM: 'from-amber-400 to-amber-600',
    SUGGESTIONS: 'from-purple-400 to-purple-600',
    TASK_UPDATE: 'from-green-400 to-green-600',
  };

  const eventBgColors = {
    TEXT_MESSAGE_CHUNK: 'bg-blue-500/10',
    CUSTOM: 'bg-amber-500/10',
    SUGGESTIONS: 'bg-purple-500/10',
    TASK_UPDATE: 'bg-green-500/10',
  };

  const Icon = eventIcons[data.type];

  return (
    <div
      className="relative transition-all duration-1000 group"
      style={{ opacity }}
    >
      {/* Pulsing gradient border */}
      <div
        className={cn(
          'absolute -inset-[1px] rounded-md bg-gradient-to-r opacity-50 blur-sm animate-pulse transition-all duration-300',
          eventColors[data.type],
          selected && 'opacity-100 blur-md scale-105'
        )}
      />

      {/* Node content */}
      <div
        className={cn(
          'relative bg-background rounded-md border shadow-md min-w-[160px] transition-all duration-300',
          selected ? 'border-primary scale-105' : 'border-transparent hover:scale-102'
        )}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="w-2 h-2 !bg-primary transition-all hover:scale-150"
          isConnectable={false}
        />

        <div className={cn('p-3', eventBgColors[data.type])}>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 animate-pulse" />
            <div>
              <h4 className="font-medium text-xs">{data.label}</h4>
              {data.timestamp && (
                <p className="text-[10px] text-muted-foreground">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Right}
          className="w-2 h-2 !bg-primary transition-all hover:scale-150"
          isConnectable={false}
        />
      </div>
    </div>
  );
});

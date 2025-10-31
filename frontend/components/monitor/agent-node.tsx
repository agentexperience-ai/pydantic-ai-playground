'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Brain, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AgentNodeData {
  label: string;
  model: string;
  status: 'idle' | 'running' | 'error';
  webSearch?: boolean;
  thinking?: boolean;
}

export const AgentNode = memo(({ data, selected }: NodeProps<AgentNodeData>) => {
  const statusColors = {
    idle: 'from-emerald-500 to-teal-500',
    running: 'from-blue-500 to-cyan-500',
    error: 'from-amber-500 to-orange-500',
  };

  const statusBgColors = {
    idle: 'bg-emerald-500/10',
    running: 'bg-blue-500/10',
    error: 'bg-amber-500/10',
  };

  return (
    <div className="relative group">
      {/* Glowing animated gradient border - Turbo style */}
      <div
        className={cn(
          'absolute -inset-[2px] rounded-lg bg-gradient-to-r opacity-75 blur-sm transition-all duration-300',
          statusColors[data.status],
          data.status === 'running' && 'animate-pulse',
          selected && 'opacity-100 blur-md scale-105'
        )}
      />

      {/* Node content */}
      <div
        className={cn(
          'relative bg-background rounded-lg border-2 shadow-lg min-w-[220px] transition-all duration-300',
          selected ? 'border-primary scale-105' : 'border-transparent hover:scale-102'
        )}
      >
        {/* Top handle for incoming connections */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-primary transition-all hover:scale-150"
          isConnectable={true}
        />

        <div className={cn('p-4 rounded-t-lg', statusBgColors[data.status])}>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5" />
            <h3 className="font-semibold text-sm">{data.label}</h3>
          </div>

          <p className="text-xs text-muted-foreground mb-3">{data.model}</p>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-all',
                statusBgColors[data.status]
              )}
            >
              {data.status === 'running' && <Zap className="w-3 h-3 mr-1 animate-pulse" />}
              {data.status}
            </span>

            {data.webSearch && (
              <Globe className="w-4 h-4 text-muted-foreground" title="Web Search Enabled" />
            )}
          </div>
        </div>

        {/* Bottom handle for outgoing connections */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-primary transition-all hover:scale-150"
          isConnectable={true}
        />
      </div>
    </div>
  );
});

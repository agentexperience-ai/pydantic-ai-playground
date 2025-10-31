'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Wrench, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolNodeData {
  label: string;
  toolCount?: number;
  lastUsed?: number | null;
  executing?: boolean;
}

export const ToolNode = memo(({ data, selected }: NodeProps<ToolNodeData>) => {
  const formatLastUsed = (timestamp: number | null | undefined) => {
    if (!timestamp) return 'Never used';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="relative group">
      {/* Animated gradient border */}
      <div
        className={cn(
          'absolute -inset-[2px] rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-60 blur-sm transition-all duration-300',
          data.executing && 'animate-pulse opacity-90',
          selected && 'opacity-100 blur-md scale-105'
        )}
      />

      {/* Node content */}
      <div
        className={cn(
          'relative bg-background rounded-lg border-2 shadow-lg min-w-[200px] transition-all duration-300',
          selected ? 'border-purple-500 scale-105' : 'border-transparent hover:scale-102'
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-purple-500 transition-all hover:scale-150"
          isConnectable={true}
        />

        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wrench className={cn('w-4 h-4 text-purple-500', data.executing && 'animate-spin')} />
            <h3 className="font-semibold text-sm">{data.label}</h3>
          </div>

          {data.toolCount !== undefined && (
            <p className="text-xs text-muted-foreground mb-2">
              {data.toolCount} {data.toolCount === 1 ? 'tool' : 'tools'}
            </p>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {data.executing ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-green-500 animate-pulse" />
                <span className="text-green-500 font-medium">Executing...</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                <span>{formatLastUsed(data.lastUsed)}</span>
              </>
            )}
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-purple-500 transition-all hover:scale-150"
          isConnectable={true}
        />
      </div>
    </div>
  );
});

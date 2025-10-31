'use client';

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react';
import { useCallback, useState, useMemo, useEffect } from 'react';
import type { NodeTypes, EdgeTypes } from '@xyflow/react';
import { AgentNode } from '@/components/monitor/agent-node';
import { ToolNode } from '@/components/monitor/tool-node';
import { EventNode } from '@/components/monitor/event-node';
import { useAgUiMonitor } from '@/hooks/use-ag-ui-monitor';
import { getLayoutedElements } from '@/lib/layout/dagre';
import { Play, Square, Repeat } from 'lucide-react';

const initialNodes: Node[] = [
  {
    id: 'agent-1',
    type: 'agent',
    position: { x: 0, y: 0 },
    data: {
      label: 'GPT-5 Agent',
      model: 'openai-responses:gpt-5',
      status: 'idle',
      webSearch: true
    },
  },
  {
    id: 'tool-memory',
    type: 'tool',
    position: { x: 0, y: 0 },
    data: {
      label: 'Memory Tools',
      toolCount: 4,
      lastUsed: null,
      executing: false
    },
  },
  {
    id: 'tool-websearch',
    type: 'tool',
    position: { x: 0, y: 0 },
    data: {
      label: 'Web Search',
      toolCount: 1,
      lastUsed: null,
      executing: false
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'agent-memory',
    source: 'agent-1',
    target: 'tool-memory',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9333ea', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#9333ea',
    },
  },
  {
    id: 'agent-websearch',
    source: 'agent-1',
    target: 'tool-websearch',
    type: 'smoothstep',
    animated: false,
    style: { stroke: '#9333ea', strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#9333ea',
    },
  },
];

export default function MonitorPage() {
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      agent: AgentNode,
      tool: ToolNode,
      event: EventNode,
    }),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [testMessage, setTestMessage] = useState('What is the latest news about AI?');
  const [sessionId] = useState('monitor-session');

  // Initialize monitoring hook
  const monitor = useAgUiMonitor({
    onEvent: (event) => {
      console.log('Monitor event:', event);
    },
  });

  // Auto-layout on mount
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges,
      { direction: 'TB', nodeHeight: 120, rankSep: 200 }
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [setNodes, setEdges]);

  // Handle new connections
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge: Edge = {
        ...connection,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#3b82f6',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  // Handle node clicks
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  // Update agent status based on monitoring
  useEffect(() => {
    if (monitor.isMonitoring) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === 'agent-1'
            ? { ...node, data: { ...node.data, status: 'running' } }
            : node
        )
      );

      // Animate edges when monitoring
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: true,
          style: { stroke: '#3b82f6', strokeWidth: 3 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#3b82f6',
          },
        }))
      );
    } else {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === 'agent-1'
            ? { ...node, data: { ...node.data, status: 'idle' } }
            : node
        )
      );

      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: false,
          style: { stroke: '#9333ea', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#9333ea',
          },
        }))
      );
    }
  }, [monitor.isMonitoring, setNodes, setEdges]);

  // Add event nodes dynamically
  useEffect(() => {
    const recentEvents = monitor.events.slice(-5);

    const eventNodes: Node[] = recentEvents.map((event, index) => ({
      id: `event-${event.timestamp}`,
      type: 'event',
      position: { x: 100 + (index % 2) * 250, y: 600 + Math.floor(index / 2) * 100 },
      data: {
        label: event.type,
        type: 'CUSTOM' as const,
        timestamp: event.timestamp,
        autoRemove: true,
      },
    }));

    setNodes((nds) => {
      const nonEventNodes = nds.filter((n) => !n.id.startsWith('event-'));
      return [...nonEventNodes, ...eventNodes];
    });
  }, [monitor.events, setNodes]);

  // Handle re-layout
  const handleReLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      { direction: 'TB', nodeHeight: 120, rankSep: 200 }
    );
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [nodes, edges, setNodes, setEdges]);

  const handleStartMonitoring = async () => {
    if (testMessage.trim()) {
      await monitor.startMonitoring(sessionId, testMessage);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>System Monitor</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Stats Grid */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="font-semibold mb-2">Active Agent</h3>
              <p className="text-sm text-muted-foreground">
                {monitor.isMonitoring ? '🟢 Running' : '⚫ Idle'}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="font-semibold mb-2">Tools Available</h3>
              <p className="text-sm text-muted-foreground">5 tools registered</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="font-semibold mb-2">SSE Events</h3>
              <p className="text-sm text-muted-foreground">{monitor.events.length} events</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4">
              <h3 className="font-semibold mb-2">Connections</h3>
              <p className="text-sm text-muted-foreground">{edges.length} edges</p>
            </div>
          </div>

          {/* Test Controls */}
          <div className="rounded-xl bg-muted/50 p-4">
            <h3 className="font-semibold mb-3">Monitor Controls</h3>
            <div className="flex gap-2">
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter test message..."
                className="flex-1"
                disabled={monitor.isMonitoring}
              />
              {monitor.isMonitoring ? (
                <Button onClick={monitor.stopMonitoring} variant="destructive" size="icon">
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleStartMonitoring} size="icon">
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button onClick={handleReLayout} variant="outline" size="icon" title="Re-layout">
                <Repeat className="w-4 h-4" />
              </Button>
            </div>
            {monitor.error && (
              <p className="text-sm text-destructive mt-2">{monitor.error.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Drag nodes to reposition • Click handles to create connections • Scroll to zoom
            </p>
          </div>

          {/* React Flow Canvas */}
          <div className="min-h-[700px] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
              className="rounded-xl"
              attributionPosition="bottom-left"
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: false,
              }}
              proOptions={{ hideAttribution: false }}
            >
              <Background gap={16} size={1} />
              <Controls showInteractive={false} />
              <MiniMap
                zoomable
                pannable
                nodeColor={(node) => {
                  if (node.type === 'agent') return '#3b82f6';
                  if (node.type === 'tool') return '#9333ea';
                  if (node.type === 'event') return '#f59e0b';
                  return '#fff';
                }}
                nodeBorderRadius={8}
              />
            </ReactFlow>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

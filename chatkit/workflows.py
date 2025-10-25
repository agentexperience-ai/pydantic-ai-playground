"""Multi-agent workflow system similar to OpenAI's Agent Builder"""

from typing import Dict, List, Any, Optional, Callable
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelRetry, AgentRunError, ModelHTTPError, UnexpectedModelBehavior
from enum import Enum
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class NodeType(str, Enum):
    """Types of workflow nodes"""
    AGENT = "agent"
    TOOL = "tool"
    CONDITION = "condition"
    INPUT = "input"
    OUTPUT = "output"


class WorkflowNode(BaseModel):
    """Represents a node in the workflow"""
    id: str = Field(description="Unique node identifier")
    type: NodeType = Field(description="Type of node")
    name: str = Field(description="Display name")
    config: Dict[str, Any] = Field(default_factory=dict, description="Node configuration")
    inputs: List[str] = Field(default_factory=list, description="Input connections")
    outputs: List[str] = Field(default_factory=list, description="Output connections")


class WorkflowEdge(BaseModel):
    """Represents a connection between nodes"""
    source_node: str = Field(description="Source node ID")
    target_node: str = Field(description="Target node ID")
    source_output: str = Field(description="Source output name")
    target_input: str = Field(description="Target input name")


class Workflow(BaseModel):
    """Complete workflow definition"""
    id: str = Field(description="Workflow identifier")
    name: str = Field(description="Workflow name")
    nodes: Dict[str, WorkflowNode] = Field(default_factory=dict, description="All nodes")
    edges: List[WorkflowEdge] = Field(default_factory=list, description="All connections")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Workflow metadata")


class WorkflowExecutor:
    """Executes multi-agent workflows"""

    def __init__(self):
        self.workflows: Dict[str, Workflow] = {}
        self.agents: Dict[str, Agent] = {}

    def register_workflow(self, workflow: Workflow):
        """Register a workflow"""
        self.workflows[workflow.id] = workflow

    def create_agent_node(self, node_id: str, name: str, model: str, system_prompt: str) -> WorkflowNode:
        """Create an agent node"""
        agent = Agent(
            model=model,
            system_prompt=system_prompt
        )
        self.agents[node_id] = agent

        return WorkflowNode(
            id=node_id,
            type=NodeType.AGENT,
            name=name,
            config={
                "model": model,
                "system_prompt": system_prompt
            }
        )

    def create_input_node(self, node_id: str, name: str) -> WorkflowNode:
        """Create an input node"""
        return WorkflowNode(
            id=node_id,
            type=NodeType.INPUT,
            name=name,
            config={}
        )

    def create_tool_node(self, node_id: str, name: str, tool_function: Callable) -> WorkflowNode:
        """Create a tool node"""
        return WorkflowNode(
            id=node_id,
            type=NodeType.TOOL,
            name=name,
            config={
                "function": tool_function
            }
        )

    async def execute_workflow(
        self,
        workflow_id: str,
        input_data: Dict[str, Any],
        start_node: Optional[str] = None
    ) -> Dict[str, Any]:
        """Execute a workflow with given input"""
        workflow = self.workflows.get(workflow_id)
        if not workflow:
            raise ValueError(f"Workflow {workflow_id} not found")

        # Find starting node
        if not start_node:
            # Find input nodes
            input_nodes = [
                node for node in workflow.nodes.values()
                if node.type == NodeType.INPUT
            ]
            if not input_nodes:
                raise ValueError("No input node found in workflow")
            start_node = input_nodes[0].id

        # Execute workflow
        results = await self._execute_node(workflow, start_node, input_data, {})
        return results

    async def _execute_node(
        self,
        workflow: Workflow,
        node_id: str,
        input_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a single node"""
        node = workflow.nodes.get(node_id)
        if not node:
            raise ValueError(f"Node {node_id} not found")

        print(f"Executing node: {node.name} ({node.type})")

        if node.type == NodeType.AGENT:
            return await self._execute_agent_node(node, input_data, context)
        elif node.type == NodeType.TOOL:
            return await self._execute_tool_node(node, input_data, context)
        elif node.type == NodeType.CONDITION:
            return await self._execute_condition_node(node, input_data, context)
        else:
            # For input/output nodes, just pass data through
            return input_data

    async def _execute_agent_node(
        self,
        node: WorkflowNode,
        input_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute an agent node"""
        agent = self.agents.get(node.id)
        if not agent:
            raise ValueError(f"Agent {node.id} not found")

        # Prepare input for agent
        if isinstance(input_data, dict) and "message" in input_data:
            user_input = input_data["message"]
        else:
            user_input = str(input_data)

        # Execute agent with retry logic
        max_retries = 3

        for attempt in range(max_retries):
            try:
                result = await agent.run(user_input)

                return {
                    "output": result.output,
                    "node_id": node.id,
                    "type": "agent_response"
                }

            except ModelRetry as e:
                if attempt < max_retries - 1:
                    print(f"Model requested retry (attempt {attempt + 1}/{max_retries}): {e.message}")
                    await asyncio.sleep(1)  # Brief delay before retry
                    continue
                else:
                    raise AgentRunError(f"Max retries exceeded: {e.message}")
            except (ModelHTTPError, UnexpectedModelBehavior) as e:
                if attempt < max_retries - 1:
                    print(f"Model error, retrying (attempt {attempt + 1}/{max_retries}): {e}")
                    await asyncio.sleep(2)  # Longer delay for HTTP errors
                    continue
                else:
                    raise

    async def _execute_tool_node(
        self,
        node: WorkflowNode,
        input_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a tool node"""
        tool_function = node.config.get("function")
        if not tool_function:
            raise ValueError(f"Tool function not found for node {node.id}")

        # Execute tool
        if asyncio.iscoroutinefunction(tool_function):
            result = await tool_function(input_data)
        else:
            result = tool_function(input_data)

        return {
            "output": result,
            "node_id": node.id,
            "type": "tool_result"
        }

    async def _execute_condition_node(
        self,
        node: WorkflowNode,
        input_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute a condition node"""
        # Simple condition logic - can be extended
        condition = node.config.get("condition", "")

        # Evaluate condition (simplified)
        if condition and input_data.get("output", "").lower() in condition.lower():
            return {"condition_met": True, "output": input_data}
        else:
            return {"condition_met": False, "output": input_data}


# Example workflow templates
class WorkflowTemplates:
    """Pre-built workflow templates"""

    @staticmethod
    def create_support_workflow(executor: WorkflowExecutor) -> Workflow:
        """Create a customer support workflow"""
        workflow_id = "support_workflow"

        # Create nodes
        input_node = executor.create_input_node("input", "User Input")

        receptionist = executor.create_agent_node(
            "receptionist",
            "Receptionist",
            "openai:gpt-4o-mini",
            "You are a friendly receptionist. Greet users and understand their needs."
        )

        technical_support = executor.create_agent_node(
            "technical_support",
            "Technical Support",
            "openai:gpt-4o-mini",
            "You are a technical support specialist. Help users with technical issues."
        )

        billing_support = executor.create_agent_node(
            "billing_support",
            "Billing Support",
            "openai:gpt-4o-mini",
            "You are a billing specialist. Help users with billing and payment issues."
        )

        # Create workflow
        workflow = Workflow(
            id=workflow_id,
            name="Customer Support Workflow",
            nodes={
                "input": input_node,
                "receptionist": receptionist,
                "technical_support": technical_support,
                "billing_support": billing_support,
            },
            edges=[
                # Input goes to receptionist
                WorkflowEdge(
                    source_node="input",
                    target_node="receptionist",
                    source_output="user_input",
                    target_input="input"
                ),
                # Receptionist routes to appropriate specialist
                WorkflowEdge(
                    source_node="receptionist",
                    target_node="technical_support",
                    source_output="technical_issue",
                    target_input="input"
                ),
                WorkflowEdge(
                    source_node="receptionist",
                    target_node="billing_support",
                    source_output="billing_issue",
                    target_input="input"
                ),
            ],
            metadata={
                "description": "Multi-agent customer support workflow",
                "version": "1.0"
            }
        )

        executor.register_workflow(workflow)
        return workflow

    @staticmethod
    def create_research_workflow(executor: WorkflowExecutor) -> Workflow:
        """Create a research assistant workflow"""
        workflow_id = "research_workflow"

        # Create nodes
        input_node = executor.create_input_node("input", "Research Topic")

        researcher = executor.create_agent_node(
            "researcher",
            "Researcher",
            "openai:gpt-4o-mini",
            "You are a research assistant. Analyze topics and break them down."
        )

        summarizer = executor.create_agent_node(
            "summarizer",
            "Summarizer",
            "openai:gpt-4o-mini",
            "You summarize research findings concisely."
        )

        # Create workflow
        workflow = Workflow(
            id=workflow_id,
            name="Research Assistant Workflow",
            nodes={
                "input": input_node,
                "researcher": researcher,
                "summarizer": summarizer,
            },
            edges=[
                WorkflowEdge(
                    source_node="input",
                    target_node="researcher",
                    source_output="research_topic",
                    target_input="input"
                ),
                WorkflowEdge(
                    source_node="researcher",
                    target_node="summarizer",
                    source_output="research_findings",
                    target_input="input"
                ),
            ],
            metadata={
                "description": "Research and summarization workflow",
                "version": "1.0"
            }
        )

        executor.register_workflow(workflow)
        return workflow


# Example usage
async def main():
    """Example usage of the workflow system"""
    executor = WorkflowExecutor()

    # Create and register a workflow
    WorkflowTemplates.create_support_workflow(executor)

    # Execute the workflow
    input_data = {"message": "I'm having trouble with my internet connection"}
    result = await executor.execute_workflow("support_workflow", input_data)

    print(f"Workflow result: {result}")


if __name__ == "__main__":
    asyncio.run(main())
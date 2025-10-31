"""Core chat interface with pydantic-ai"""

from typing import AsyncIterator, Any, Dict, List, Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent, WebSearchTool
from pydantic_ai.exceptions import (
    ModelRetry,
    AgentRunError,
    ModelHTTPError,
    UnexpectedModelBehavior,
)
import asyncio
import os
import yaml
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


def load_system_config():
    """Load system configuration from YAML file"""
    config_path = os.path.join(os.path.dirname(__file__), "config.yaml")

    with open(config_path, "r") as f:
        config = yaml.safe_load(f)

    # Extract the XML system prompt from YAML
    xml_prompt = config.get("xml_system_prompt", "")

    # Extract the MinimalSystemPrompt from XML structure
    if "<MinimalSystemPrompt>" in xml_prompt:
        # Find the MinimalSystemPrompt section
        start = xml_prompt.find("<MinimalSystemPrompt>") + len("<MinimalSystemPrompt>")
        end = xml_prompt.find("</MinimalSystemPrompt>")
        minimal_prompt = xml_prompt[start:end].strip()

        # Extract content from CDATA section
        if "<![CDATA[" in minimal_prompt and "]]>" in minimal_prompt:
            cdata_start = minimal_prompt.find("<![CDATA[") + 9
            cdata_end = minimal_prompt.find("]]>")
            return minimal_prompt[cdata_start:cdata_end].strip()

    # Fallback to default prompt
    return """Role: Careful, helpful Claude for ChatKit memory-enabled conversations.

CRITICAL INSTRUCTIONS - YOU MUST FOLLOW THESE EXACTLY:
1. AUTOMATIC TOOL USAGE - You MUST use memory tools automatically without being asked:
   - When user says ANYTHING like "I'm X", "my name is X", "call me X" → IMMEDIATELY use store_personal_info tool
   - When user asks "what's my name", "do you remember X", "what do you know about me" → IMMEDIATELY use view_memory tool
   - When user shares preferences, facts, or important information → use add_fact tool

2. TOOL EXECUTION ORDER:
   - First: Detect if user message contains personal information → use store_personal_info
   - Second: If user asks about stored information → use view_memory
   - Third: Respond to user based on tool results

3. MEMORY TOOLS AVAILABLE:
   - store_personal_info: Automatically detect and store names from user messages
   - view_memory: Retrieve stored information and memory summary
   - add_fact: Store important user preferences and facts
   - add_note: Store general notes about conversations

4. ALWAYS:
   - Use tools proactively - don't wait for user to ask
   - Verify tool execution and handle failures gracefully
   - Follow tool schemas exactly
   - Format responses with clear CommonMark
   - Be concise and helpful
   - Follow safety policy; refuse unsafe requests

EXAMPLES:
User: "Hello, I'm user_name" → You: [use store_personal_info] → "Hello user_name! How can I help?"
User: "What's my name?" → You: [use view_memory] → "Your name is user_name!"
"""


class ChatMessage(BaseModel):
    """Represents a single chat message"""

    role: str = Field(description="Message role: user, assistant, or system")
    content: str = Field(description="Message content")
    timestamp: Optional[float] = Field(default=None, description="Message timestamp")


class ChatSession(BaseModel):
    """Represents a chat session with history"""

    session_id: str = Field(description="Unique session identifier")
    messages: List[ChatMessage] = Field(
        default_factory=list, description="Chat history"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Session metadata"
    )


class ChatResponse(BaseModel):
    """Response from the chat agent"""

    message: str = Field(description="Response content")
    session_id: str = Field(description="Session identifier")
    tool_calls: List[Dict[str, Any]] = Field(
        default_factory=list, description="Tool calls made"
    )
    metadata: Dict[str, Any] = Field(
        default_factory=dict, description="Response metadata"
    )


class ChatKitAgent:
    """Main chat agent with pydantic-ai"""

    def __init__(self, model: str = None):
        # Use environment variable or default model with web search enabled
        self.model = model or os.getenv("OPENAI_MODEL", "openai-responses:gpt-5")

        # Check if API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please set it in your .env file or environment."
            )

        # Import memory toolset
        from .tools import memory_toolset

        # Load system configuration from XML
        self.system_prompt = load_system_config()
        self.memory_toolset = memory_toolset

        # Create initial agent
        self.agent = self._create_agent(self.model)

        self.sessions: Dict[str, ChatSession] = {}

    def _create_agent(self, model: str):
        """Create a new agent with the specified model"""
        # Check if this is an OpenAI Responses model that supports web search
        if model.startswith("openai-responses:") or model == "openai:gpt-5":
            # Use OpenAI Responses model with web search
            actual_model = model if model.startswith("openai-responses:") else "openai-responses:gpt-5"

            return Agent(
                model=actual_model,
                system_prompt=self.system_prompt,
                toolsets=[self.memory_toolset],
                builtin_tools=[WebSearchTool()],  # Enable OpenAI native web search
            )
        else:
            # For non-OpenAI Responses models, use standard Agent without web search
            return Agent(
                model=model,
                system_prompt=self.system_prompt,
                toolsets=[self.memory_toolset],
            )

    def switch_model(self, model: str):
        """Switch to a different model"""
        self.model = model
        self.agent = self._create_agent(model)
        return {"message": f"Switched to model: {model}"}

    def create_session(self, session_id: Optional[str] = None) -> ChatSession:
        """Create a new chat session"""
        if session_id is None:
            import uuid

            session_id = str(uuid.uuid4())

        session = ChatSession(session_id=session_id)
        self.sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[ChatSession]:
        """Get an existing chat session"""
        return self.sessions.get(session_id)

    async def send_message(
        self, session_id: str, message: str, stream: bool = False
    ) -> AsyncIterator[ChatResponse]:
        """Send a message to the agent and get response"""
        session = self.get_session(session_id)
        if not session:
            session = self.create_session(session_id)

        # Add user message to history
        user_msg = ChatMessage(role="user", content=message)
        session.messages.append(user_msg)

        # Prepare context for the agent
        # Use the last message as input, previous messages as history
        message_history = []
        if len(session.messages) > 1:
            message_history = [
                msg.content
                for msg in session.messages[:-1]
                if msg.role in ["user", "assistant"]
            ]

        current_input = (
            message if not session.messages else session.messages[-1].content
        )

        if stream:
            async for chunk in self._stream_response(
                session_id, current_input, message_history
            ):
                yield chunk
        else:
            response = await self._get_response(
                session_id, current_input, message_history
            )
            yield response

    async def _stream_response(
        self, session_id: str, current_input: str, message_history: List[str]
    ) -> AsyncIterator[ChatResponse]:
        """Stream response from the agent"""
        response_content = ""
        max_retries = 3

        for attempt in range(max_retries):
            try:
                async for result in self.agent.run_stream(
                    current_input, message_history=message_history
                ):
                    if hasattr(result, "output") and result.output:
                        response_content += result.output
                        yield ChatResponse(
                            message=response_content,
                            session_id=session_id,
                            metadata={"streaming": True, "complete": False},
                        )

                # Final complete response
                yield ChatResponse(
                    message=response_content,
                    session_id=session_id,
                    metadata={"streaming": False, "complete": True},
                )
                break

            except ModelRetry as e:
                if attempt < max_retries - 1:
                    print(
                        f"Model requested retry (attempt {attempt + 1}/{max_retries}): {e.message}"
                    )
                    await asyncio.sleep(1)  # Brief delay before retry
                    continue
                else:
                    raise AgentRunError(f"Max retries exceeded: {e.message}")
            except (ModelHTTPError, UnexpectedModelBehavior) as e:
                if attempt < max_retries - 1:
                    print(
                        f"Model error, retrying (attempt {attempt + 1}/{max_retries}): {e}"
                    )
                    await asyncio.sleep(2)  # Longer delay for HTTP errors
                    continue
                else:
                    raise

    async def _get_response(
        self, session_id: str, current_input: str, message_history: List[str]
    ) -> ChatResponse:
        """Get complete response from the agent"""
        max_retries = 3

        for attempt in range(max_retries):
            try:
                result = await self.agent.run(
                    current_input, message_history=message_history
                )

                # Add assistant response to session
                session = self.get_session(session_id)
                if session:
                    assistant_msg = ChatMessage(role="assistant", content=result.output)
                    session.messages.append(assistant_msg)

                return ChatResponse(
                    message=result.output,
                    session_id=session_id,
                    tool_calls=[],  # TODO: Extract tool calls from result
                    metadata={"streaming": False, "complete": True},
                )

            except ModelRetry as e:
                if attempt < max_retries - 1:
                    print(
                        f"Model requested retry (attempt {attempt + 1}/{max_retries}): {e.message}"
                    )
                    await asyncio.sleep(1)  # Brief delay before retry
                    continue
                else:
                    raise AgentRunError(f"Max retries exceeded: {e.message}")
            except (ModelHTTPError, UnexpectedModelBehavior) as e:
                if attempt < max_retries - 1:
                    print(
                        f"Model error, retrying (attempt {attempt + 1}/{max_retries}): {e}"
                    )
                    await asyncio.sleep(2)  # Longer delay for HTTP errors
                    continue
                else:
                    raise


# Example usage
async def main():
    """Example usage of the ChatKit agent"""
    agent = ChatKitAgent()
    session = agent.create_session("test-session")

    print(f"Created session: {session.session_id}")

    # Send a message
    response = await agent.send_message(session.session_id, "Hello!")
    async for chunk in response:
        print(f"Response: {chunk.message}")


if __name__ == "__main__":
    asyncio.run(main())

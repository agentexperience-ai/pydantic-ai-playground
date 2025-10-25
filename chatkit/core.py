"""Core chat interface with pydantic-ai"""

from typing import AsyncIterator, Any, Dict, List, Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.exceptions import ModelRetry, AgentRunError, ModelHTTPError, UnexpectedModelBehavior
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class ChatMessage(BaseModel):
    """Represents a single chat message"""
    role: str = Field(description="Message role: user, assistant, or system")
    content: str = Field(description="Message content")
    timestamp: Optional[float] = Field(default=None, description="Message timestamp")


class ChatSession(BaseModel):
    """Represents a chat session with history"""
    session_id: str = Field(description="Unique session identifier")
    messages: List[ChatMessage] = Field(default_factory=list, description="Chat history")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Session metadata")


class ChatResponse(BaseModel):
    """Response from the chat agent"""
    message: str = Field(description="Response content")
    session_id: str = Field(description="Session identifier")
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list, description="Tool calls made")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Response metadata")


class ChatKitAgent:
    """Main chat agent with pydantic-ai"""

    def __init__(self, model: str = None):
        # Use environment variable or default model
        self.model = model or os.getenv("OPENAI_MODEL", "openai:gpt-4o-mini")

        # Check if API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please set it in your .env file or environment."
            )

        self.agent = Agent(
            model=self.model,
            system_prompt="""You are a helpful, friendly assistant.
            Provide clear, concise responses and be proactive in helping users.
            Use tools when available to provide better assistance.""",
        )
        self.sessions: Dict[str, ChatSession] = {}

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
        self,
        session_id: str,
        message: str,
        stream: bool = False
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
                msg.content for msg in session.messages[:-1]
                if msg.role in ["user", "assistant"]
            ]

        current_input = message if not session.messages else session.messages[-1].content

        if stream:
            async for chunk in self._stream_response(session_id, current_input, message_history):
                yield chunk
        else:
            response = await self._get_response(session_id, current_input, message_history)
            yield response

    async def _stream_response(
        self,
        session_id: str,
        current_input: str,
        message_history: List[str]
    ) -> AsyncIterator[ChatResponse]:
        """Stream response from the agent"""
        response_content = ""
        max_retries = 3

        for attempt in range(max_retries):
            try:
                async for result in self.agent.run_stream(
                    current_input,
                    message_history=message_history
                ):
                    if hasattr(result, 'output') and result.output:
                        response_content += result.output
                        yield ChatResponse(
                            message=response_content,
                            session_id=session_id,
                            metadata={"streaming": True, "complete": False}
                        )

                # Final complete response
                yield ChatResponse(
                    message=response_content,
                    session_id=session_id,
                    metadata={"streaming": False, "complete": True}
                )
                break

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

    async def _get_response(
        self,
        session_id: str,
        current_input: str,
        message_history: List[str]
    ) -> ChatResponse:
        """Get complete response from the agent"""
        max_retries = 3

        for attempt in range(max_retries):
            try:
                result = await self.agent.run(
                    current_input,
                    message_history=message_history
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
                    metadata={"streaming": False, "complete": True}
                )

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
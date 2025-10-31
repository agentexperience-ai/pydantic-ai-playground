"""FastAPI web interface for ChatKit with AG-UI support"""

from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi import Request
from pydantic import BaseModel
import json
import logging
import sys
from typing import AsyncIterator, Dict, List
from starlette.responses import StreamingResponse

from .core import ChatKitAgent
from .memory import chatkit_memory
from pydantic_ai.ag_ui import handle_ag_ui_request
from ag_ui.core import CustomEvent, RunAgentInput
from ag_ui.encoder import EventEncoder

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/tmp/chatkit.log"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("chatkit")


class ChatRequest(BaseModel):
    """Request model for chat messages"""

    message: str
    session_id: Optional[str] = None


class ChatResponseModel(BaseModel):
    """Response model for chat messages"""

    message: str
    session_id: str
    tool_calls: list = []
    metadata: dict = {}


class ChatKitServer:
    """ChatKit server with FastAPI"""

    def __init__(self):
        self.app = FastAPI(title="ChatKit", version="0.1.0")
        self.agent = ChatKitAgent()
        self.websocket_connections: Dict[str, WebSocket] = {}

        # Setup CORS
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        self._setup_routes()

    def _setup_routes(self):
        """Setup API routes"""

        @self.app.get("/api")
        async def api_info():
            """API information endpoint"""
            return {
                "name": "ChatKit API",
                "version": "0.1.0",
                "endpoints": {
                    "GET /api": "API information",
                    "GET /api/models": "Get available models",
                    "POST /api/session": "Create new chat session",
                    "GET /api/session/{session_id}": "Get session details",
                    "POST /api/chat": "Send chat message",
                    "GET /ws/{session_id}": "WebSocket for real-time chat",
                    "GET /api/memory": "Get memory summary",
                    "DELETE /api/memory": "Clear all memory",
                    "POST /api/memory/fact": "Add user fact",
                    "POST /api/memory/note": "Add note",
                    "POST /agui": "AG-UI protocol endpoint",
                },
            }

        @self.app.get("/api/models")
        async def get_available_models():
            """Get available models with GPT-5 family support"""
            logger.info("GET /api/models - Fetching available models")
            return {
                "models": [
                    {
                        "id": "openai-responses:gpt-5",
                        "name": "GPT-5 (Web Search)",
                        "provider": "openai",
                        "family": "gpt-5",
                        "supports_thinking": True,
                        "supports_web_search": True,
                        "description": "Latest GPT-5 model with web search capabilities",
                    },
                    {
                        "id": "openai:gpt-5",
                        "name": "GPT-5",
                        "provider": "openai",
                        "family": "gpt-5",
                        "supports_thinking": True,
                        "description": "Latest GPT-5 model with advanced reasoning capabilities",
                    },
                    {
                        "id": "openai:gpt-5-mini",
                        "name": "GPT-5 Mini",
                        "provider": "openai",
                        "family": "gpt-5",
                        "supports_thinking": True,
                        "description": "Fast and efficient GPT-5 model",
                    },
                    {
                        "id": "openai:gpt-4o",
                        "name": "GPT-4o",
                        "provider": "openai",
                        "family": "gpt-4",
                        "supports_thinking": False,
                        "description": "Latest GPT-4 model with multimodal capabilities",
                    },
                    {
                        "id": "openai:gpt-4o-mini",
                        "name": "GPT-4o Mini",
                        "provider": "openai",
                        "family": "gpt-4",
                        "supports_thinking": False,
                        "description": "Fast and cost-effective GPT-4 model",
                    },
                    {
                        "id": "openai:gpt-3.5-turbo",
                        "name": "GPT-3.5 Turbo",
                        "provider": "openai",
                        "family": "gpt-3.5",
                        "supports_thinking": False,
                        "description": "Fast and efficient GPT-3.5 model",
                    },
                    {
                        "id": "anthropic:claude-3-5-sonnet-20241022",
                        "name": "Claude 3.5 Sonnet",
                        "provider": "anthropic",
                        "family": "claude-3.5",
                        "supports_thinking": True,
                        "description": "Latest Claude model with advanced reasoning",
                    },
                    {
                        "id": "anthropic:claude-3-haiku-20240307",
                        "name": "Claude 3 Haiku",
                        "provider": "anthropic",
                        "family": "claude-3",
                        "supports_thinking": True,
                        "description": "Fast and efficient Claude model",
                    },
                ]
            }

        @self.app.post("/api/model/switch")
        async def switch_model(request: Request):
            """Switch to a different model"""
            try:
                body = await request.json()
                model_id = body.get("model_id")

                logger.info(f"POST /api/model/switch - Switching to model: {model_id}")

                if not model_id:
                    logger.warning("POST /api/model/switch - Missing model_id")
                    raise HTTPException(status_code=400, detail="model_id is required")

                result = self.agent.switch_model(model_id)
                logger.info(
                    f"POST /api/model/switch - Successfully switched to: {model_id}"
                )
                return {"message": result["message"], "current_model": model_id}
            except Exception as e:
                logger.error(f"POST /api/model/switch - Error: {str(e)}")
                raise HTTPException(
                    status_code=400, detail=f"Error switching model: {str(e)}"
                )

        @self.app.get("/", response_class=HTMLResponse)
        async def read_root(request: Request):
            """Serve the chat interface"""
            return HTMLResponse(
                """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>ChatKit</title>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background: #f5f5f5;
                        }
                        .chat-container {
                            max-width: 800px;
                            margin: 0 auto;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                            overflow: hidden;
                        }
                        .chat-header {
                            background: #2563eb;
                            color: white;
                            padding: 20px;
                            text-align: center;
                        }
                        .chat-messages {
                            height: 400px;
                            overflow-y: auto;
                            padding: 20px;
                            border-bottom: 1px solid #e5e5e5;
                        }
                        .message {
                            margin-bottom: 16px;
                            padding: 12px 16px;
                            border-radius: 8px;
                            max-width: 70%;
                        }
                        .user-message {
                            background: #2563eb;
                            color: white;
                            margin-left: auto;
                        }
                        .assistant-message {
                            background: #f3f4f6;
                            color: #374151;
                            margin-right: auto;
                        }
                        .chat-input {
                            display: flex;
                            padding: 20px;
                            gap: 12px;
                        }
                        .chat-input input {
                            flex: 1;
                            padding: 12px 16px;
                            border: 1px solid #d1d5db;
                            border-radius: 8px;
                            font-size: 16px;
                        }
                        .chat-input button {
                            padding: 12px 24px;
                            background: #2563eb;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 16px;
                        }
                        .chat-input button:hover {
                            background: #1d4ed8;
                        }
                        .chat-input button:disabled {
                            background: #9ca3af;
                            cursor: not-allowed;
                        }
                    </style>
                </head>
                <body>
                    <div class="chat-container">
                        <div class="chat-header">
                            <h1>ChatKit</h1>
                            <p>Powered by pydantic-ai</p>
                        </div>
                        <div class="chat-messages" id="messages"></div>
                        <div class="chat-input">
                            <input type="text" id="messageInput" placeholder="Type your message..." />
                            <button onclick="sendMessage()">Send</button>
                        </div>
                    </div>

                    <script>
                        const messagesDiv = document.getElementById('messages');
                        const messageInput = document.getElementById('messageInput');
                        let sessionId = null;

                        function addMessage(content, isUser = false) {
                            const messageDiv = document.createElement('div');
                            messageDiv.className = `message ${isUser ? 'user-message' : 'assistant-message'}`;
                            messageDiv.textContent = content;
                            messagesDiv.appendChild(messageDiv);
                            messagesDiv.scrollTop = messagesDiv.scrollHeight;
                        }

                        async function sendMessage() {
                            const message = messageInput.value.trim();
                            if (!message) return;

                            // Add user message
                            addMessage(message, true);
                            messageInput.value = '';
                            messageInput.disabled = true;

                            try {
                                const response = await fetch('/api/chat', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        message: message,
                                        session_id: sessionId
                                    })
                                });

                                const data = await response.json();

                                if (data.session_id) {
                                    sessionId = data.session_id;
                                }

                                addMessage(data.message);
                            } catch (error) {
                                addMessage('Error: Could not send message');
                                console.error('Error:', error);
                            } finally {
                                messageInput.disabled = false;
                                messageInput.focus();
                            }
                        }

                        messageInput.addEventListener('keypress', (e) => {
                            if (e.key === 'Enter') {
                                sendMessage();
                            }
                        });

                        // Add welcome message
                        addMessage('Hello! How can I help you today?');
                    </script>
                </body>
                </html>
                """
            )

        @self.app.post("/api/session")
        async def create_session():
            """Create a new chat session"""
            session = self.agent.create_session()
            return {
                "session_id": session.session_id,
                "message": "Session created successfully",
            }

        @self.app.get("/api/session/{session_id}")
        async def get_session(session_id: str):
            """Get session details"""
            session = self.agent.get_session(session_id)
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
            return {
                "session_id": session.session_id,
                "messages": [msg.model_dump() for msg in session.messages],
                "metadata": session.metadata,
            }

        @self.app.post("/api/chat", response_model=ChatResponseModel)
        async def send_chat_message(chat_request: ChatRequest):
            """Send a chat message"""
            try:
                # Create session if none provided
                if not chat_request.session_id:
                    session = self.agent.create_session()
                    chat_request.session_id = session.session_id

                # Get response from agent
                response = self.agent.send_message(
                    chat_request.session_id, chat_request.message
                )
                async for chunk in response:
                    if chunk.metadata.get("complete"):
                        return ChatResponseModel(
                            message=chunk.message,
                            session_id=chunk.session_id,
                            tool_calls=chunk.tool_calls,
                            metadata=chunk.metadata,
                        )

                # If we get here, no complete chunk was found
                raise HTTPException(
                    status_code=500, detail="No complete response received"
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error processing message: {str(e)}"
                )

        @self.app.websocket("/ws/{session_id}")
        async def websocket_endpoint(websocket: WebSocket, session_id: str):
            """WebSocket endpoint for real-time chat"""
            await websocket.accept()
            self.websocket_connections[session_id] = websocket

            try:
                while True:
                    data = await websocket.receive_text()
                    message_data = json.loads(data)

                    if message_data.get("type") == "message":
                        message = message_data.get("message")

                        # Send user message back for display
                        await websocket.send_text(
                            json.dumps(
                                {
                                    "type": "user_message",
                                    "message": message,
                                    "session_id": session_id,
                                }
                            )
                        )

                        # Get and stream agent response
                        response = await self.agent.send_message(
                            session_id, message, stream=True
                        )
                        async for chunk in response:
                            await websocket.send_text(
                                json.dumps(
                                    {
                                        "type": "assistant_message",
                                        "message": chunk.message,
                                        "session_id": chunk.session_id,
                                        "metadata": chunk.metadata,
                                    }
                                )
                            )

            except WebSocketDisconnect:
                if session_id in self.websocket_connections:
                    del self.websocket_connections[session_id]

        # Memory management endpoints
        @self.app.get("/api/memory")
        async def get_memory_summary():
            """Get memory summary"""
            try:
                memory_data = chatkit_memory._load_memory()
                return {
                    "user_preferences": len(memory_data.get("user_preferences", {})),
                    "user_facts": len(memory_data.get("user_facts", {})),
                    "notes": len(memory_data.get("notes", [])),
                    "conversation_history": len(
                        memory_data.get("conversation_history", [])
                    ),
                    "created_at": memory_data.get("created_at"),
                    "updated_at": memory_data.get("updated_at"),
                }
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error accessing memory: {str(e)}"
                )

        @self.app.delete("/api/memory")
        async def clear_memory():
            """Clear all memory"""
            try:
                result = chatkit_memory.clear_all_memory()
                return {"message": result}
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error clearing memory: {str(e)}"
                )

        @self.app.post("/api/memory/fact")
        async def add_user_fact(fact_key: str, fact_value: str):
            """Add a user fact to memory"""
            try:
                result = chatkit_memory.add_user_fact(fact_key, fact_value)
                return {"message": result}
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error adding fact: {str(e)}"
                )

        @self.app.post("/api/memory/note")
        async def add_note(title: str, content: str):
            """Add a note to memory"""
            try:
                result = chatkit_memory.add_note(title, content)
                return {"message": result}
            except Exception as e:
                raise HTTPException(
                    status_code=500, detail=f"Error adding note: {str(e)}"
                )

        # Message history storage (thread_id -> messages)
        self.message_history: Dict[str, List[Dict]] = {}
        self.max_history_messages = 10  # Configurable: keep last 10 messages

        # Tracking for custom events
        self.active_tool_calls: Dict[str, List[Dict]] = {}  # thread_id -> tool calls

        async def custom_event_wrapper(original_stream: AsyncIterator, thread_id: str) -> AsyncIterator:
            """Wraps AG-UI stream to inject CUSTOM events for tasks, suggestions, usage"""
            encoder = EventEncoder()
            tool_calls_for_tasks = []
            final_usage = None
            is_bytes_stream = None

            async for chunk in original_stream:
                # Detect stream type on first chunk
                if is_bytes_stream is None:
                    is_bytes_stream = isinstance(chunk, bytes)

                # Forward original chunk
                yield chunk

                # Parse the chunk to track tool calls
                try:
                    # Handle both bytes and str chunks
                    if isinstance(chunk, bytes):
                        chunk_str = chunk.decode('utf-8')
                    else:
                        chunk_str = chunk

                    if chunk_str.startswith('data: '):
                        data = json.loads(chunk_str[6:])

                        # Track tool calls for task generation
                        if data.get('type') == 'TOOL_CALL_START':
                            tool_name = data.get('tool_name', 'unknown')
                            tool_calls_for_tasks.append({
                                'key': tool_name,
                                'value': 'Starting...',
                                'status': 'pending'
                            })
                            # Emit task as CUSTOM event
                            task_event = CustomEvent(
                                name='task_update',
                                value={'tasks': tool_calls_for_tasks}
                            )
                            event_str = encoder.encode(task_event)
                            yield event_str.encode() if is_bytes_stream else event_str

                        elif data.get('type') == 'TOOL_CALL_RESULT':
                            tool_name = data.get('tool_name', 'unknown')
                            # Update task status
                            for task in tool_calls_for_tasks:
                                if task['key'] == tool_name:
                                    task['status'] = 'completed'
                                    task['value'] = 'Completed successfully'
                            # Emit updated tasks
                            task_event = CustomEvent(
                                name='task_update',
                                value={'tasks': tool_calls_for_tasks}
                            )
                            event_str = encoder.encode(task_event)
                            yield event_str.encode() if is_bytes_stream else event_str

                        # Capture token usage from RUN_FINISHED
                        elif data.get('type') == 'RUN_FINISHED' and data.get('usage'):
                            final_usage = data['usage']

                except Exception as e:
                    logger.error(f"Error processing chunk for custom events: {e}")
                    continue

            # After stream completes, emit final custom events
            try:
                # Emit token usage
                if final_usage:
                    usage_event = CustomEvent(
                        name='token_usage',
                        value=final_usage
                    )
                    event_str = encoder.encode(usage_event)
                    yield event_str.encode() if is_bytes_stream else event_str

                # Emit contextual suggestions
                suggestions = [
                    "Can you explain this in more detail?",
                    "Show me a practical example",
                    "What are the alternatives?",
                    "How does this compare to other approaches?",
                    "What are the best practices for this?"
                ]

                suggestions_event = CustomEvent(
                    name='suggestions',
                    value=suggestions
                )
                event_str = encoder.encode(suggestions_event)
                yield event_str.encode() if is_bytes_stream else event_str

            except Exception as e:
                logger.error(f"Error emitting final custom events: {e}")

        # AG-UI protocol endpoint with history and custom events
        @self.app.post("/agui")
        async def agui_endpoint(request: Request):
            """AG-UI protocol endpoint with message history and custom events"""
            try:
                # Parse incoming request
                body = await request.json()
                thread_id = body.get("threadId", "default")
                incoming_messages = body.get("messages", [])

                logger.info(f"AG-UI: Request for thread {thread_id} with {len(incoming_messages)} messages")

                # Get or initialize message history for this thread
                if thread_id not in self.message_history:
                    self.message_history[thread_id] = []

                # Add incoming messages to history (only user messages)
                for msg in incoming_messages:
                    if msg.get("role") == "user":
                        self.message_history[thread_id].append({
                            "role": "user",
                            "content": msg.get("content", ""),
                            "id": msg.get("id")
                        })

                # Keep only last N messages
                self.message_history[thread_id] = self.message_history[thread_id][-self.max_history_messages:]

                # Build complete message context (minimum 4 messages as requested)
                context_messages = self.message_history[thread_id][-4:]  # Last 4 minimum

                logger.info(f"AG-UI: Using {len(context_messages)} messages from history")

                # Update body with context
                body["messages"] = context_messages + [msg for msg in incoming_messages if msg.get("role") == "user" and msg not in context_messages]

                # Create new request with modified body
                modified_body_bytes = json.dumps(body).encode('utf-8')

                # Create a new Request object with the modified body
                scope = request.scope.copy()
                scope["body"] = modified_body_bytes

                # Create receive coroutine that returns the modified body
                async def receive():
                    return {
                        "type": "http.request",
                        "body": modified_body_bytes,
                        "more_body": False,
                    }

                modified_request = Request(scope, receive)

                # Get standard AG-UI response with modified request
                response = await handle_ag_ui_request(self.agent.agent, modified_request)

                # Wrap the streaming response with custom events
                if isinstance(response, StreamingResponse):
                    wrapped_stream = custom_event_wrapper(response.body_iterator, thread_id)
                    return StreamingResponse(
                        wrapped_stream,
                        media_type="text/event-stream",
                        headers=response.headers
                    )

                return response

            except Exception as e:
                logger.error(f"AG-UI: Error in endpoint - {str(e)}", exc_info=True)
                raise HTTPException(status_code=500, detail=str(e))

    def run(self, host: str = "0.0.0.0", port: int = 8000, debug: bool = False):
        """Run the FastAPI server"""
        import uvicorn

        uvicorn.run(self.app, host=host, port=port, debug=debug)


def main():
    """Main entry point for ChatKit server"""
    server = ChatKitServer()
    print("Starting ChatKit server on http://0.0.0.0:8000")
    server.run()


if __name__ == "__main__":
    main()

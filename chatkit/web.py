"""FastAPI web interface for ChatKit with AG-UI support"""

from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi import Request
from pydantic import BaseModel
import json

from .core import ChatKitAgent
from .memory import chatkit_memory
from pydantic_ai.ag_ui import handle_ag_ui_request


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
                    "POST /api/session": "Create new chat session",
                    "GET /api/session/{session_id}": "Get session details",
                    "POST /api/chat": "Send chat message",
                    "GET /ws/{session_id}": "WebSocket for real-time chat",
                    "GET /api/memory": "Get memory summary",
                    "DELETE /api/memory": "Clear all memory",
                    "POST /api/memory/fact": "Add user fact",
                    "POST /api/memory/note": "Add note",
                    "POST /agui": "AG-UI protocol endpoint"
                }
            }

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
                "message": "Session created successfully"
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
                "metadata": session.metadata
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
                response = self.agent.send_message(chat_request.session_id, chat_request.message)
                async for chunk in response:
                    if chunk.metadata.get("complete"):
                        return ChatResponseModel(
                            message=chunk.message,
                            session_id=chunk.session_id,
                            tool_calls=chunk.tool_calls,
                            metadata=chunk.metadata
                        )

                # If we get here, no complete chunk was found
                raise HTTPException(status_code=500, detail="No complete response received")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

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
                        await websocket.send_text(json.dumps({
                            "type": "user_message",
                            "message": message,
                            "session_id": session_id
                        }))

                        # Get and stream agent response
                        response = await self.agent.send_message(session_id, message, stream=True)
                        async for chunk in response:
                            await websocket.send_text(json.dumps({
                                "type": "assistant_message",
                                "message": chunk.message,
                                "session_id": chunk.session_id,
                                "metadata": chunk.metadata
                            }))

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
                    "conversation_history": len(memory_data.get("conversation_history", [])),
                    "created_at": memory_data.get("created_at"),
                    "updated_at": memory_data.get("updated_at")
                }
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error accessing memory: {str(e)}")

        @self.app.delete("/api/memory")
        async def clear_memory():
            """Clear all memory"""
            try:
                result = chatkit_memory.clear_all_memory()
                return {"message": result}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error clearing memory: {str(e)}")

        @self.app.post("/api/memory/fact")
        async def add_user_fact(fact_key: str, fact_value: str):
            """Add a user fact to memory"""
            try:
                result = chatkit_memory.add_user_fact(fact_key, fact_value)
                return {"message": result}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error adding fact: {str(e)}")

        @self.app.post("/api/memory/note")
        async def add_note(title: str, content: str):
            """Add a note to memory"""
            try:
                result = chatkit_memory.add_note(title, content)
                return {"message": result}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")

        # AG-UI protocol endpoint
        @self.app.post("/agui")
        async def agui_endpoint(request: Request):
            """AG-UI protocol endpoint for streaming AI interactions"""
            return await handle_ag_ui_request(self.agent.agent, request)

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
"""Tool support and file attachments for ChatKit"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from pydantic_ai import Agent, FunctionToolset
from pydantic_ai.exceptions import ModelRetry, AgentRunError, ModelHTTPError, UnexpectedModelBehavior
import datetime
from pathlib import Path
import os
from dotenv import load_dotenv

# Memory Toolset imports
from .memory import chatkit_memory

# Load environment variables
load_dotenv()


class FileAttachment(BaseModel):
    """Represents a file attachment"""
    filename: str = Field(description="File name")
    content_type: str = Field(description="MIME type")
    size: int = Field(description="File size in bytes")
    content: Optional[bytes] = Field(default=None, description="File content")
    url: Optional[str] = Field(default=None, description="File URL if stored externally")


class ToolCall(BaseModel):
    """Represents a tool call"""
    name: str = Field(description="Tool name")
    arguments: Dict[str, Any] = Field(description="Tool arguments")
    result: Optional[Any] = Field(default=None, description="Tool execution result")


class ToolKit:
    """Collection of tools for agents"""

    def __init__(self):
        self.tools: Dict[str, callable] = {}
        self._register_builtin_tools()

    def _register_builtin_tools(self):
        """Register built-in tools"""
        self.register_tool("get_current_time", self.get_current_time)
        self.register_tool("calculate", self.calculate)
        self.register_tool("search_web", self.search_web)
        self.register_tool("save_note", self.save_note)
        self.register_tool("read_file", self.read_file)
        self.register_tool("list_files", self.list_files)

    def register_tool(self, name: str, function: callable):
        """Register a new tool"""
        self.tools[name] = function

    async def execute_tool(self, tool_call: ToolCall) -> Any:
        """Execute a tool call"""
        tool = self.tools.get(tool_call.name)
        if not tool:
            raise ValueError(f"Tool {tool_call.name} not found")

        try:
            if tool_call.arguments:
                result = tool(**tool_call.arguments)
            else:
                result = tool()

            # Handle async functions
            if hasattr(result, '__await__'):
                result = await result

            return result
        except Exception as e:
            return f"Error executing tool {tool_call.name}: {str(e)}"

    # Built-in tools
    def get_current_time(self) -> str:
        """Get the current date and time"""
        return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def calculate(self, expression: str) -> str:
        """Evaluate a mathematical expression"""
        try:
            # Basic safe evaluation
            allowed_chars = set("0123456789+-*/(). ")
            if not all(c in allowed_chars for c in expression):
                return "Error: Only basic math operations allowed"

            result = eval(expression)
            return f"{expression} = {result}"
        except Exception as e:
            return f"Error calculating expression: {str(e)}"

    def search_web(self, query: str) -> str:
        """Simulate web search (placeholder)"""
        return f"Search results for '{query}': [Simulated search results]"

    def save_note(self, title: str, content: str) -> str:
        """Save a note to a file"""
        try:
            notes_dir = Path("notes")
            notes_dir.mkdir(exist_ok=True)

            filename = f"{title.replace(' ', '_')}.txt"
            filepath = notes_dir / filename

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(f"Title: {title}\n")
                f.write(f"Date: {datetime.datetime.now()}\n")
                f.write(f"Content: {content}\n")

            return f"Note '{title}' saved successfully"
        except Exception as e:
            return f"Error saving note: {str(e)}"

    def read_file(self, filename: str) -> str:
        """Read content from a file"""
        try:
            filepath = Path(filename)
            if not filepath.exists():
                return f"File {filename} not found"

            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            return f"Content of {filename}:\n{content}"
        except Exception as e:
            return f"Error reading file: {str(e)}"

    def list_files(self, directory: str = ".") -> str:
        """List files in a directory"""
        try:
            dir_path = Path(directory)
            if not dir_path.exists():
                return f"Directory {directory} not found"

            files = []
            for item in dir_path.iterdir():
                if item.is_file():
                    files.append(f"📄 {item.name} ({item.stat().st_size} bytes)")
                elif item.is_dir():
                    files.append(f"📁 {item.name}/")

            if not files:
                return f"No files found in {directory}"

            return "\n".join(files)
        except Exception as e:
            return f"Error listing files: {str(e)}"


class FileManager:
    """Manages file attachments"""

    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)

    async def save_uploaded_file(self, filename: str, content: bytes) -> FileAttachment:
        """Save an uploaded file"""
        filepath = self.upload_dir / filename

        with open(filepath, "wb") as f:
            f.write(content)

        return FileAttachment(
            filename=filename,
            content_type=self._guess_content_type(filename),
            size=len(content),
            url=f"/uploads/{filename}"
        )

    def get_file_content(self, filename: str) -> Optional[bytes]:
        """Get file content"""
        filepath = self.upload_dir / filename
        if filepath.exists():
            with open(filepath, "rb") as f:
                return f.read()
        return None

    def list_uploaded_files(self) -> List[FileAttachment]:
        """List all uploaded files"""
        files = []
        for filepath in self.upload_dir.iterdir():
            if filepath.is_file():
                files.append(FileAttachment(
                    filename=filepath.name,
                    content_type=self._guess_content_type(filepath.name),
                    size=filepath.stat().st_size,
                    url=f"/uploads/{filepath.name}"
                ))
        return files

    def _guess_content_type(self, filename: str) -> str:
        """Guess MIME type from filename"""
        ext = Path(filename).suffix.lower()
        content_types = {
            '.txt': 'text/plain',
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.mp3': 'audio/mpeg',
            '.mp4': 'video/mp4',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
        return content_types.get(ext, 'application/octet-stream')


class ToolEnabledAgent:
    """Agent with tool support"""

    def __init__(self, model: str = None):
        # Use environment variable or default model
        self.model = model or os.getenv("OPENAI_MODEL", "openai:gpt-4o-mini")
        self.toolkit = ToolKit()
        self.file_manager = FileManager()

        # Check if API key is available
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OPENAI_API_KEY environment variable is not set. "
                "Please set it in your .env file or environment."
            )

        # Create agent with tool support
        self.agent = Agent(
            model=self.model,
            system_prompt="""You are a helpful assistant with access to various tools.
            Use tools when appropriate to provide better assistance.
            Always explain what you're doing when using tools.""",
        )

    def register_tool(self, name: str, function: callable, description: str = ""):
        """Register a custom tool"""
        self.toolkit.register_tool(name, function)

    async def process_message(
        self,
        message: str,
        attachments: Optional[List[FileAttachment]] = None
    ) -> Dict[str, Any]:
        """Process a message with optional attachments"""

        # Handle file attachments
        if attachments:
            attachment_info = "\n\nAttached files:\n"
            for attachment in attachments:
                attachment_info += f"- {attachment.filename} ({attachment.content_type}, {attachment.size} bytes)\n"
            message += attachment_info

        # Process message with agent with retry logic
        max_retries = 3

        for attempt in range(max_retries):
            try:
                result = await self.agent.run(message)

                # Check if tool calls are needed
                # Note: In a real implementation, this would integrate with pydantic-ai's tool system
                # For now, we'll use a simple approach

                response_data = {
                    "message": result.output,
                    "tool_calls": [],
                    "attachments": attachments or []
                }

                return response_data

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

    async def execute_tool_call(self, tool_call: ToolCall) -> Any:
        """Execute a specific tool call"""
        return await self.toolkit.execute_tool(tool_call)


# Example usage
async def main():
    """Example usage of tools and file management"""
    agent = ToolEnabledAgent()

    # Test basic tool usage
    tool_call = ToolCall(
        name="get_current_time",
        arguments={}
    )

    result = await agent.execute_tool_call(tool_call)
    print(f"Current time: {result}")

    # Test file management
    file_manager = FileManager()
    files = file_manager.list_uploaded_files()
    print(f"Uploaded files: {len(files)}")


# Memory Toolset using pydantic-ai FunctionToolset

# Create memory toolset
memory_toolset = FunctionToolset()


@memory_toolset.tool
def store_personal_info(user_message: str) -> str:
    """Automatically detect and store personal information from user messages"""
    import re

    # Look for name patterns like "I'm [name]" or "my name is [name]"
    name_patterns = [
        r"I'?m\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)",
        r"my name is\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)",
        r"call me\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)",
    ]

    stored_info = []

    for pattern in name_patterns:
        match = re.search(pattern, user_message, re.IGNORECASE)
        if match:
            name = match.group(1).strip()
            chatkit_memory.add_user_fact("user_name", name)
            stored_info.append(f"Stored name: {name}")
            break

    if stored_info:
        return f"Successfully stored: {', '.join(stored_info)}"
    else:
        return "No personal information detected to store"


@memory_toolset.tool
def view_memory(path: Optional[str] = None) -> str:
    """View memory content and summary"""
    if path:
        from anthropic.types.beta import BetaMemoryTool20250818ViewCommand
        command = BetaMemoryTool20250818ViewCommand(command="view", path=path)
        return chatkit_memory.view(command)
    else:
        # Return detailed memory content, not just summary
        memory = chatkit_memory._load_memory()

        if not memory.get("user_facts"):
            return "Memory is currently empty"

        # Return specific user facts if available
        user_facts = memory.get("user_facts", {})
        if user_facts:
            facts_list = []
            for key, value in user_facts.items():
                facts_list.append(f"{key}: {value}")

            return "User facts:\n" + "\n".join(facts_list)
        else:
            return "No user facts stored in memory"


@memory_toolset.tool
def add_fact(fact_key: str, fact_value: str) -> str:
    """Add a user fact to memory"""
    return chatkit_memory.add_user_fact(fact_key, fact_value)


@memory_toolset.tool
def add_note(title: str, content: str) -> str:
    """Add a note to memory"""
    return chatkit_memory.add_note(title, content)


@memory_toolset.tool
def clear_memory() -> str:
    """Clear all memory"""
    return chatkit_memory.clear_all_memory()


# Additional utility tools
@memory_toolset.tool
def get_current_date() -> str:
    """Get the current date"""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d")


@memory_toolset.tool
def get_current_time() -> str:
    """Get the current time"""
    from datetime import datetime
    return datetime.now().strftime("%H:%M:%S")


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
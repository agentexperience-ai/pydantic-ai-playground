"""Simple MCP server for memory functionality using FastMCP"""

import os
from mcp.server.fastmcp import FastMCP
from chatkit.memory import chatkit_memory

# Create FastMCP server
mcp = FastMCP("ChatKit Memory")


@mcp.tool()
def view_memory(path: str = None) -> str:
    """View memory content and summary"""
    if path:
        from anthropic.types.beta import BetaMemoryTool20250818ViewCommand
        command = BetaMemoryTool20250818ViewCommand(path=path)
        return chatkit_memory.view(command)
    else:
        return chatkit_memory.view()


@mcp.tool()
def add_fact(fact_key: str, fact_value: str) -> str:
    """Add a user fact to memory"""
    return chatkit_memory.add_user_fact(fact_key, fact_value)


@mcp.tool()
def add_note(title: str, content: str) -> str:
    """Add a note to memory"""
    return chatkit_memory.add_note(title, content)


@mcp.tool()
def clear_memory() -> str:
    """Clear all memory"""
    return chatkit_memory.clear_all_memory()


@mcp.tool()
def store_personal_info(user_message: str) -> str:
    """Automatically detect and store personal information from user messages"""
    # Simple pattern matching for common personal information
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


if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.getenv("MCP_SERVER_PORT", 8001))

    # Run FastMCP server with stdio transport (no port conflicts)
    print(f"Starting MCP Memory Server with stdio transport")
    mcp.run(transport="stdio")
#!/usr/bin/env python3
"""Test script to verify MCP server tools are available"""

import asyncio
from chatkit.core import ChatKitAgent

async def test_mcp_tools():
    """Test that MCP server tools are available and can be used"""
    print("=== Testing MCP Server Tools ===")

    # Create agent
    agent = ChatKitAgent()

    # Test 1: Check if tools are available
    print("\n1. Checking available tools...")
    session = agent.create_session("test-mcp-tools")
    print(f"Session created: {session.session_id}")

    # Test 2: Try to explicitly trigger tool usage
    print("\n2. Testing explicit tool usage...")
    print("Sending: 'Please use the store_personal_info tool on this message: Hello, I'm user_name'")

    response_stream = agent.send_message(session.session_id, "Please use the store_personal_info tool on this message: Hello, I'm user_name", stream=False)

    async for chunk in response_stream:
        print(f"Response: {chunk.message}")
        print(f"Tool calls: {chunk.tool_calls}")
        print(f"Metadata: {chunk.metadata}")

    # Test 3: Check memory content
    print("\n3. Checking memory content...")
    print("Sending: 'Please use the view_memory tool to show me what's stored'")

    response_stream = agent.send_message(session.session_id, "Please use the view_memory tool to show me what's stored", stream=False)

    async for chunk in response_stream:
        print(f"Response: {chunk.message}")
        print(f"Tool calls: {chunk.tool_calls}")
        print(f"Metadata: {chunk.metadata}")

if __name__ == "__main__":
    asyncio.run(test_mcp_tools())
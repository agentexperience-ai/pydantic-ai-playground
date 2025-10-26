#!/usr/bin/env python3
"""Test script to verify XML configuration and memory functionality with Anthropic model"""

import asyncio
from chatkit.core import ChatKitAgent

async def test_anthropic_memory():
    """Test that the XML configuration works and memory tools are used with Anthropic model"""
    print("=== Testing XML Configuration with Anthropic Model ===")

    # Create agent with Anthropic model (uses built-in MemoryTool)
    agent = ChatKitAgent(model="anthropic:claude-3-5-sonnet-20241022")

    # Test 1: Create session and check system prompt
    print("\n1. Creating session...")
    session = agent.create_session("test-anthropic-memory")
    print(f"Session created: {session.session_id}")

    # Test 2: Send message that should trigger memory storage
    print("\n2. Testing automatic name storage...")
    print("Sending: 'Hello, my name is user_name'")

    response_stream = agent.send_message(session.session_id, "Hello, my name is user_name", stream=False)

    async for chunk in response_stream:
        print(f"Response: {chunk.message}")
        print(f"Tool calls: {chunk.tool_calls}")
        print(f"Metadata: {chunk.metadata}")

    # Test 3: Ask about stored information
    print("\n3. Testing memory retrieval...")
    print("Sending: 'What's my name?'")

    response_stream = agent.send_message(session.session_id, "What's my name?", stream=False)

    async for chunk in response_stream:
        print(f"Response: {chunk.message}")
        print(f"Tool calls: {chunk.tool_calls}")
        print(f"Metadata: {chunk.metadata}")

if __name__ == "__main__":
    asyncio.run(test_anthropic_memory())
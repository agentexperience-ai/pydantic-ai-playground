#!/usr/bin/env python3
"""Test script to verify XML configuration and memory functionality"""

import asyncio
from chatkit.core import ChatKitAgent

async def test_xml_config_and_memory():
    """Test that the XML configuration works and memory tools are used"""
    print("=== Testing XML Configuration and Memory Functionality ===")

    # Create agent with XML configuration
    agent = ChatKitAgent()

    # Test 1: Create session and check system prompt
    print("\n1. Creating session and checking system prompt...")
    session = agent.create_session("test-xml-config")
    print(f"Session created: {session.session_id}")

    # Test 2: Send message that should trigger memory storage
    print("\n2. Testing automatic name storage...")
    print("Sending: 'Hello, I'm user_name'")

    response_stream = agent.send_message(session.session_id, "Hello, I'm user_name", stream=False)

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
    asyncio.run(test_xml_config_and_memory())
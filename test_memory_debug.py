#!/usr/bin/env python3
"""Debug memory storage and retrieval"""

import asyncio
from chatkit.core import ChatKitAgent

async def test_memory_debug():
    """Debug memory functionality"""
    print("=== MEMORY DEBUG TEST ===\n")

    # Create agent
    agent = ChatKitAgent()
    session = agent.create_session("debug-test")
    print(f"Session created: {session.session_id}")

    # Test 1: Store name
    print("\n1. Storing name...")
    print("   User: 'My name is Michelangelo'")
    response_stream = agent.send_message(session.session_id, "My name is Michelangelo", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")

    # Test 2: Check memory immediately
    print("\n2. Checking memory immediately...")
    print("   User: 'What's my name?'")
    response_stream = agent.send_message(session.session_id, "What's my name?", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")

    # Test 3: Use explicit tool call
    print("\n3. Using explicit tool call...")
    print("   User: 'Please use view_memory tool'")
    response_stream = agent.send_message(session.session_id, "Please use view_memory tool", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")

    # Test 4: Store another name
    print("\n4. Storing another name...")
    print("   User: 'Actually, call me Mike'")
    response_stream = agent.send_message(session.session_id, "Actually, call me Mike", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")

    # Test 5: Check memory again
    print("\n5. Checking memory again...")
    print("   User: 'What name do you have stored?'")
    response_stream = agent.send_message(session.session_id, "What name do you have stored?", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")

if __name__ == "__main__":
    asyncio.run(test_memory_debug())
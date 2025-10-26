#!/usr/bin/env python3
"""Debug tool usage and memory retrieval"""

import asyncio
from chatkit.core import ChatKitAgent

async def test_debug_tools():
    """Debug tool usage in detail"""
    print("=== DEBUG TOOL USAGE ===\n")

    # Create agent
    agent = ChatKitAgent()
    session = agent.create_session("debug-tools")
    print(f"Session created: {session.session_id}")

    # Test 1: Store name and check if tool was used
    print("\n1. Storing name...")
    print("   User: 'My name is Michelangelo'")
    response_stream = agent.send_message(session.session_id, "My name is Michelangelo", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")
        if "Michelangelo" in chunk.message:
            print("   ✅ Tool detected and stored name")
        else:
            print("   ❌ Tool may not have been used")

    # Test 2: Direct tool call
    print("\n2. Direct tool call...")
    print("   User: 'Please use view_memory tool to see what you have stored'")
    response_stream = agent.send_message(session.session_id, "Please use view_memory tool to see what you have stored", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")
        if "user_name" in chunk.message or "Michelangelo" in chunk.message:
            print("   ✅ Tool retrieved stored information")
        else:
            print("   ❌ Tool may not have retrieved information")

    # Test 3: Explicit memory query
    print("\n3. Explicit memory query...")
    print("   User: 'Use view_memory to check user_name'")
    response_stream = agent.send_message(session.session_id, "Use view_memory to check user_name", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")
        if "Michelangelo" in chunk.message:
            print("   ✅ Tool retrieved specific user name")
        else:
            print("   ❌ Tool did not retrieve user name")

    # Test 4: Natural language query
    print("\n4. Natural language query...")
    print("   User: 'What is my name according to your memory?'")
    response_stream = agent.send_message(session.session_id, "What is my name according to your memory?", stream=False)

    async for chunk in response_stream:
        print(f"   Assistant: {chunk.message}")
        if "Michelangelo" in chunk.message:
            print("   ✅ Agent retrieved name from memory")
        else:
            print("   ❌ Agent did not retrieve name from memory")

    print("\n=== DEBUG SUMMARY ===")
    print("If tools are working but not being used automatically, the issue may be:")
    print("1. System prompt not enforcing tool usage strongly enough")
    print("2. Tool descriptions not clear enough for the model")
    print("3. Model not recognizing when to use tools")

if __name__ == "__main__":
    asyncio.run(test_debug_tools())
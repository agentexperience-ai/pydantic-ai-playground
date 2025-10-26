#!/usr/bin/env python3
"""Test memory functionality directly"""

import asyncio
from chatkit.memory import chatkit_memory
from chatkit.core import ChatKitAgent

async def test_memory_functionality():
    """Test memory storage and retrieval"""

    print("🧪 Testing Memory Functionality")
    print("=" * 50)

    # Test 1: Add user facts
    print("\n1. Adding user facts...")
    result1 = chatkit_memory.add_user_fact("favorite_color", "blue")
    print(f"   Result: {result1}")

    result2 = chatkit_memory.add_user_fact("preferred_language", "python")
    print(f"   Result: {result2}")

    # Test 2: Add notes
    print("\n2. Adding notes...")
    result3 = chatkit_memory.add_note("Project Ideas", "Build a chatbot with memory")
    print(f"   Result: {result3}")

    # Test 3: View memory
    print("\n3. Viewing memory summary...")
    memory_summary = chatkit_memory.view()
    print(f"   Memory Summary:\n{memory_summary}")

    # Test 4: Test with ChatKit agent
    print("\n4. Testing with ChatKit agent...")
    try:
        agent = ChatKitAgent()
        print(f"   Agent created with model: {agent.model}")
        print(f"   Memory tool available: {hasattr(agent, 'memory')}")

        # Create a session
        session = agent.create_session("test-session")
        print(f"   Session created: {session.session_id}")

        print("✅ Memory functionality test completed successfully!")

    except Exception as e:
        print(f"❌ Error testing agent: {e}")

if __name__ == "__main__":
    asyncio.run(test_memory_functionality())
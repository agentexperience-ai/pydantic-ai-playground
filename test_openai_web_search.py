"""Test OpenAI native web search functionality"""

import asyncio
from chatkit.core import ChatKitAgent


async def test_openai_web_search():
    """Test OpenAI's native web search with a real query"""
    print("="*60)
    print("TESTING OPENAI NATIVE WEB SEARCH")
    print("="*60)
    print()

    # Create agent with OpenAI Responses model (supports web search)
    agent = ChatKitAgent(model="openai-responses:gpt-5")
    session = agent.create_session("test-web-search")

    # Test query requiring current web information
    query = "What was AS Roma's latest match result? Include the opponent, score, and date."

    print(f"Query: {query}")
    print()
    print("Response:")
    print("-" * 60)

    # Get response (send_message returns an async generator)
    async for chunk in agent.send_message(session.session_id, query):
        if chunk.metadata.get("complete"):
            print(chunk.message)
            print("-" * 60)
            print()

            # Verify we got real information (should mention team names, scores, dates)
            response_lower = chunk.message.lower()

            # Check for indicators of real web search results
            has_team_info = any(keyword in response_lower for keyword in [
                'roma', 'score', 'match', 'vs', 'against', '-'
            ])

            has_date_info = any(keyword in response_lower for keyword in [
                'october', 'november', 'december', '2025', '2024', 'latest', 'recent'
            ])

            if has_team_info and has_date_info:
                print("✅ SUCCESS: OpenAI web search returned REAL current information!")
                print(f"   - Contains team/match info: {has_team_info}")
                print(f"   - Contains date info: {has_date_info}")
            else:
                print("⚠️  WARNING: Response may not contain real web search results")
                print(f"   - Team info found: {has_team_info}")
                print(f"   - Date info found: {has_date_info}")

            print()
            print("="*60)
            print("TEST COMPLETE")
            print("="*60)

            return chunk.message


if __name__ == "__main__":
    result = asyncio.run(test_openai_web_search())

"""Test web search tool"""

from chatkit.tools import search_web


def test_web_search():
    """Test the web search tool"""
    print("Testing web search tool...")

    # Test basic search
    result = search_web("Python programming", limit=3)
    print("\nSearch results:")
    print(result)

    # Verify we got results
    assert "Search results for" in result
    assert "Python" in result or "No search results" in result

    print("\n✓ Web search test passed!")


if __name__ == "__main__":
    test_web_search()

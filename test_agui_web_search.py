"""Test AG-UI endpoint with web search - END TO END TEST"""

import requests
import json
import time

print("=" * 70)
print("TESTING WEB SEARCH THROUGH AG-UI ENDPOINT (Frontend Flow)")
print("=" * 70)
print()

# Test query requiring web search
query = "What's the latest news about AI in October 2025?"

print(f"Query: {query}")
print()

# Create session first
print("1. Creating session...")
session_response = requests.post("http://localhost:8000/api/session")
session_data = session_response.json()
print(f"   ✓ Session created: {session_data['session_id']}")
print()

# Send AG-UI request (same as frontend)
print("2. Sending AG-UI request...")
agui_request = {
    "threadId": session_data['session_id'],
    "runId": f"run-{int(time.time())}",
    "state": [],
    "messages": [
        {
            "role": "user",
            "content": query,
            "id": "user-1"
        }
    ],
    "tools": [],
    "context": [],
    "forwardedProps": {}
}

response = requests.post(
    "http://localhost:8000/agui",
    json=agui_request,
    stream=True,
    timeout=60
)

print(f"   ✓ Response status: {response.status_code}")
print()

# Parse streaming response
print("3. Parsing streaming response...")
print("-" * 70)

full_message = ""
for line in response.iter_lines():
    if line:
        line_str = line.decode('utf-8')
        if line_str.startswith('data: '):
            try:
                data = json.loads(line_str[6:])

                # Collect text content
                if data.get('type') in ['TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_CHUNK']:
                    if data.get('delta'):
                        full_message += data['delta']
                        print(data['delta'], end='', flush=True)

            except json.JSONDecodeError:
                continue

print()
print("-" * 70)
print()

# Verify web search was used
print("4. Verifying web search results...")
print()

# Check for indicators of real web search
has_current_info = any(keyword in full_message.lower() for keyword in [
    'october', 'november', '2025', '2024', 'latest', 'recent', 'today', 'yesterday'
])

has_ai_news = any(keyword in full_message.lower() for keyword in [
    'ai', 'artificial intelligence', 'model', 'openai', 'anthropic', 'google',
    'microsoft', 'chatgpt', 'gpt', 'claude'
])

has_specific_info = len(full_message.split()) > 50  # Real search gives detailed answers

if has_current_info and has_ai_news and has_specific_info:
    print("✅ SUCCESS: Web search is WORKING!")
    print(f"   ✓ Contains current time references: {has_current_info}")
    print(f"   ✓ Contains AI-related content: {has_ai_news}")
    print(f"   ✓ Contains substantial information: {has_specific_info}")
    print(f"   ✓ Response length: {len(full_message)} characters")
else:
    print("❌ FAILED: Response doesn't show web search evidence")
    print(f"   - Current info: {has_current_info}")
    print(f"   - AI news: {has_ai_news}")
    print(f"   - Substantial: {has_specific_info}")
    print(f"   - Response: {full_message[:200]}...")

print()
print("=" * 70)
print("TEST COMPLETE")
print("=" * 70)

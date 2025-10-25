"""Main entry point for ChatKit CLI and web server"""

import asyncio
import argparse
import sys
from pathlib import Path

from chatkit.web import ChatKitServer
import uvicorn

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))


async def start_server(host: str = "127.0.0.1", port: int = 8000):
    """Start the ChatKit web server"""
    server = ChatKitServer()

    print(f"🚀 Starting ChatKit server on http://{host}:{port}")
    print(f"📱 Web interface: http://{host}:{port}")
    print(f"🔌 API endpoints: http://{host}:{port}/api")
    print("Press Ctrl+C to stop the server")

    config = uvicorn.Config(
        server.app,
        host=host,
        port=port,
        log_level="info"
    )
    server_instance = uvicorn.Server(config)
    await server_instance.serve()


def main():
    """Main entry point for the chatkit command"""
    parser = argparse.ArgumentParser(description="ChatKit - Multi-agent chat interface")
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind the server to (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind the server to (default: 8000)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run tests instead of starting the server"
    )

    args = parser.parse_args()

    if args.test:
        # Run tests
        from test_chatkit import run_all_tests
        success = asyncio.run(run_all_tests())
        sys.exit(0 if success else 1)
    else:
        # Start server
        try:
            asyncio.run(start_server(args.host, args.port))
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
        except Exception as e:
            print(f"❌ Error starting server: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
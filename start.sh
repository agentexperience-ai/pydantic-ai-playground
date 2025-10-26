#!/bin/bash

# ChatKit Server Startup Script
# This script starts the ChatKit server, MCP memory server, and frontend

CHATKIT_PORT=8000
MCP_PORT=8001
FRONTEND_PORT=3000
HOST="127.0.0.1"

# Function to kill processes using the port
kill_port_processes() {
    local port=$1
    echo "🔍 Checking for processes using port $port..."

    # Find PIDs using the port
    PIDS=$(lsof -ti:$port 2>/dev/null)

    if [ -n "$PIDS" ]; then
        echo "⚠️  Found processes using port $port: $PIDS"
        echo "🛑 Killing processes..."

        # Kill processes more aggressively
        for pid in $PIDS; do
            echo "   Killing process $pid..."
            kill -9 "$pid" 2>/dev/null
        done

        # Wait longer for processes to terminate
        sleep 3

        # Verify processes are killed
        REMAINING_PIDS=$(lsof -ti:$port 2>/dev/null)
        if [ -n "$REMAINING_PIDS" ]; then
            echo "❌ Failed to kill processes: $REMAINING_PIDS"
            echo "💡 Trying alternative method..."

            # Try alternative method
            sudo kill -9 $REMAINING_PIDS 2>/dev/null
            sleep 2

            # Final check
            FINAL_PIDS=$(lsof -ti:$port 2>/dev/null)
            if [ -n "$FINAL_PIDS" ]; then
                echo "❌ Still failed to kill processes: $FINAL_PIDS"
                echo "💡 Please kill manually: sudo lsof -ti:$port | xargs sudo kill -9"
                exit 1
            else
                echo "✅ Successfully cleared port $port (with sudo)"
            fi
        else
            echo "✅ Successfully cleared port $port"
        fi
    else
        echo "✅ Port $port is available"
    fi
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "❌ Port $port is already in use"
        return 1
    else
        echo "✅ Port $port is available"
        return 0
    fi
}

# Main script
clear
echo "🚀 ChatKit Server Startup"
echo "=========================="

# Kill any existing processes using the ports
echo ""
echo "🛑 Clearing ports..."
kill_port_processes $CHATKIT_PORT
kill_port_processes $MCP_PORT
kill_port_processes $FRONTEND_PORT

# Kill any Next.js development processes
echo ""
echo "🛑 Killing Next.js development processes..."
pkill -f "next dev" 2>/dev/null || true

# Remove Next.js lock file
echo ""
echo "🛑 Removing Next.js lock files..."
rm -rf frontend/.next/dev/lock 2>/dev/null || true

# Check if ports are available
echo ""
echo "🔍 Checking ports..."
if ! check_port $CHATKIT_PORT; then
    echo "💡 Port $CHATKIT_PORT is still in use. Please check manually:"
    echo "   lsof -i :$CHATKIT_PORT"
    exit 1
fi

if ! check_port $MCP_PORT; then
    echo "💡 Port $MCP_PORT is still in use. Please check manually:"
    echo "   lsof -i :$MCP_PORT"
    exit 1
fi

if ! check_port $FRONTEND_PORT; then
    echo "💡 Port $FRONTEND_PORT is still in use. Please check manually:"
    echo "   lsof -i :$FRONTEND_PORT"
    exit 1
fi

echo ""
echo "🎯 Starting servers..."
echo "   ChatKit Server: http://$HOST:$CHATKIT_PORT"
echo "   MCP Memory Server: http://$HOST:$MCP_PORT"
echo "   Frontend: http://$HOST:$FRONTEND_PORT"
echo ""

# Start the main ChatKit server in background
echo "🚀 Starting ChatKit server..."
uv run chatkit --host "$HOST" --port "$CHATKIT_PORT" &
CHATKIT_PID=$!

# Wait a moment for the backend to start
sleep 3

# Start the frontend
echo ""
echo "🚀 Starting frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for processes
echo ""
echo "✅ All servers started!"
echo "   Backend PID: $CHATKIT_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📝 To stop all servers, run: kill $CHATKIT_PID $FRONTEND_PID"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping servers...'; kill $CHATKIT_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
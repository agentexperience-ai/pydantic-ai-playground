#!/bin/bash

# ChatKit Server Startup Script
# This script starts the ChatKit server and handles port conflicts

PORT=8000
HOST="127.0.0.1"

# Function to kill processes using the port
kill_port_processes() {
    echo "🔍 Checking for processes using port $PORT..."

    # Find PIDs using the port
    PIDS=$(lsof -ti:$PORT 2>/dev/null)

    if [ -n "$PIDS" ]; then
        echo "⚠️  Found processes using port $PORT: $PIDS"
        echo "🛑 Killing processes..."

        # Kill processes more aggressively
        for pid in $PIDS; do
            echo "   Killing process $pid..."
            kill -9 "$pid" 2>/dev/null
        done

        # Wait longer for processes to terminate
        sleep 3

        # Verify processes are killed
        REMAINING_PIDS=$(lsof -ti:$PORT 2>/dev/null)
        if [ -n "$REMAINING_PIDS" ]; then
            echo "❌ Failed to kill processes: $REMAINING_PIDS"
            echo "💡 Trying alternative method..."

            # Try alternative method
            sudo kill -9 $REMAINING_PIDS 2>/dev/null
            sleep 2

            # Final check
            FINAL_PIDS=$(lsof -ti:$PORT 2>/dev/null)
            if [ -n "$FINAL_PIDS" ]; then
                echo "❌ Still failed to kill processes: $FINAL_PIDS"
                echo "💡 Please kill manually: sudo lsof -ti:$PORT | xargs sudo kill -9"
                exit 1
            else
                echo "✅ Successfully cleared port $PORT (with sudo)"
            fi
        else
            echo "✅ Successfully cleared port $PORT"
        fi
    else
        echo "✅ Port $PORT is available"
    fi
}

# Function to check if port is available
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null; then
        echo "❌ Port $PORT is already in use"
        return 1
    else
        echo "✅ Port $PORT is available"
        return 0
    fi
}

# Main script
clear
echo "🚀 ChatKit Server Startup"
echo "=========================="

# Kill any existing processes using the port
kill_port_processes

# Check if port is available
if ! check_port; then
    echo "💡 Port $PORT is still in use. Please check manually:"
    echo "   lsof -i :$PORT"
    exit 1
fi

echo ""
echo "🎯 Starting ChatKit server..."
echo "   Host: $HOST"
echo "   Port: $PORT"
echo ""

# Start the server
uv run chatkit --host "$HOST" --port "$PORT"
#!/bin/bash

# Navigate to the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

if [ -f app.pid ]; then
    PID=$(cat app.pid)
    
    if ps -p $PID > /dev/null 2>&1; then
        echo "Stopping Ollama Web UI (PID: $PID)..."
        kill $PID
        
        # Wait for the process to exit
        while ps -p $PID > /dev/null 2>&1; do
            sleep 0.5
        done
        
        echo "Service successfully stopped."
        rm app.pid
    else
        echo "Service is not running (stale app.pid found). Cleaning up..."
        rm app.pid
    fi
else
    echo "app.pid file not found. Is the service currently running?"
fi

#!/bin/bash

# Navigate to the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if the service is already running
if [ -f app.pid ]; then
    PID=$(cat app.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo "Service is already running with PID $PID."
        exit 1
    else
        echo "Found stale app.pid file. Cleaning up..."
        rm app.pid
    fi
fi

# Activate virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "Virtual environment '.venv' not found. Please run 'python3 -m venv .venv' and install requirements."
    exit 1
fi

PORT=${1:-9999}
echo "Starting myremomo in daemon mode on port $PORT..."

# Run the app using uvicorn in the background with nohup
nohup uvicorn app:app --host 0.0.0.0 --port $PORT > app.log 2>&1 &
PID=$!

# Save the Process ID
echo $PID > app.pid

echo "Service successfully started with PID $PID."
echo "Logs are being written to $DIR/app.log"

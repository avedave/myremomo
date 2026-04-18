# myremomo

A responsive, web-based interface for interacting with your local Ollama models. It features real-time streaming, markdown support, a responsive dark-mode design, and a favorites system.

## Prerequisites

1. Ensure [Ollama](https://ollama.com/) is installed and running on your machine (default port `11434`).
2. Have Python installed (`python3`).

## Setup & Running

To start the application, first clone the repository and navigate to the project directory:

```bash
git clone https://github.com/yourusername/myremomo.git
cd myremomo
```

### 1. Create and Activate the Virtual Environment
Create a new virtual environment and install the required dependencies:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the Server
Start the FastAPI backend server. We configure the server to bind to `0.0.0.0` so that it listens on all network interfaces. This allows you to access the web UI from other devices (like your phone or tablet) connected to the same network or over your VPN.

Run the following command:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```
*(Alternatively, you can simply run `python app.py`, which has also been configured to bind to `0.0.0.0`)*

### 3. Access the Application
- **From this computer**: Open your browser and go to `http://localhost:8000`
- **From another device (via VPN / Local Network)**: Find your computer's IP address (e.g., `192.168.1.50` or your VPN IP) and open `http://<YOUR_IP_ADDRESS>:8000` in your device's browser.

## Features
- **Dynamic Model Selection**: Automatically lists models available on your local Ollama instance.
- **Real-Time Streaming**: Interactive chat experience with instantaneous character-by-character responses.
- **Cross-Device Support**: Built with fluid layouts that scale seamlessly down to mobile screens.

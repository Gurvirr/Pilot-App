# Pilot AI Assistant

A powerful, voice-controlled AI assistant built with a Python backend and an Electron frontend. This project uses Google Gemini for AI logic and ElevenLabs for realistic Text-to-Speech.

## Project Structure

This project is organized into a monorepo with two main backend services and a frontend UI.

```
Pilot-App/
├── backend/
│   ├── python/      # Python AI, Flask Server, and Actions
│   │   ├── AI/
│   │   ├── captures/
│   │   └── ...
│   └── electron/    # Electron main process and Node.js services
│       ├── index.js
│       └── ...
├── frontend/        # HTML, CSS, and JS for the UI
└── venv/            # Python virtual environment
```

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js (which includes npm)
- An active ElevenLabs API key
- An active Google Gemini API key

### 1. Environment and Dependencies

**a. Clone the repository:**
```bash
git clone <repository-url>
cd Pilot-App
```

**b. Set up Environment Variables:**
Create a file named `.env` in the root of the project (`Pilot-App/`) and add your API keys:
```env
ELEVENLABS_API_KEY="your_elevenlabs_api_key"
GEMINI_API_KEY="your_gemini_api_key"
```

**c. Set up Python Virtual Environment:**
This creates an isolated environment for the Python dependencies.
```bash
# Create and activate the virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux
```

**d. Install Python Dependencies:**
The `requirements.txt` file is now located in the `backend/python` directory.
```bash
pip install -r backend/python/requirements.txt
```

**e. Install Node.js Dependencies:**
This will install all packages needed for the Electron app and its services (like `electron`, `systeminformation`, etc.).
```bash
npm install
```

## How to Run the Application

You need to start two processes in two separate terminals.

### Terminal 1: Start the Python Backend

The Python server handles the AI logic and speech processing.
```bash
# Make sure your venv is still active
cd backend/python
python server.py
```
You should see output indicating that the "Pilot Flask Server" is running on port 5000.

### Terminal 2: Start the Electron Frontend

This command starts the desktop application, which will display the UI.
```bash
# From the project's root directory
npm start
```
The Pilot overlay should now appear on your screen.

## Core Features
- **Voice-Controlled AI**: Uses Google Gemini to understand commands and perform actions.
- **Realistic Text-to-Speech**: Powered by the ElevenLabs API for natural-sounding voice responses.
- **Desktop Overlay UI**: A persistent, transparent Electron overlay to display system info, media, and AI status.
- **System and Media Integration**: Real-time monitoring of CPU/RAM and currently playing media.
- **Extensible Action System**: Easily add new capabilities for Pilot to perform, from opening apps to controlling in-game macros.

```bash
cd backend
python -m venv venv 
.\venv\Scripts\activate

pip install -q -U google-genai
pip install obsws-python

```

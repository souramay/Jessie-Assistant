# Jessie Voice Assistant

A voice-enabled AI assistant with music playback capabilities.

## Features

- Voice recognition and response
- Music playback through YouTube
- AI-powered chat responses
- Text-to-speech capabilities

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/jessie.git
cd jessie
```

2. Create and activate virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file with your API keys:
```
OPENAI_API_KEY=your_openai_api_key
```

## Running Locally

1. Start the server:
```bash
python app.py
```

2. Access the application:
- Local: https://localhost:8080
- Network: https://your_ip:8080

## Usage

- Click the microphone button to start voice input
- Say "play [song name]" to play music
- Say "stop music" to stop playback
- Type messages in the chat box for text interaction

## Deployment

This project can be deployed to:
- Vercel (recommended for HTTPS)
- Heroku
- Any Python-compatible hosting service

## License

MIT License
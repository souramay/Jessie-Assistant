# Jessie AI Voice Assistant

A voice-enabled AI assistant with a unique personality, built with Flask and Gemini AI.

## Features

- Voice input and output
- AI-powered responses using Gemini
- Real-time chat interface
- Audio file management
- Automatic cleanup of old audio files

## Prerequisites

- Python 3.11+
- Google API Key for Gemini AI
- Git

## Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/souramay/jessie-voice-assistant.git
cd jessie-voice-assistant
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the root directory with your Google API key:
```
GOOGLE_API_KEY=your_api_key_here
```

5. Run the application:
```bash
python app.py
```

## Deployment to PythonAnywhere

1. Create a free account on [PythonAnywhere](https://www.pythonanywhere.com/)

2. After logging in:
   - Go to the "Web" tab
   - Click "Add a new web app"
   - Choose "Manual configuration" (Python 3.11)
   - Select "Flask" as the web framework
   - Set the Python path to your project directory

3. Set up your project:
   - In the "Web" tab, scroll down to "Code"
   - Set the source code directory to your project folder
   - Set the working directory to your project folder
   - Set the WSGI configuration file to `passenger_wsgi.py`

4. Configure environment variables:
   - In the "Web" tab, scroll down to "Virtualenv"
   - Create a new virtualenv with Python 3.11
   - Install requirements:
     ```bash
     pip install -r requirements.txt
     ```
   - Set the environment variables in the "Web" tab under "Static files":
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```

5. Reload your web app:
   - Click the "Reload" button in the "Web" tab

## Project Structure

```
jessie-voice-assistant/
├── app.py                 # Main application file
├── passenger_wsgi.py      # PythonAnywhere WSGI configuration
├── requirements.txt       # Python dependencies
├── module/
│   ├── chat.py           # Chat functionality
│   └── voice.py          # Voice processing
├── static/
│   ├── audio/            # Generated audio files
│   └── css/              # CSS styles
└── templates/
    └── index.html        # Main template
```

## Technologies Used

- Flask: Web framework
- Gemini AI: AI model for responses
- Edge TTS: Text-to-speech
- SpeechRecognition: Speech-to-text
- Eventlet: WebSocket support
- Gunicorn: Production server

## License

MIT License

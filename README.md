# Jessie Assistant

A powerful voice-enabled AI assistant built with Flask and Google's Generative AI.

## Live Demo

Check out the live application: [Jessie Assistant on Render](https://jessie-assistant.onrender.com)

## Features

- Voice recognition and natural speech responses
- YouTube music search and playback functionality
- AI-powered conversations via Google Generative AI
- Web-based interface for easy interaction

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
YOUTUBE_API_KEY=your_youtube_api_key_here
PORT=8080
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
     YOUTUBE_API_KEY=your_youtube_api_key_here
     PORT=8080
     ```

5. Reload your web app:
   - Click the "Reload" button in the "Web" tab

## Deployment to Render

1. Create a free account on [Render](https://render.com/)

2. After logging in:
   - Click "New" and select "Web Service"
   - Connect your GitHub repository
   - Select the branch you want to deploy

3. Configure your web service:
   - Give your service a name
   - Set the Runtime to "Python 3"
   - Set the Build Command to: `pip install -r requirements.txt`
   - Set the Start Command to: `gunicorn app:app`

4. Configure environment variables:
   - Scroll down to the "Environment" section
   - Add the following environment variables:
     ```
     GOOGLE_API_KEY=your_api_key_here
     YOUTUBE_API_KEY=your_youtube_api_key_here
     PORT=8080
     ```

5. Deploy your web service:
   - Click "Create Web Service"
   - Wait for the deployment to complete
   - Access your app at the provided URL (e.g., https://jessie-assistant.onrender.com)

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

- **Backend**: Flask, Python 3.11
- **AI Integration**: Google Generative AI
- **Voice**: Edge TTS, SpeechRecognition
- **Deployment**: Render
- **Media**: YouTube Search Python, yt-dlp

## Deployment

This application is deployed on [Render](https://render.com), providing reliable cloud hosting with automatic deployment from the GitHub repository.

## Voice Input Tips

For best microphone performance:

- Use a quiet environment with minimal background noise
- Speak clearly and at a normal volume
- Allow microphone permissions when prompted
- Position yourself close to your device's microphone
- The system will automatically stop listening after silence is detected



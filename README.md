# Rude AI Assistant

A sarcastic emo teenage AI assistant with attitude. This Flask web application features a voice-interactive chatbot that responds with the personality of a moody teenage girl.

## Features

- Voice recognition for hands-free interaction
- Text-to-speech responses with sassy teen voice
- Persistent chat interface
- Mobile-friendly responsive design
- Consistently rude and sarcastic personality

## Setup Instructions

1. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the project root directory with your Google API key:
```
GOOGLE_API_KEY=your_api_key_here
```

4. Or set the environment variable directly:
```bash
# On Linux/Mac
export GOOGLE_API_KEY="your_api_key_here"

# On Windows
set GOOGLE_API_KEY=your_api_key_here
```

5. Run the application:
```bash
python app.py
```

6. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:8080`)

## Deployment to Railway

### Prerequisites
1. Create a Railway account at [railway.app](https://railway.app)
2. Install the Railway CLI (optional):
   ```bash
   npm i -g @railway/cli
   ```

### Deployment Steps

1. **Push your code to a Git repository** (GitHub, GitLab, or Bitbucket)

2. **Create a new project on Railway**
   - Go to your Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure the project**
   - Railway will automatically detect the Python project
   - Add environment variables:
     - `GOOGLE_API_KEY`: Your Google API key
     - `PORT`: 8080

4. **Deploy**
   - Railway will automatically build and deploy your application
   - You'll get a URL where your app is accessible

### Environment Variables
Make sure to set these environment variables in your Railway dashboard:
- `GOOGLE_API_KEY`: Your Google API key for AI services
- `PORT`: 8080 (default)

## Voice Commands

- "Exit" or "Quit" or "Stop" - Closes the application

## Project Structure

```
.
├── app.py              # Main Flask application
├── Procfile           # Railway configuration
├── module/            # Core modules
│   ├── chat.py        # AI conversation handler
│   ├── music.py       # Music playback functionality
│   └── voice.py       # Speech recognition and synthesis
├── static/            # Static files
│   ├── audio/         # Generated speech files
│   ├── css/           # CSS styles
│   │   └── style.css
│   └── js/            # JavaScript files
│       └── main.js
├── templates/         # HTML templates
│   └── index.html
├── .env               # Environment variables (create this file)
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## Obtaining a Google Gemini API Key

1. Go to the [Google AI Studio](https://aistudio.google.com/) website
2. Sign in with your Google account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the API key to your `.env` file or set it as an environment variable

## Technologies Used

- Flask 3.0.2 - Web framework
- Google Gemini AI - Language model for chat responses
- Edge TTS - Text-to-speech for sassy voice responses
- SpeechRecognition - Voice command recognition
- HTML5/CSS3/JS - Frontend interface

## Requirements

- Python 3.11+
- Internet connection (for AI features)
- Microphone (for voice commands)
- Speakers (for audio output)
- Google Gemini API key

## Troubleshooting

1. **If deployment fails:**
   - Check the Railway logs
   - Ensure all dependencies are in requirements.txt
   - Verify environment variables are set correctly

2. **If static files aren't loading:**
   - Check the file paths in your templates
   - Ensure static files are properly referenced

3. **If Python backend isn't working:**
   - Check Python version compatibility
   - Verify all required packages are installed
   - Check environment variables

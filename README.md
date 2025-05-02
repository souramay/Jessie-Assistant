# Rude AI Assistant 💅

A sarcastic emo teenage AI assistant with attitude. This Flask web application features a voice-interactive chatbot that responds with the personality of a moody teenage girl.

## Features

- 🎤 Voice recognition for hands-free interaction
- 🗣️ Text-to-speech responses with sassy teen voice
- 🎵 Music playback integration ("play [song name]")
- 💬 Persistent chat interface
- 📱 Mobile-friendly responsive design
- 😒 Consistently rude and sarcastic personality

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

## Voice Commands

- "Play [song name]" - Plays the requested song on YouTube
- "Play music" or "Recommend a song" - Plays a random song recommendation
- "Exit" or "Quit" or "Stop" - Closes the application

## Project Structure

```
.
├── app.py              # Main Flask application
├── main.py             # Command-line interface version
├── module/             # Core modules
│   ├── chat.py         # AI conversation handler
│   ├── music.py        # Music playback functionality
│   └── voice.py        # Speech recognition and synthesis
├── static/             # Static files
│   ├── audio/          # Generated speech files
│   ├── css/            # CSS styles
│   │   └── style.css
│   └── js/             # JavaScript files
│       └── main.js
├── templates/          # HTML templates
│   └── index.html
├── .env                # Environment variables (create this file)
├── requirements.txt    # Python dependencies
└── README.md           # This file
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
- PyWhatKit - YouTube music integration
- HTML5/CSS3/JS - Frontend interface

## Requirements

- Python 3.8+
- Internet connection (for AI and music features)
- Microphone (for voice commands)
- Speakers (for audio output)
- Google Gemini API key

## License

This project is open source and available under the MIT License.

## Deployment

### Deploying to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following settings:
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
4. Add your environment variables:
   - `GOOGLE_API_KEY`: Your Google Gemini API key
5. Deploy!
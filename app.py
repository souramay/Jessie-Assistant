from flask import Flask, request, jsonify, send_from_directory, render_template, Response, stream_with_context
import os
import logging
import sys
from dotenv import load_dotenv
import requests
from youtubesearchpython import VideosSearch
from googleapiclient.discovery import build
import random

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import application modules
from module.voice import speak, cleanup_old_audio_files, speak_sync
from module.chat import start_conversation, get_response

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configure app
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = os.path.join(current_dir, 'static', 'audio')
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize chat at startup
chat = start_conversation()

# Get YouTube API key from environment variables
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")
if not YOUTUBE_API_KEY:
    logger.warning("YouTube API key not found in environment variables. YouTube features may not work.")

RANDOM_MUSIC_QUERIES = [
    "popular hits",
    "classic rock",
    "lofi beats",
    "jazz classics",
    "electronic dance",
    "hip hop",
    "piano instrumental",
    "ambient background",
    "indie pop",
    "workout motivation",
    "relaxing acoustic",
    "trending music",
    "study playlist",
    "chill vibes"
]

def search_youtube(query):
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        request = youtube.search().list(
            q=query,
            part='snippet,id',  # Changed from just 'id' to get more metadata
            type='video',
            maxResults=5,
            videoEmbeddable='true'
        )
        response = request.execute()
        items = response.get('items')
        if not items:
            return None
            
        # Get the first valid result
        for item in items:
            video_id = item['id']['videoId']
            title = item['snippet']['title']
            channel = item['snippet']['channelTitle']
            thumbnail = item['snippet']['thumbnails']['medium']['url']
            
            return {
                'url': f"https://www.youtube.com/watch?v={video_id}",
                'title': title,
                'channel': channel,
                'thumbnail': thumbnail,
                'video_id': video_id
            }
        return None
    except Exception as e:
        logger.error(f"Error in search_youtube: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/send_message', methods=['POST'])
def send_message():
    try:
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
            
        message = data.get('message', '').strip()
        if not message:
            return jsonify({'error': 'Empty message'}), 400
        
        # --- Music request logic ---
        if message.lower() == "play music" or message.lower() == "play music ":
            # Select a random music query
            random_query = random.choice(RANDOM_MUSIC_QUERIES)
            youtube_result = search_youtube(random_query)
            
            if youtube_result:
                title = youtube_result.get('title', 'Unknown')
                channel = youtube_result.get('channel', '')
                return jsonify({
                    'response': f"Playing {title}{' by ' + channel if channel else ''} from YouTube!",
                    'youtube_url': youtube_result['url'],
                    'youtube_metadata': youtube_result
                })
            else:
                return jsonify({'response': "Sorry, I couldn't find any random music right now."})
                
        elif message.lower().startswith("play "):
            song_query = message[5:]
            youtube_result = search_youtube(song_query)
            
            if youtube_result:
                title = youtube_result.get('title', song_query)
                channel = youtube_result.get('channel', '')
                return jsonify({
                    'response': f"Playing {title}{' by ' + channel if channel else ''} from YouTube!",
                    'youtube_url': youtube_result['url'],
                    'youtube_metadata': youtube_result
                })
            else:
                return jsonify({'response': f"Sorry, I couldn't find '{song_query}' on YouTube."})

        # --- Existing chat logic ---
        response = get_response(chat, message)
        if not response:
            response = "I didn't get that. Try again?"
        
        # Generate speech
        audio_result = speak_sync(response)
        
        if audio_result and isinstance(audio_result, dict):
            filename = audio_result.get("filename")
            content = audio_result.get("content")
            
            if filename and content:
                audio_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                with open(audio_path, 'wb') as f:
                    f.write(content)
                
                return jsonify({
                    'response': response,
                    'audio': f'/static/audio/{filename}'
                })
        
        return jsonify({'response': response})
            
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        return jsonify({'response': "Something went wrong. Try again?"})

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/cleanup', methods=['POST'])
def cleanup():
    try:
        files_deleted = cleanup_old_audio_files()
        return jsonify({
            'status': 'success',
            'message': f'Cleanup completed. Deleted {files_deleted} files.'
        })
    except Exception as e:
        logger.error(f"Error in cleanup: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == "__main__":
    # Get port from environment variable or use default
    port = int(os.environ.get("PORT", 8080))  # Changed default from 5000 to 8080
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host="0.0.0.0", port=port, debug=debug)


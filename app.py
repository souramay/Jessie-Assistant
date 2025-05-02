from flask import Flask, request, jsonify, send_from_directory, render_template
import io
import os
import asyncio
import time
import socket
import logging
import sys

from dotenv import load_dotenv

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Import application modules
from module.voice import speak, cleanup_old_audio_files, speak_sync
from module.chat import start_conversation, get_response
from module.music import play_music_sync

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure app for Vercel
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = os.path.join(current_dir, 'static', 'audio')
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize chat at startup
chat = start_conversation()

# Track last cleanup time
last_cleanup_time = 0
CLEANUP_INTERVAL = 300  # 5 minutes in seconds

# Create audio directory if it doesn't exist
AUDIO_DIR = os.path.join(current_dir, "static", "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Vercel serverless handler
def handler(event, context):
    return app(event, context)

def get_ip_addresses():
    """Get local and network IP addresses"""
    try:
        # Get local IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Get network IP by checking interfaces
        network_ip = local_ip
        try:
            # Alternative method to get local network IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            network_ip = s.getsockname()[0]
            s.close()
        except:
            pass
            
        return {
            'local': local_ip,
            'network': network_ip
        }
    except Exception as e:
        logger.error(f"Error getting IP addresses: {e}")
        return {
            'local': '127.0.0.1',
            'network': '127.0.0.1'
        }

def initialize_chat():
    """Initialize chat"""
    global chat
    try:
        chat = start_conversation()
        if chat == "FALLBACK_MODE":
            logger.warning("Chat initialized in fallback mode")
            return False
        return chat is not None
    except Exception as e:
        logger.error(f"Failed to initialize chat: {e}")
        return False

def perform_cleanup():
    """Perform cleanup of old audio files"""
    global last_cleanup_time
    current_time = time.time()
    
    # Only clean up if enough time has passed since last cleanup
    if current_time - last_cleanup_time > CLEANUP_INTERVAL:
        try:
            files_deleted = cleanup_old_audio_files()
            logger.info(f"Automatic cleanup completed. Deleted {files_deleted} files.")
            last_cleanup_time = current_time
        except Exception as e:
            logger.error(f"Error during automatic cleanup: {e}")

def speak_sync(text):
    """Synchronous wrapper for speak function"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(speak(text))
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in speak_sync: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/send_message', methods=['POST'])
def send_message():
    try:
        # Run cleanup periodically
        perform_cleanup()
        
        data = request.json
        if not data or 'message' not in data:
            return jsonify({'error': 'No message provided'}), 400
            
        message = data.get('message', '').strip()
        if not message:
            return jsonify({'error': 'Empty message'}), 400
        
        # Initialize chat if not already done
        global chat
        if not chat:
            if not initialize_chat():
                return jsonify({'error': 'Chat not initialized', 'response': "Fuck, I can't connect to my brain right now. Check the API key, yaar!"}), 500
        
        # Check if it's a music command
        if any(keyword in message.lower() for keyword in ['play', 'music', 'song']):
            try:
                # Use the sync wrapper to handle the async function
                result = play_music_sync(message)
                if result:
                    # Generate voice response
                    voice_response = f"Playing {result} for fuck's sake"
                    audio_result = speak_sync(voice_response)
                    
                    if audio_result and isinstance(audio_result, dict):
                        # Save audio file
                        filename = audio_result.get("filename")
                        content = audio_result.get("content")
                        
                        if filename and content:
                            audio_path = os.path.join(AUDIO_DIR, filename)
                            with open(audio_path, 'wb') as f:
                                f.write(content)
                            
                            return jsonify({
                                'response': voice_response,
                                'audio': f'/static/audio/{filename}',
                                'song': result
                            })
                    
                    return jsonify({
                        'response': voice_response,
                        'song': result
                    })
                else:
                    error_response = "Fuck, I couldn't find that song. Try another one?"
                    audio_result = speak_sync(error_response)
                    
                    if audio_result and isinstance(audio_result, dict):
                        filename = audio_result.get("filename")
                        content = audio_result.get("content")
                        
                        if filename and content:
                            audio_path = os.path.join(AUDIO_DIR, filename)
                            with open(audio_path, 'wb') as f:
                                f.write(content)
                            
                            return jsonify({
                                'response': error_response,
                                'audio': f'/static/audio/{filename}'
                            })
                    
                    return jsonify({'response': error_response})
            except Exception as e:
                logger.error(f"Error playing music: {e}")
                error_response = "Fuck, I can't play that music right now."
                audio_result = speak_sync(error_response)
                
                if audio_result and isinstance(audio_result, dict):
                    filename = audio_result.get("filename")
                    content = audio_result.get("content")
                    
                    if filename and content:
                        audio_path = os.path.join(AUDIO_DIR, filename)
                        with open(audio_path, 'wb') as f:
                            f.write(content)
                        
                        return jsonify({
                            'response': error_response,
                            'audio': f'/static/audio/{filename}'
                        })
                
                return jsonify({'response': error_response})
        
        # Get chat response
        try:
            response = get_response(chat, message)
            if not response:
                logger.error("Empty response from chat")
                response = "Fuck, I didn't get that. Try again?"
        except Exception as e:
            logger.error(f"Error getting chat response: {e}")
            response = "Fuck, something went wrong. Try again?"
        
        # Generate speech
        try:
            audio_result = speak_sync(response)
            
            if audio_result and isinstance(audio_result, dict):
                # Save audio file to static directory for proper serving
                filename = audio_result.get("filename")
                content = audio_result.get("content")
                
                if filename and content:
                    audio_path = os.path.join(AUDIO_DIR, filename)
                    with open(audio_path, 'wb') as f:
                        f.write(content)
                    
                    # Return response with audio URL
                    return jsonify({
                        'response': response,
                        'audio': f'/static/audio/{filename}'
                    })
            
            # If no audio or invalid audio result, return just the response
            return jsonify({'response': response})
            
        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            return jsonify({'response': response})
            
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        return jsonify({'response': "Fuck, something went wrong. Try again?"})

@app.route('/static/audio/<path:filename>')
def serve_audio(filename):
    """Serve audio files from static directory"""
    try:
        return send_from_directory(AUDIO_DIR, filename)
    except Exception as e:
        logger.error(f"Error serving audio file {filename}: {e}")
        return jsonify({'error': 'Audio file not found'}), 404

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

@app.route('/listen', methods=['POST'])
def listen():
    try:
        # Run cleanup periodically
        perform_cleanup()
        
        from module.voice import listen as voice_listen
        
        # Try to listen for voice input
        text = voice_listen()
        
        if text:
            # Process the recognized text
            global chat
            if not chat:
                if not initialize_chat():
                    return jsonify({
                        'error': 'Chat not initialized',
                        'response': "Fuck, I can't connect to my brain right now. Check the API key, yaar!",
                        'text': text
                    }), 500
            
            # Get response from chat
            try:
                response = get_response(chat, text)
                if not response:
                    logger.error("Empty response from chat")
                    response = "Fuck, I didn't get that. Try again?"
            except Exception as e:
                logger.error(f"Error getting chat response: {e}")
                response = "Fuck, something went wrong. Try again?"
            
            # Generate speech
            try:
                audio_result = speak_sync(response)
                
                if audio_result and isinstance(audio_result, dict):
                    # Save audio file to static directory
                    filename = audio_result.get("filename")
                    content = audio_result.get("content")
                    
                    if filename and content:
                        audio_path = os.path.join(AUDIO_DIR, filename)
                        with open(audio_path, 'wb') as f:
                            f.write(content)
                        
                        # Return response with audio URL
                        return jsonify({
                            'text': text,
                            'response': response,
                            'audio': f'/static/audio/{filename}'
                        })
                
                # If no audio or invalid audio result, return just the response
                return jsonify({
                    'text': text,
                    'response': response
                })
            except Exception as e:
                logger.error(f"Error generating speech: {e}")
                return jsonify({
                    'text': text,
                    'response': response
                })
        else:
            # No speech recognized
            return jsonify({
                'text': None,
                'response': "Fuck, I couldn't hear you. Speak up, yaar!",
                'error': 'No speech detected'
            })
    except Exception as e:
        logger.error(f"Error in voice recognition: {e}")
        return jsonify({
            'error': str(e),
            'response': "Fuck, I can't hear you right now. Try typing instead.",
            'text': None
        })

if __name__ == '__main__':
    # Get IP addresses
    ip_addresses = get_ip_addresses()
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")  # Use 0.0.0.0 to allow external connections
    
    print("\n" + "="*50)
    print("🎤 Jessie Voice Assistant is starting up...")
    print(f"🌐 Local URL: http://localhost:{port}")
    print(f"🌐 Local Network URL: http://{ip_addresses['network']}:{port}")
    print("="*50 + "\n")
    
    # Initialize chat
    initialize_chat()
    
    # Set debug mode from environment variable (default to False for production)
    debug_mode = os.environ.get("DEBUG", "False").lower() == "true"
    
    # Run the application
    app.run(
        host=host,
        port=port,
        debug=debug_mode,
        threaded=True
    )
# modules/voice.py
import os
import random
import time
import logging
import io

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try to import speech recognition and edge_tts
try:
    import speech_recognition as sr
    has_speech_recognition = True
except ImportError:
    logger.warning("speech_recognition module not found. Voice input will not work.")
    has_speech_recognition = False

try:
    import edge_tts
    has_edge_tts = True
except ImportError:
    logger.warning("edge_tts module not found. Voice output will not work.")
    has_edge_tts = False

# Rude Indian teen configuration with explicit language
SASSY_PHRASES = {
    "hello": "Fuck, what do you want yaar?",
    "thank you": "Whatever, don't mention it. Fuck off",
    "please": "As if I fucking care...",
    "goodbye": "Finally! Go touch grass, bhenchod",
    "error": "This is so fucking cringe, fix your code",
    "help": "Figure it out yourself, pagal",
    "happy": "Don't kill my vibe, fuck's sake",
    "love you": "Ew, fuck no. So gross"
}

# Indian slang words to mix in
INDIAN_SLANG = [
    "yaar",
    "bhai",
    "matlab",
    "ekdum",
    "bakwas",
    "faltu",
    "pagal",
    "gadha",
    "bhenchod",
    "chutiya",
    "saala",
    "bhai",
    "toh",
    "haan",
    "achha",
    "arrey"
]

# Rude suffixes without emojis
RUDE_SUFFIXES = [
    " for fuck's sake",
    "... whatever",
    "... not my fucking problem",
    " seriously",
    " duh",
    " obviously",
    " matlab samjha karo",
    " stupid",
    "... so dumb",
    " get it?",
    " like seriously"
]

# Add Indian pronunciation mappings
INDIAN_PRONUNCIATION = {
    # Basic words
    "the": "the",
    "this": "this",
    "that": "that",
    "what": "what",
    "why": "why",
    "how": "how",
    "you": "you",
    "your": "your",
    "are": "are",
    "is": "is",
    "am": "am",
    "okay": "okay",
    "ok": "okay",
    "please": "please",
    "thank": "thank",
    "thanks": "thanks",
    "sorry": "sorry",
    "hello": "hello",
    "hi": "hi",
    "bye": "bye",
    "good": "good",
    "bad": "bad",
    "very": "very",
    
    # Common phrases
    "really": "really",
    "actually": "actually",
    "basically": "basically",
    "literally": "literally",
    "seriously": "seriously",
    "obviously": "obviously",
    "probably": "probably",
    "definitely": "definitely",
    "absolutely": "absolutely",
    "exactly": "exactly",
    "completely": "completely",
    "totally": "totally",
    
    # Indian English specific
    "only": "only",
    "itself": "itself",
    "themselves": "themselves",
    "himself": "himself",
    "herself": "herself",
    "myself": "myself",
    "yourself": "yourself",
    "yourselves": "yourselves",
    
    # Common verbs
    "going": "going",
    "coming": "coming",
    "doing": "doing",
    "having": "having",
    "taking": "taking",
    "making": "making",
    "saying": "saying",
    "telling": "telling",
    "asking": "asking",
    "thinking": "thinking",
    "working": "working",
    "looking": "looking",
    "talking": "talking",
    "walking": "walking",
    "running": "running",
    
    # Common adjectives
    "beautiful": "beautiful",
    "wonderful": "wonderful",
    "terrible": "terrible",
    "horrible": "horrible",
    "possible": "possible",
    "impossible": "impossible",
    "comfortable": "comfortable",
    "uncomfortable": "uncomfortable",
    "responsible": "responsible",
    "irresponsible": "irresponsible",
    
    # Common nouns
    "people": "people",
    "example": "example",
    "problem": "problem",
    "system": "system",
    "government": "government",
    "development": "development",
    "environment": "environment",
    "management": "management",
    "department": "department",
    "document": "document",
    
    # Common adverbs
    "usually": "usually",
    "generally": "generally",
    "normally": "normally",
    "basically": "basically",
    "actually": "actually",
    "literally": "literally",
    "seriously": "seriously",
    "obviously": "obviously",
    "probably": "probably",
    "definitely": "definitely",
    
    # Common prepositions
    "about": "about",
    "above": "above",
    "across": "across",
    "after": "after",
    "against": "against",
    "among": "among",
    "around": "around",
    "before": "before",
    "behind": "behind",
    "below": "below",
    
    # Common conjunctions
    "because": "because",
    "although": "although",
    "however": "however",
    "therefore": "therefore",
    "meanwhile": "meanwhile",
    "otherwise": "otherwise",
    "nevertheless": "nevertheless",
    "furthermore": "furthermore",
    "moreover": "moreover",
    "consequently": "consequently",

    # Insults and slang
    "dumbass": "dumb-ass",
    "dumb ass": "dumb-ass",
    "dumb-ass": "dumb-ass"
}

def make_emo(text):
    """Add rude Indian girl flavor to responses with explicit language"""
    if not text:
        return "Whatever the fuck..."
        
    original_text = text
    text = text.lower()
    
    # Replace polite phrases with rude alternatives
    for polite, rude in SASSY_PHRASES.items():
        text = text.replace(polite.lower(), rude)
    
    # Only apply transformations if text was actually modified
    # Otherwise keep original capitalization
    if text != original_text.lower():
        text = text.capitalize()
    else:
        text = original_text
        
    # Add explicit language randomly
    if "fuck" not in text.lower() and random.random() > 0.6:
        if random.random() > 0.5:
            text = f"Fuck, {text.lower()}"
        else:
            words = text.split()
            insert_pos = min(len(words) - 1, random.randint(1, 3))
            words.insert(insert_pos, "fucking")
            text = " ".join(words)
    
    # Add Indian slang randomly
    if random.random() > 0.6:
        slang = random.choice(INDIAN_SLANG)
        if random.random() > 0.5:
            # Add to beginning
            text = f"{slang}, {text}"
        else:
            # Add to end
            text = f"{text}, {slang}"
    
    # Add random rude suffixes
    if random.random() > 0.5:
        text += random.choice(RUDE_SUFFIXES)
    
    # Strip emojis from text (simple approach - remove common emoji patterns)
    text = text.replace("💀", "").replace("🖤", "").replace("😒", "").replace("🙄", "")
    text = text.replace("🤣", "").replace("😂", "").replace("😤", "").replace("🙃", "")
    text = text.replace("❤️", "").replace("👍", "").replace("👎", "").replace("👏", "")
    
    return text

def enhance_indian_pronunciation(text):
    """Enhance Indian pronunciation in text"""
    # Remove any special characters that might be spelled out
    text = text.replace('"', '').replace('"', '').replace('*', '').replace('_', '')
    
    words = text.split()
    enhanced_words = []
    
    for word in words:
        # Convert to lowercase for matching
        lower_word = word.lower()
        
        # Check if word needs Indian pronunciation
        if lower_word in INDIAN_PRONUNCIATION:
            # Preserve original capitalization
            if word[0].isupper():
                enhanced_word = INDIAN_PRONUNCIATION[lower_word].capitalize()
            else:
                enhanced_word = INDIAN_PRONUNCIATION[lower_word]
            enhanced_words.append(enhanced_word)
        else:
            enhanced_words.append(word)
    
    return ' '.join(enhanced_words)

async def speak(text):
    """Use Microsoft Edge TTS with Indian teen attitude"""
    if not has_edge_tts:
        logger.warning("edge_tts not available. Using text-only response.")
        return None
        
    try:
        if not text:
            logger.warning("No text provided for speech")
            return None
            
        # Remove any special characters that might be spelled out
        text = text.replace('"', '').replace('"', '').replace('*', '').replace('_', '')
        
        emo_text = make_emo(text)
        logger.info(f"[RUDE INDIAN GIRL]: {emo_text}")

        # Enhance Indian pronunciation
        indian_text = enhance_indian_pronunciation(emo_text)
        
        # Add more expressive pauses and emphasis, but handle special characters properly
        expressive_text = indian_text.replace(".", "...").replace("!", "!...").replace("?", "?...")
        logger.debug(f"Expressive text: {expressive_text}")
        
        # Generate unique filename (don't save to disk yet)
        filename = f"{int(time.time())}_{hash(text) % 10000}.mp3"
        logger.debug(f"Audio filename: {filename}")

        # Create communicate object with voice settings
        try:
            # Using a female Indian voice with basic settings
            communicate = edge_tts.Communicate(
                expressive_text,
                "en-IN-NeerjaNeural"  # Indian female voice
            )
            logger.debug("Communicate object created successfully")
        except Exception as e:
            logger.error(f"Error creating communicate object: {e}")
            # Fallback to alternative voice
            try:
                # Try with more common voice if Indian voice fails
                communicate = edge_tts.Communicate(
                    expressive_text,
                    "en-US-AriaNeural"  # US female voice as fallback
                )
                logger.debug("Using fallback US voice")
            except Exception as e2:
                logger.error(f"Error creating fallback communicate object: {e2}")
                # Last resort fallback
                communicate = edge_tts.Communicate(
                    expressive_text,
                    "en-GB-SoniaNeural"  # UK female voice as last resort
                )
                logger.debug("Using last resort UK voice")

        # Use memory stream to avoid file system operations until needed
        memory_stream = io.BytesIO()
        try:
            logger.debug("Generating audio...")
            # Use communicate.stream() instead of stream_to_buffer
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    memory_stream.write(chunk["data"])
            logger.debug("Audio generated successfully")
            
            # Get the audio content
            audio_content = memory_stream.getvalue()
            
            # Return filename and content for further processing
            return {
                "filename": filename,
                "content": audio_content
            }
        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            return None

    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        return None

def cleanup_old_audio_files():
    """Clean up old audio files from the static directory"""
    try:
        # Get the static audio directory path
        audio_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static", "audio")
        if not os.path.exists(audio_dir):
            logger.warning(f"Audio directory does not exist: {audio_dir}")
            return 0
            
        current_time = time.time()
        files_deleted = 0
        
        # Get list of files and sort by modification time
        files = [(os.path.join(audio_dir, f), os.path.getmtime(os.path.join(audio_dir, f))) 
                for f in os.listdir(audio_dir) 
                if f.endswith('.mp3')]
        
        # Sort by modification time (oldest first)
        files.sort(key=lambda x: x[1])
        
        # Keep track of total file size
        total_size = sum(os.path.getsize(f[0]) for f in files)
        
        # If total size is greater than 50MB, delete more aggressively
        size_limit = 50 * 1024 * 1024  # 50MB in bytes
        
        for file_path, mtime in files:
            try:
                # Delete files older than 5 minutes (300 seconds) or if we're over the size limit
                if current_time - mtime > 300 or total_size > size_limit:
                    file_size = os.path.getsize(file_path)
                    os.remove(file_path)
                    files_deleted += 1
                    total_size -= file_size
                    logger.debug(f"Cleaned up old audio file: {os.path.basename(file_path)}")
                    
                    # Stop if we've reduced size below 80% of the limit
                    if total_size < (size_limit * 0.8):
                        break
            except Exception as e:
                logger.error(f"Error cleaning up file {os.path.basename(file_path)}: {e}")
                continue
                
        logger.info(f"Cleanup completed. Deleted {files_deleted} files.")
        return files_deleted
    except Exception as e:
        logger.error(f"Error in cleanup_old_audio_files: {e}")
        return 0

def listen():
    """Listen with attitude"""
    if not has_speech_recognition:
        logger.warning("speech_recognition module not available. Cannot use voice input.")
        return None
        
    # Print available microphones for debugging
    try:
        logger.debug("Available microphones:")
        from speech_recognition import Microphone
        mics = Microphone.list_microphone_names()
        for i, mic in enumerate(mics):
            logger.debug(f"  {i}: {mic}")
    except Exception as e:
        logger.warning(f"Could not list microphones: {e}")
    
    # Create recognizer with more aggressive settings
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 6000  # Higher threshold to reduce background noise
    recognizer.dynamic_energy_threshold = True
    recognizer.dynamic_energy_adjustment_damping = 0.15
    recognizer.dynamic_energy_ratio = 1.5
    recognizer.pause_threshold = 0.8  # Longer pause threshold to prevent multiple triggers
    recognizer.non_speaking_duration = 0.5  # Longer non-speaking duration
    recognizer.phrase_threshold = 0.5  # Higher phrase threshold for better detection

    # List of microphone indices to try, prioritizing the most common ones
    mic_indices = [
        None,  # Default microphone
        0,     # First microphone
        5,     # Intel Smart Sound Technology
        17,    # Realtek HD Audio Mic input
        18,    # Microphone Array 1
        19,    # Microphone Array 2
        20,    # Microphone Array 3
        21     # Microphone Array 4
    ]
    
    for device_index in mic_indices:
        try:
            logger.info(f"Trying microphone with index: {device_index}")
            with sr.Microphone(device_index=device_index) as source:
                logger.info("Adjusting for ambient noise...")
                recognizer.adjust_for_ambient_noise(source, duration=1)
                
                logger.info("Listening for speech...")
                try:
                    # Longer timeout and phrase limit to prevent multiple triggers
                    audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                    logger.info("Audio captured!")
                except sr.WaitTimeoutError:
                    logger.debug("No speech detected within timeout")
                    continue
                
                try:
                    # Try Google Speech Recognition first
                    text = recognizer.recognize_google(audio)
                    logger.info(f"You said: {text}")
                    
                    # Clean up the text to prevent duplicate words
                    words = text.split()
                    cleaned_words = []
                    for word in words:
                        if not cleaned_words or word.lower() != cleaned_words[-1].lower():
                            cleaned_words.append(word)
                    cleaned_text = ' '.join(cleaned_words)
                    
                    return cleaned_text
                except sr.UnknownValueError:
                    logger.debug("Speech not understood")
                    continue
                except sr.RequestError as e:
                    logger.error(f"Google Speech Recognition error: {e}")
                    # Try offline recognition as backup
                    try:
                        text = recognizer.recognize_sphinx(audio)
                        logger.info(f"Offline recognized: {text}")
                        return text
                    except:
                        continue
                    
        except Exception as e:
            logger.error(f"Error with microphone {device_index}: {e}")
            continue
    
    logger.error("No working microphone found")
    return None
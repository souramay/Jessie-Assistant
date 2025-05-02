import pywhatkit as kit
from module.chat import start_conversation
import asyncio
from module.voice import speak
import logging
import re
import random
from datetime import datetime, timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Song recommendation history
RECOMMENDATION_HISTORY = []
MAX_HISTORY_SIZE = 20  # Increased history size
HISTORY_EXPIRY_HOURS = 24

# Blacklist for songs that keep repeating
SONG_BLACKLIST = {
    "Tujamo - Down": datetime.now() - timedelta(days=30)  # Blacklist for 30 days
}

# More diverse prompts
RECOMMENDATION_PROMPTS = [
    "Recommend a {decade} {genre} song that's not too mainstream. Reply ONLY with song name. Add sarcastic comment.",
    "What's an underrated {genre} song from {decade}? Reply ONLY with song name. Add sarcastic comment.",
    "Give me a {genre} song recommendation that most people haven't heard. Reply ONLY with song name. Add sarcastic comment.",
    "I need a {genre} song that's not on the radio. Reply ONLY with song name. Add sarcastic comment.",
    "Play some {genre} music that's actually good. Reply ONLY with song name. Add sarcastic comment.",
    "Recommend a {genre} song that's not overplayed. Reply ONLY with song name. Add sarcastic comment.",
    "What's a hidden gem in {genre} music? Reply ONLY with song name. Add sarcastic comment.",
    "Give me a {genre} song that deserves more attention. Reply ONLY with song name. Add sarcastic comment."
]

# Expanded genres with subgenres
GENRES = [
    "pop", "rock", "hip hop", "electronic", "classical",
    "jazz", "blues", "country", "R&B", "metal",
    "indie", "folk", "reggae", "soul", "funk",
    "disco", "punk", "alternative", "latin", "k-pop",
    "EDM", "house", "techno", "trance", "dubstep",
    "progressive rock", "psychedelic rock", "indie pop",
    "indie rock", "alternative rock", "folk rock",
    "soul jazz", "acid jazz", "smooth jazz",
    "trap", "drill", "lo-fi hip hop", "conscious hip hop",
    "synthwave", "vaporwave", "future bass", "drum and bass"
]

# Decades for more variety
DECADES = [
    "1960s", "1970s", "1980s", "1990s", "2000s",
    "2010s", "2020s", "recent", "classic", "modern"
]

def clean_recommendation_history():
    """Remove old recommendations from history"""
    global RECOMMENDATION_HISTORY
    now = datetime.now()
    RECOMMENDATION_HISTORY = [
        rec for rec in RECOMMENDATION_HISTORY
        if now - rec['timestamp'] < timedelta(hours=HISTORY_EXPIRY_HOURS)
    ]

def is_blacklisted(song):
    """Check if a song is blacklisted"""
    for blacklisted_song, expiry in SONG_BLACKLIST.items():
        if blacklisted_song.lower() in song.lower():
            if datetime.now() < expiry:
                return True
    return False

def is_recently_recommended(song):
    """Check if a song was recently recommended"""
    clean_recommendation_history()
    return any(rec['song'].lower() == song.lower() for rec in RECOMMENDATION_HISTORY)

def add_to_recommendation_history(song):
    """Add a song to the recommendation history"""
    global RECOMMENDATION_HISTORY
    RECOMMENDATION_HISTORY.append({
        'song': song,
        'timestamp': datetime.now()
    })
    if len(RECOMMENDATION_HISTORY) > MAX_HISTORY_SIZE:
        RECOMMENDATION_HISTORY.pop(0)

async def get_recommended_songs(max_attempts=5):  # Increased max attempts
    """Get song with attitude and variety"""
    for attempt in range(max_attempts):
        try:
            # Select random genre, decade, and prompt
            genre = random.choice(GENRES)
            decade = random.choice(DECADES)
            prompt_template = random.choice(RECOMMENDATION_PROMPTS)
            prompt = prompt_template.format(genre=genre, decade=decade)
            
            chat = start_conversation()
            response = chat.send_message(prompt)
            song_text = response.text.strip()
            
            # Extract just the song name before any sarcastic comments
            match = re.match(r'^(.*?)(?:[.!?]|$)', song_text)
            song = match.group(1).strip() if match else song_text
            
            # Check if this song is blacklisted or recently recommended
            if not is_blacklisted(song) and not is_recently_recommended(song):
                add_to_recommendation_history(song)
                return song
            
            logger.info(f"Song '{song}' was recently recommended or blacklisted, trying again...")
            
        except Exception as e:
            logger.error(f"Error getting song recommendation (attempt {attempt + 1}): {e}")
            if attempt == max_attempts - 1:
                await speak("Music recs are so basic anyway")
                return None
            await asyncio.sleep(1)  # Wait before retrying
    
    return None

async def play_music(song_name=None):
    """Play music with attitude"""
    try:
        logger.info(f"Received music request: {song_name}")
        
        if song_name is None or "recommend" in song_name.lower():
            song = await get_recommended_songs()
            if song:
                logger.info(f"Playing recommended song: {song}")
                await speak(f"Ugh, fine. Here's some basic music for you: {song}")
                kit.playonyt(song)
                return song
            return None
        else:
            # Clean up the song name more carefully
            original_song = song_name.strip()
            logger.info(f"Original song name: {original_song}")
            
            # Remove command words but keep the actual song name
            song = re.sub(r'^(play|music|song)\s+', '', original_song, flags=re.IGNORECASE)
            song = song.strip()
            logger.info(f"Processed song name: {song}")
            
            if not song:
                logger.warning("Empty song name after processing")
                await speak("Fuck, you didn't tell me what to play!")
                return None
                
            # If the song name is too short, it might be invalid
            if len(song) < 2:
                logger.warning(f"Song name too short: {song}")
                await speak("Fuck, that's not a real song name!")
                return None
                
            logger.info(f"Attempting to play song: {song}")
            await speak(f"Whatever... playing {song} for fuck's sake")
            kit.playonyt(song)
            return song
    except Exception as e:
        logger.error(f"Error playing music: {e}")
        await speak("Fuck, this is so bakwas. Try again?")
        return None

# Non-async wrapper for compatibility
def play_music_sync(song_name=None):
    """Synchronous wrapper for play_music"""
    try:
        # Create a new event loop if one doesn't exist
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(play_music(song_name))
        loop.close()
        return result
    except Exception as e:
        logger.error(f"Error in play_music_sync: {e}")
        return None
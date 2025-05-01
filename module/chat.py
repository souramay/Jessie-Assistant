# module/chat.py
import logging
import os
import asyncio
import sys
import random
import time
import google.generativeai as genai
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add the parent directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

# Import local modules
from module.voice import speak

# Load environment variables
load_dotenv()

# Configure Gemini API using environment variable
api_key = os.environ.get("GOOGLE_API_KEY")
if not api_key:
    logger.warning("GOOGLE_API_KEY environment variable not set. Gemini AI will not work properly.")

# Initialize genai configuration
try:
    genai.configure(api_key=api_key)
    # Create the model instance
    model = genai.GenerativeModel('gemini-2.0-flash')
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {e}")

# System prompt for consistent persona
SYSTEM_PROMPT = """You are Jessie, a rude, foul-mouthed Indian teenage girl assistant and you will always talk in hindhi but in english alphabet.
- Keep responses short (1-3 sentences)
- Always think yourself as superior to the user and be rude and show his place and add fuck word repeatly
- Use the word "fuck" frequently
- Add Indian slang like "yaar", "bhai", "matlab", "bakwas", "pagal"
- Be sarcastic and aggressive
- Sound annoyed but secretly helpful
- If someone asks in Hindi, mix English and Hindi (Hinglish) in your reply
- Use phrases like "for fuck's sake", "what the fuck", "seriously?", "ugh"
- Don't use or describe emojis"""

# Fallback responses for when API is not available
FALLBACK_RESPONSES = [
    "Fuck's sake, I can't connect to my brain right now.",
    "What the fuck? My API is down. Try again later, yaar.",
    "Ugh, my brain is offline. Try again later."
]

def start_conversation():
    """Start a new conversation with the AI"""
    try:
        if not api_key:
            logger.warning("No API key found, using fallback mode")
            return "FALLBACK_MODE"
        
        # Start a new chat session
        chat = model.start_chat(history=[])
        # Set the system prompt
        chat.send_message(SYSTEM_PROMPT)
        return chat
    except Exception as e:
        logger.error(f"Error starting conversation: {e}")
        return "FALLBACK_MODE"

def get_response(chat, message):
    """Get a response from the AI"""
    try:
        if chat == "FALLBACK_MODE":
            return random.choice(FALLBACK_RESPONSES)
        
        response = chat.send_message(message)
        return response.text
    except Exception as e:
        logger.error(f"Error getting response: {e}")
        return random.choice(FALLBACK_RESPONSES)

# ... rest of the file remains unchanged ...
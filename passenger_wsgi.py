import sys
import os

# Add the current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Import your Flask app
from app import app as application

# Ensure the audio directory exists
audio_dir = os.path.join(current_dir, "static", "audio")
os.makedirs(audio_dir, exist_ok=True) 
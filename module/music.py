import pywhatkit as kit
from module.chat import start_conversation
import asyncio
import random
import time
import webbrowser
from module.voice import speak
import os

# Fallback song recommendations
FALLBACK_SONGS = [
    "Billie Eilish - Bad Guy",
    "Olivia Rodrigo - Drivers License",
    "Taylor Swift - Anti-Hero",
    "Bring Me The Horizon - Throne",
    "My Chemical Romance - Welcome to the Black Parade",
    "girl in red - we fell in love in october",
    "Arctic Monkeys - Do I Wanna Know",
    "Twenty One Pilots - Stressed Out"
]

async def stop_music():
    """Stop music playback by closing the browser"""
    try:
        # Close Chrome browser (most common browser for YouTube)
        os.system("taskkill /F /IM chrome.exe /T")
        await speak("Ugh, fine. Stopping that bakwas music")
        return True
    except Exception as e:
        print(f"Error stopping music: {e}")
        await speak("Fuck, I can't stop the music. Close it yourself!")
        return False

def get_recommended_songs():
    """Get song with attitude"""
    try:
        chat = start_conversation()
        response = chat.send_message(
            "Recommend one random song (any language). Reply ONLY with song name. Add sarcastic comment."
        )
        return response.text.strip()
    except Exception as e:
        asyncio.run(speak("Music recs are so basic anyway"))
        return None

async def play_music(song_name=None):
    """Play music with attitude"""
    try:
        if song_name is None or "recommend" in song_name.lower():
            song = get_recommended_songs()
            if song:
                await speak(f"Ugh, fine. Here's {song}")
                print(f"Playing recommended song: {song}")
                # Get direct YouTube URL
                search_query = f"{song} official music video"
                url = f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"
                webbrowser.open(url)
                return song
        else:
            await speak(f"Whatever... playing {song_name}")
            print(f"Playing requested song: {song_name}")
            # Get direct YouTube URL
            search_query = f"{song_name} official music video"
            url = f"https://www.youtube.com/results?search_query={search_query.replace(' ', '+')}"
            webbrowser.open(url)
            return song_name
            
    except Exception as e:
        print(f"Error playing music: {e}")
        await speak("Fuck, this is so bakwas. Try again?")
        return "Failed to play music"
// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    const micButton = document.getElementById('mic-button');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const voiceWave = document.querySelector('.voice-wave') || document.getElementById('voice-wave');
    const dynamicTextPanel = document.querySelector('.dynamic-text-panel');
    const keyboardToggle = document.getElementById('keyboard-toggle');
    const keyboardContainer = document.getElementById('keyboard-container');
    const micStatus = document.getElementById('mic-status');
    const suggestionContainer = document.getElementById('suggestion-container');
    
    // Global variables for YouTube functionality
    let isYouTubePlaying = false;
    let micWasActiveBeforeYouTube = false;
    
    // Suggestion system
    const suggestions = [
        "Try asking me to play some music",
        "You can use voice commands by clicking the mic",
        "Ask me about anything, I'm here to help",
        "Want to hear a joke? Just ask!",
        "I can help you with coding questions",
        "Try asking about the weather",
        "Need a recipe? I can help with that",
        "Ask me to tell you a story",
        "I can help you plan your day",
        "Try asking for a random fact"
    ];

    // Clear and simple suggestion update function
    function updateSuggestions() {
        const suggestionContainer = document.getElementById('suggestion-container');
        if (!suggestionContainer) return;
        
        suggestionContainer.innerHTML = '';
        
        const count = window.innerWidth > 768 ? 5 : 3;
        const shuffled = [...suggestions].sort(() => 0.5 - Math.random()).slice(0, count);
        
        shuffled.forEach(text => {
            const suggestion = document.createElement('div');
            suggestion.className = 'suggestion';
            suggestion.textContent = text;
            suggestion.addEventListener('click', () => {
                document.getElementById('user-input').value = text;
                document.getElementById('send-button').click();
            });
            suggestionContainer.appendChild(suggestion);
        });
    }

    // Initialize suggestions
    updateSuggestions();
    setInterval(updateSuggestions, 30000);
    
    // Speech recognition setup
    let recognition = null;
    let shouldListen = false;  // Flag to control continuous listening

    function initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = false;

            recognition.onstart = () => {
                console.log('Recognition started');
                voiceWave.classList.add('active');
                micStatus.textContent = 'Listening...';
            };

            recognition.onend = () => {
                console.log('Recognition ended, shouldListen:', shouldListen);
                
                // CRITICAL FIX: Check if manually stopped first
                if (!shouldListen) {
                    console.log("Mic was manually stopped - NOT restarting");
                    voiceWave.classList.remove('active');
                    micButton.classList.remove('active');
                    micStatus.textContent = 'Microphone ready';
                    return; // EXIT IMMEDIATELY - don't restart
                }
                
                // Only restart if shouldListen is still true
                console.log("Auto-restarting mic after browser timeout");
                setTimeout(() => {
                    if (shouldListen) { // Double-check still true
                        try {
                            recognition.start();
                        } catch (e) {
                            console.error('Error restarting recognition:', e);
                            shouldListen = false; // Give up if error
                            voiceWave.classList.remove('active');
                            micButton.classList.remove('active');
                        }
                    }
                }, 500);
            };

            recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                console.log('Recognition result:', text);
                userInput.value = text;
                sendMessage();
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                micStatus.textContent = 'Error: ' + event.error;
            };
        } else {
            micButton.style.display = 'none';
            console.log('Speech recognition not supported');
        }
    }
    
    // Initialize speech recognition
    initSpeechRecognition();
    
    // IMPROVED MIC BUTTON CLICK HANDLER with YouTube awareness
    micButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Reset error states
        micButton.classList.remove('error');
        micStatus.classList.remove('error');
        
        // Hide keyboard if visible
        if (keyboardContainer && keyboardContainer.style.display !== 'none') {
            keyboardContainer.style.display = 'none';
            keyboardToggle.classList.remove('active');
        }
        
        // If YouTube is playing, don't allow immediate mic activation
        if (document.getElementById('youtube-player')) {
            // First click just closes the video
            document.getElementById('youtube-player').remove();
            micStatus.textContent = "Click again to activate microphone";
            return;
        }
        
        // Toggle recognition state directly for better UX
        if (shouldListen) {
            // CLOSE MIC - stop listening immediately
            shouldListen = false;
            console.log("MIC MANUALLY TURNED OFF BY USER");
            
            // Properly stop recognition and update UI
            if (recognition) {
                try {
                    recognition.stop();
                } catch (e) {
                    console.error("Error stopping recognition:", e);
                }
            }
            voiceWave.classList.remove('active');
            micButton.classList.remove('active');
            micStatus.textContent = "Microphone ready";
            return; // Exit early
        }
        
        // OPEN MIC - verify permission then start
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                // Stop tracks immediately (just testing permission)
                stream.getTracks().forEach(track => track.stop());
                
                // Start listening
                if (recognition) {
                    shouldListen = true;
                    recognition.start();
                    voiceWave.classList.add('active');
                    micButton.classList.add('active');
                    micStatus.textContent = "Listening...";
                }
            })
            .catch(err => {
                // Handle errors
                console.error("Microphone permission error:", err);
                micButton.classList.add('error');
                micStatus.classList.add('error');
                micStatus.textContent = "Microphone access denied";
            });
    });
    
    // Handle input changes
    userInput.addEventListener('input', (e) => {
        console.log('Input value:', e.target.value);
    });
    
    // Handle Enter key in input
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', () => {
        sendMessage();
    });
    
    // Keyboard toggle functionality
    keyboardToggle.addEventListener('click', () => {
        if (recognition) {
            recognition.stop();
            shouldListen = false;
        }
        
        if (keyboardContainer.style.display === 'none') {
            keyboardContainer.style.display = 'flex';
            keyboardToggle.classList.add('active');
            userInput.focus();
        } else {
            keyboardContainer.style.display = 'none';
            keyboardToggle.classList.remove('active');
        }
    });
    
    // Function to add message to the panel
    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Check if the message contains code blocks
        if (text.includes('```')) {
            const parts = text.split('```');
            parts.forEach((part, index) => {
                if (index % 2 === 0) {
                    // Regular text
                    const p = document.createElement('p');
                    p.textContent = part;
                    contentDiv.appendChild(p);
                } else {
                    // Code block
                    const [lang, ...codeParts] = part.split('\n');
                    const code = codeParts.join('\n');
                    const codeBlock = document.createElement('div');
                    codeBlock.innerHTML = formatCodeBlock(code, lang.trim() || 'javascript');
                    contentDiv.appendChild(codeBlock);
                }
            });
        } else {
            // Regular message
            const p = document.createElement('p');
            p.textContent = text;
            contentDiv.appendChild(p);
        }
        
        messageDiv.appendChild(contentDiv);
        dynamicTextPanel.appendChild(messageDiv);
        
        // Scroll to bottom
        dynamicTextPanel.scrollTop = dynamicTextPanel.scrollHeight;
        
        // Apply syntax highlighting
        if (window.Prism) {
            Prism.highlightAll();
        }
    }
    
    // Function to format code blocks
    function formatCodeBlock(code, language) {
        return `<pre class="code-block"><code class="language-${language}">${code}</code></pre>`;
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        
        dynamicTextPanel.appendChild(typingDiv);
        dynamicTextPanel.scrollTop = dynamicTextPanel.scrollHeight;
        return typingDiv;
    }
    
    // Remove typing indicator
    function removeTypingIndicator(typingDiv) {
        if (typingDiv) {
            typingDiv.remove();
        }
    }
    
    // Function to play audio response
    function playAudioResponse(audioSrc) {
        if (recognition) {
            shouldListen = false;
            recognition.stop();
        }
        const audio = new Audio(audioSrc);
        audio.play().catch(e => console.error('Error playing audio:', e));
        audio.onended = () => {
            if (recognition) {
                shouldListen = true;
                recognition.start();
                micStatus.textContent = 'Listening...';
            }
        };
    }
    
    // Function to send message
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message to panel
        addMessage(message, 'user');
        userInput.value = '';
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        try {
            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);
            
            // Handle YouTube URLs
            if (data.youtube_url) {
                playYouTubeInPlayer(data.youtube_url, data.youtube_metadata);
                addMessage(data.response, 'bot');
                return;
            }
            
            // Add bot response to panel
            addMessage(data.response, 'bot');
            
            // Play audio if available
            if (data.audio) {
                playAudioResponse(data.audio);
            }
            
        } catch (error) {
            console.error('Error:', error);
            removeTypingIndicator(typingIndicator);
            addMessage('Sorry, something went wrong. Please try again.', 'bot');
        }
    }

    // Add Prism.js for syntax highlighting
    const prismScript = document.createElement('script');
    prismScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js';
    document.head.appendChild(prismScript);

    const prismCss = document.createElement('link');
    prismCss.rel = 'stylesheet';
    prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css';
    document.head.appendChild(prismCss);

    // Add CSS for code blocks
    const style = document.createElement('style');
    style.textContent = `
        .code-block {
            background: #1a1a1a;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            overflow-x: auto;
            font-family: 'Fira Code', monospace;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .code-block code {
            color: #e6e6e6;
        }
        
        .message-content pre {
            margin: 0;
            white-space: pre-wrap;
        }
        
        .message-content p {
            margin: 0 0 10px 0;
        }
        
        .message-content p:last-child {
            margin-bottom: 0;
        }
    `;
    document.head.appendChild(style);

    // YouTube functions

    function stopMic() {
        if (shouldListen) {
            shouldListen = false;
            if (recognition) {
                try {
                    recognition.stop();
                    console.log("Microphone stopped for video playback");
                } catch (e) {
                    console.error("Error stopping recognition:", e);
                }
            }
            voiceWave.classList.remove('active');
            micButton.classList.remove('active');
            micStatus.textContent = "Paused during video";
        }
    }

    function resumeMic() {
        // Only automatically resume if user taps mic button
        micStatus.textContent = "Tap to resume listening";
    }

    function playYouTubeInPlayer(youtubeUrl, metadata = null) {
        console.log("Playing YouTube video:", youtubeUrl);
        
        // Stop mic first
        stopMic();
        
        // Remove any existing player
        let existing = document.getElementById('youtube-player');
        if (existing) existing.remove();

        try {
            // Extract video ID from URL or metadata
            let videoId;
            let videoTitle = 'YouTube Video';
            let channelName = '';
            
            if (metadata && metadata.video_id) {
                videoId = metadata.video_id;
                videoTitle = metadata.title || 'YouTube Video';
                channelName = metadata.channel || '';
            } else {
                // Extract from URL as fallback
                if (youtubeUrl.includes('youtu.be/')) {
                    const parts = youtubeUrl.split('youtu.be/');
                    if (parts.length > 1) {
                        videoId = parts[1].split('?')[0];
                    }
                } else if (youtubeUrl.includes('youtube.com/watch')) {
                    const match = youtubeUrl.match(/v=([^&]+)/);
                    if (match) videoId = match[1];
                } else if (youtubeUrl.includes('youtube.com/embed/')) {
                    const parts = youtubeUrl.split('embed/');
                    if (parts.length > 1) {
                        videoId = parts[1].split('?')[0];
                    }
                }
            }
            
            if (!videoId) {
                throw new Error('Could not extract YouTube video ID');
            }
            
            // Set global state
            isYouTubePlaying = true;

            // Create player container
            const playerDiv = document.createElement('div');
            playerDiv.id = 'youtube-player';
            playerDiv.className = 'youtube-player-container';
            
            // Add HTML with close icon in header
            playerDiv.innerHTML = `
                <div class="player-header">
                    <div class="video-title">${videoTitle}</div>
                    <div class="video-channel">${channelName ? 'by ' + channelName : ''}</div>
                    <button class="close-player-icon" aria-label="Close video player">×</button>
                </div>
                <div class="iframe-container">
                    <iframe 
                        width="100%" 
                        height="180" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
            
            // Add to DOM
            document.querySelector('.dynamic-text-panel').appendChild(playerDiv);
            
            // Add event listener to close button - using the new class name
            document.querySelector('.close-player-icon').addEventListener('click', () => {
                playerDiv.remove();
                isYouTubePlaying = false;
                resumeMic();
            });
            
        } catch (error) {
            console.error("YouTube player error:", error);
            addMessage(`Sorry, I couldn't play that YouTube video: ${error.message}`, 'bot');
            isYouTubePlaying = false;
        }
    }

    // Improved auto-start microphone function
    function autoStartMicrophone() {
        console.log("Auto-starting microphone...");
        
        // Force the active state immediately
        const micButton = document.getElementById('mic-button');
        const micStatus = document.getElementById('mic-status');
        const voiceWave = document.getElementById('voice-wave');
        micButton.classList.add('active');
        micStatus.textContent = "Starting...";
        voiceWave.classList.add('active');
        
        // First initialize recognition if needed
        if (!recognition && 'webkitSpeechRecognition' in window) {
            initSpeechRecognition();
        }
        
        // Request microphone permission and start listening
        navigator.mediaDevices.getUserMedia({audio: true})
            .then(stream => {
                console.log("Microphone permission granted!");
                // Stop the test stream
                stream.getTracks().forEach(track => track.stop());
                
                // Start recognition after a short delay
                setTimeout(() => {
                    if (recognition) {
                        shouldListen = true;
                        try {
                            recognition.start();
                            console.log("Recognition started automatically");
                            micStatus.textContent = "Listening...";
                        } catch (e) {
                            console.error("Error auto-starting recognition:", e);
                            // Try one more time after a delay
                            setTimeout(() => {
                                try {
                                    recognition.start();
                                    shouldListen = true;
                                    micStatus.textContent = "Listening...";
                                } catch (e2) {
                                    console.error("Second attempt failed:", e2);
                                }
                            }, 500);
                        }
                    }
                }, 300);
            })
            .catch(err => {
                console.error("Could not auto-start microphone:", err);
                micButton.classList.remove('active');
                voiceWave.classList.remove('active');
                micStatus.textContent = "Click to enable mic";
            });
    }
    
    // Call auto-start after a brief delay to let the page finish loading
    setTimeout(autoStartMicrophone, 1500);

    // Initialize keyboard visibility
    keyboardContainer.style.display = 'none';

    // Display welcome message
    function showWelcomeMessage() {
        // Clear any existing messages first
        const textPanel = document.querySelector('.dynamic-text-panel');
        textPanel.innerHTML = '';
        
        // Array of rude introduction messages
        const introMessages = [
            "Oh great, you're back. I'm Jessie, your AI assistant or whatever. Need music? Information? I guess I can help, if I HAVE to. Just click the stupid microphone or type something in the box. Try not to ask anything too idiotic.",
            "Ugh, another human. Look, I'm Jessie. I can play music, answer questions, and pretend to care about your problems. What do you want?"
        ];
        
        // Select a random message and display it
        const randomMessage = introMessages[Math.floor(Math.random() * introMessages.length)];
        addMessage(randomMessage, 'bot');
    }

    // Show welcome message
    showWelcomeMessage();
});
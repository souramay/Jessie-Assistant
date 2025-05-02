// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    const micButton = document.getElementById('mic-button');
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const voiceWave = document.getElementById('voice-wave');
    const dynamicTextPanel = document.querySelector('.dynamic-text-panel');
    const keyboardToggle = document.getElementById('keyboard-toggle');
    const keyboardContainer = document.getElementById('keyboard-container');
    const micStatus = document.getElementById('mic-status');
    const suggestionContainer = document.getElementById('suggestion-container');
    
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

    function updateSuggestions() {
        const suggestionElements = suggestionContainer.querySelectorAll('.suggestion');
        const shuffled = [...suggestions].sort(() => 0.5 - Math.random());
        
        suggestionElements.forEach((element, index) => {
            element.textContent = shuffled[index];
            
            // Calculate random position avoiding the center area
            let top, left;
            
            // Determine which corner to place the suggestion
            const corner = Math.floor(Math.random() * 4);
            
            switch(corner) {
                case 0: // Top-left
                    top = Math.random() * 20 + 5; // 5-25%
                    left = Math.random() * 20 + 5; // 5-25%
                    break;
                case 1: // Top-right
                    top = Math.random() * 20 + 5; // 5-25%
                    left = Math.random() * 20 + 75; // 75-95%
                    break;
                case 2: // Bottom-left
                    top = Math.random() * 20 + 75; // 75-95%
                    left = Math.random() * 20 + 5; // 5-25%
                    break;
                case 3: // Bottom-right
                    top = Math.random() * 20 + 75; // 75-95%
                    left = Math.random() * 20 + 75; // 75-95%
                    break;
            }
            
            element.style.top = `${top}%`;
            element.style.left = `${left}%`;
            
            // Force opacity to 0 to restart animation
            element.style.opacity = '0';
            // Trigger reflow
            element.offsetHeight;
            // Start animation
            element.style.opacity = '0.6';
        });
    }

    // Initialize suggestions immediately
    updateSuggestions();
    
    // Update suggestions every 30 seconds
    setInterval(updateSuggestions, 30000);
    
    let isListening = false;
    let recognition = null;
    let lastStatusMessage = '';
    
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let animationFrameId = null;
    
    // Add flags to track input states
    let isProcessingResponse = false;
    let isInputDisabled = false;
    
    // Add message history tracking
    let messageHistory = [];
    const MAX_HISTORY = 5; // Keep last 5 messages for context
    
    // Ensure input field is properly initialized
    if (userInput) {
        userInput.value = ''; // Clear any existing value
        userInput.disabled = false; // Ensure input is enabled
        userInput.placeholder = 'Type your message...'; // Set placeholder
        
        // Handle input changes
        userInput.addEventListener('input', (e) => {
            console.log('Input value:', e.target.value); // Debug log
        });
        
        // Handle Enter key in input
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent default form submission
                console.log('Enter pressed, current value:', userInput.value); // Debug log
                sendMessage();
            }
        });
    } else {
        console.error('Input field not found!'); // Debug log
    }
    
    // Handle send button click
    if (sendButton) {
        sendButton.addEventListener('click', () => {
            console.log('Send button clicked'); // Debug log
            sendMessage();
        });
    }
    
    // Function to disable/enable inputs
    function setInputState(disabled) {
        isInputDisabled = disabled;
        if (userInput) {
            userInput.disabled = disabled;
            userInput.placeholder = disabled ? 'Please wait...' : 'Type your message...';
        }
        if (micButton) {
            micButton.disabled = disabled;
            micButton.style.opacity = disabled ? '0.5' : '1';
        }
        if (sendButton) {
            sendButton.disabled = disabled;
            sendButton.style.opacity = disabled ? '0.5' : '1';
        }
    }
    
    // Function to add message to history
    function addToHistory(message, type) {
        messageHistory.push({ text: message, type: type });
        if (messageHistory.length > MAX_HISTORY) {
            messageHistory.shift(); // Remove oldest message
        }
    }

    // Function to get context from history
    function getContext() {
        return messageHistory.map(msg => `${msg.type}: ${msg.text}`).join('\n');
    }
    
    // Add Prism.js for syntax highlighting
    const prismScript = document.createElement('script');
    prismScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/prism.min.js';
    document.head.appendChild(prismScript);

    const prismCss = document.createElement('link');
    prismCss.rel = 'stylesheet';
    prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.24.1/themes/prism-tomorrow.min.css';
    document.head.appendChild(prismCss);

    // Function to format code blocks
    function formatCodeBlock(code, language) {
        return `<pre class="code-block"><code class="language-${language}">${code}</code></pre>`;
    }

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
    
    // Voice wave animation
    function animateVoiceWave() {
        const wave = voiceWave.querySelector('.wave');
        if (isListening) {
            voiceWave.classList.add('active');
            voiceWave.classList.remove('processing', 'error');
        } else {
            voiceWave.classList.remove('active', 'processing', 'error');
        }
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        
        // Add three bouncing dots
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

    // Initialize audio context
    function initializeAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
        }
    }

    // Initialize voice recognition
    function initializeVoiceRecognition() {
        if ('webkitSpeechRecognition' in window) {
            recognition = new webkitSpeechRecognition();
            
            // Basic configuration
            recognition.continuous = true;  // Changed back to true for continuous listening
            recognition.interimResults = false;  // Keep false to only process final results
            recognition.lang = 'en-US';
            recognition.maxAlternatives = 1;

            recognition.onstart = () => {
                console.log('Voice recognition started');
                isListening = true;
                micButton.classList.add('active');
                voiceWave.classList.add('active');
                updateMicStatus('active', 'Listening...');
                startAudioVisualization();
            };

            recognition.onresult = (event) => {
                console.log('Voice recognition result received');
                const transcript = event.results[0][0].transcript;
                console.log('Transcript:', transcript);
                
                if (transcript) {
                    processVoiceInput(transcript);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                updateMicStatus('error', `Error: ${event.error}`);
                stopAudioVisualization();
                
                // Handle specific errors
                switch(event.error) {
                    case 'no-speech':
                        updateMicStatus('error', 'No speech detected');
                        break;
                    case 'audio-capture':
                        updateMicStatus('error', 'Microphone not found');
                        break;
                    case 'not-allowed':
                        updateMicStatus('error', 'Microphone access denied');
                        break;
                    default:
                        updateMicStatus('error', 'Voice recognition error');
                }
                
                // Only restart if it's a recoverable error
                if (event.error !== 'not-allowed' && event.error !== 'audio-capture') {
                    setTimeout(() => {
                        if (!recognition.manualStop) {
                            console.log('Restarting recognition after error');
                            recognition.start();
                        }
                    }, 2000);
                }
            };

            recognition.onend = () => {
                console.log('Voice recognition ended');
                if (!recognition.manualStop) {
                    isListening = false;
                    micButton.classList.remove('active');
                    voiceWave.classList.remove('active');
                    updateMicStatus('inactive', 'Click to start');
                    stopAudioVisualization();
                    
                    // Only auto-restart if it's not a manual stop
                    if (!recognition.manualStop) {
                        console.log('Auto-restarting recognition');
                        setTimeout(() => {
                            if (!recognition.manualStop) {
                                recognition.start();
                            }
                        }, 1000);  // Increased delay to prevent rapid cycling
                    }
                }
            };
        } else {
            console.error('Speech recognition not supported');
            updateMicStatus('error', 'Voice recognition not supported');
        }
    }

    // Start audio visualization
    function startAudioVisualization() {
        // First, stop any existing audio processing
        stopAudioVisualization();
        
        // Create a new audio context for microphone
        const micAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Get microphone stream with strict constraints
        navigator.mediaDevices.getUserMedia({ 
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                suppressLocalAudioPlayback: true,
                sampleRate: 44100,
                channelCount: 1,
                sampleSize: 16,
                volume: 1.0,
                latency: 0,
                echoCancellationType: 'system',
                googEchoCancellation: true,
                googAutoGainControl: true,
                googNoiseSuppression: true,
                googHighpassFilter: true,
                googAudioMirroring: false
            }
        })
            .then(stream => {
                // Create microphone source
                microphone = micAudioContext.createMediaStreamSource(stream);
                
                // Create analyser for visualization
                analyser = micAudioContext.createAnalyser();
                analyser.fftSize = 256;
                
                // Create a gain node to control microphone volume
                const gainNode = micAudioContext.createGain();
                gainNode.gain.value = 1.0;
                
                // Connect the audio chain
                microphone.connect(gainNode);
                gainNode.connect(analyser);
                
                // Start visualization
                animateWave();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                updateMicStatus('error', 'Microphone access error');
            });
    }

    // Stop audio visualization
    function stopAudioVisualization() {
        if (microphone) {
            try {
            microphone.disconnect();
            microphone = null;
            } catch (e) {
                console.error('Error disconnecting microphone:', e);
            }
        }
        if (analyser) {
            try {
                analyser.disconnect();
                analyser = null;
            } catch (e) {
                console.error('Error disconnecting analyser:', e);
            }
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (audioContext) {
            try {
                audioContext.close();
                audioContext = null;
            } catch (e) {
                console.error('Error closing audio context:', e);
            }
        }
    }

    // Animate wave based on audio input
    function animateWave() {
        const wave = document.querySelector('.wave');
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        function updateWave() {
            analyser.getByteFrequencyData(dataArray);
            
            // Calculate average amplitude
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            
            // Map amplitude to wave properties
            const scale = 1 + (average / 128) * 0.5;
            const rotation = (average / 128) * 5;
            
            // Apply transformations to wave elements
            const waveElements = wave.querySelectorAll('.wave-line-1, .wave-line-2, .wave-line-3');
            waveElements.forEach((element, index) => {
                const delay = index * 0.1;
                element.style.transform = `
                    scaleX(${scale}) 
                    translateY(${Math.sin(Date.now() * 0.005 + delay) * 10}px) 
                    rotate(${rotation}deg)
                `;
                element.style.opacity = 0.3 + (average / 128) * 0.7;
            });
            
            animationFrameId = requestAnimationFrame(updateWave);
        }
        
        updateWave();
    }

    // Update microphone status
    function updateMicStatus(status, message) {
        const micButton = document.querySelector('.mic-button');
        const micStatus = document.querySelector('.mic-status');
        const listeningStatus = document.querySelector('.listening-status');
        
        if (micButton && micStatus) {
            micButton.className = 'mic-button ' + status;
            micStatus.className = 'mic-status ' + status;
            micStatus.textContent = message;
            
            if (listeningStatus) {
                listeningStatus.textContent = message;
                listeningStatus.className = 'listening-status ' + status;
            }
            
            // Update voice wave state
            const voiceWave = document.querySelector('.voice-wave');
            if (voiceWave) {
                voiceWave.className = 'voice-wave ' + status;
            }
        }
    }
    
    // Update text panel with a message
    function updateTextPanel(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} new`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const p = document.createElement('p');
        p.textContent = text;
        
        contentDiv.appendChild(p);
        messageDiv.appendChild(contentDiv);
        dynamicTextPanel.appendChild(messageDiv);
        
        // Scroll to bottom
        dynamicTextPanel.scrollTop = dynamicTextPanel.scrollHeight;
        
        // Remove 'new' class after animation
            setTimeout(() => {
            messageDiv.classList.remove('new');
        }, 300);
    }

    // Function to play audio response
    function playAudioResponse(audioSrc) {
        return new Promise((resolve) => {
            const audio = new Audio(audioSrc);
            
            // Create audio context for better quality
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audio);
            
            // Create audio processing chain
            const filter = audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = 1000;  // Adjusted for better voice clarity
            filter.Q.value = 0.5;          // Reduced Q for less resonance
            filter.gain.value = 1.0;       // Reduced gain to prevent echo

            // Add equalizer for better voice quality
            const eq = audioContext.createBiquadFilter();
            eq.type = 'lowshelf';
            eq.frequency.value = 200;      // Better bass response
            eq.gain.value = 1.0;           // Balanced low frequencies

            // Add high-shelf filter for clarity
            const highShelf = audioContext.createBiquadFilter();
            highShelf.type = 'highshelf';
            highShelf.frequency.value = 4000;  // Higher frequency for clarity
            highShelf.gain.value = 0.8;        // Reduced gain to prevent echo

            // Add compressor for more natural voice
            const compressor = audioContext.createDynamicsCompressor();
            compressor.threshold.value = -20;   // Lower threshold for better control
            compressor.knee.value = 4;          // Sharper knee for less echo
            compressor.ratio.value = 4;         // Less aggressive compression
            compressor.attack.value = 0.003;    // Slightly faster attack
            compressor.release.value = 0.1;     // Faster release

            // Add limiter to prevent distortion
            const limiter = audioContext.createDynamicsCompressor();
            limiter.threshold.value = -3;       // Prevent clipping
            limiter.knee.value = 0;             // Hard knee
            limiter.ratio.value = 20;           // Strong limiting
            limiter.attack.value = 0.001;       // Fast attack
            limiter.release.value = 0.1;        // Fast release

            // Connect the audio processing chain
            source.connect(filter);
            filter.connect(eq);
            eq.connect(highShelf);
            highShelf.connect(compressor);
            compressor.connect(limiter);
            limiter.connect(audioContext.destination);

            // Set optimal playback settings
            audio.playbackRate = 1.0;     // Normal speed
            audio.volume = 0.9;           // Slightly reduced volume for clarity

            // Handle audio events
            audio.onended = () => {
                console.log('Audio finished playing');
                resolve();
            };

            audio.onerror = (error) => {
                console.error('Audio playback error:', error);
                resolve();
            };

            // Start playback
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
                resolve();
            });
        });
    }

    // Function to clean up all audio contexts
    function cleanupAllAudio() {
        // Clean up microphone
        stopAudioVisualization();
        
        // Clean up all YouTube audio contexts
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
            if (element.youtubeAudioContext) {
                try {
                    element.youtubeAudioContext.close();
                    element.youtubeAudioContext = null;
                } catch (e) {
                    console.error('Error closing YouTube audio context:', e);
                }
            }
        });
    }

    // Add event listener for tab close
    window.addEventListener('beforeunload', () => {
        cleanupAllAudio();
    });

    // Add event listener for page visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cleanupAllAudio();
        }
    });

    // Function to enhance YouTube audio
    function enhanceYouTubeAudio() {
        // Find all audio elements on the page
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
            if (element.src.includes('youtube.com') && !element.youtubeAudioContext) {
                try {
                    // Stop any existing audio visualization
                    stopAudioVisualization();
                    
                    // Create a new audio context for YouTube
                    const youtubeAudioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const source = youtubeAudioContext.createMediaElementSource(element);
                    
                    // Create audio processing chain for YouTube
                    const eq = youtubeAudioContext.createBiquadFilter();
                    eq.type = 'lowshelf';
                    eq.frequency.value = 200;      // Better bass response
                    eq.gain.value = 2.0;           // Boosted low frequencies
                    
                    const highShelf = youtubeAudioContext.createBiquadFilter();
                    highShelf.type = 'highshelf';
                    highShelf.frequency.value = 4000;  // Higher frequency for clarity
                    highShelf.gain.value = 1.5;        // Boosted high frequencies
                    
                    const compressor = youtubeAudioContext.createDynamicsCompressor();
                    compressor.threshold.value = -24;   // Lower threshold for better control
                    compressor.knee.value = 6;          // Softer knee for smoother compression
                    compressor.ratio.value = 4;         // Less aggressive compression
                    compressor.attack.value = 0.003;    // Slightly faster attack
                    compressor.release.value = 0.1;      // Faster release
                    
                    // Add limiter to prevent distortion
                    const limiter = youtubeAudioContext.createDynamicsCompressor();
                    limiter.threshold.value = -3;       // Prevent clipping
                    limiter.knee.value = 0;             // Hard knee
                    limiter.ratio.value = 20;           // Strong limiting
                    limiter.attack.value = 0.001;       // Fast attack
                    limiter.release.value = 0.1;        // Fast release
                    
                    // Connect the audio processing chain
                    source.connect(eq);
                    eq.connect(highShelf);
                    highShelf.connect(compressor);
                    compressor.connect(limiter);
                    limiter.connect(youtubeAudioContext.destination);
                    
                    // Set optimal playback settings
                    element.volume = 1.0;           // Full volume
                    
                    // Store the audio context for cleanup
                    element.youtubeAudioContext = youtubeAudioContext;
                    
                    // Add error handling
                    element.onerror = (error) => {
                        console.error('YouTube audio error:', error);
                        if (element.youtubeAudioContext) {
                            try {
                                element.youtubeAudioContext.close();
                                element.youtubeAudioContext = null;
                            } catch (e) {
                                console.error('Error closing YouTube audio context:', e);
                            }
                        }
                    };
                } catch (error) {
                    console.error('Error enhancing YouTube audio:', error);
                }
            }
        });
    }

    // Add event listener for YouTube iframe
    window.addEventListener('message', (event) => {
        if (event.origin.includes('youtube.com')) {
            enhanceYouTubeAudio();
        }
    });

    // Periodically check for new YouTube audio elements
    setInterval(() => {
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => {
            if (element.src.includes('youtube.com') && !element.youtubeAudioContext) {
                enhanceYouTubeAudio();
            }
        });
    }, 1000);

    // Function to send message
    async function sendMessage() {
        if (isProcessingResponse || isInputDisabled) {
            console.log('Input is disabled, please wait...');
            return;
        }

        if (!userInput) {
            console.error('Input field not found!');
            return;
        }

        const message = userInput.value.trim();
        if (!message) return;

        isProcessingResponse = true;
        setInputState(true);
        
        try {
            // Add user message to the chat panel and history
        addMessage(message, 'user');
            addToHistory(message, 'user');
            
            // Clear input field
        userInput.value = '';
        
            // Show typing indicator
            const typingIndicator = showTypingIndicator();
            
            const response = await fetch('/api/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
                body: JSON.stringify({ 
                    message,
                    context: getContext(),
                    voice_settings: {
                        accent: 'indian',
                        speed: 1.0,
                        pitch: 1.0,
                        voice_quality: 'high',
                        emphasis: 'natural',
                        clarity: 'high',
                        prosody: {
                            rate: 'medium',
                            pitch: 'medium',
                            volume: 'medium'
                        },
                        pronunciation: {
                            clarity: 'high',
                            emphasis: 'natural',
                            style: 'conversational'
                        }
                    },
                    response_settings: {
                        coherence: 'high',
                        context_aware: true,
                        avoid_random: true,
                        format_code: true
                    }
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);
            
            // Add bot response
            if (data.response) {
            addMessage(data.response, 'bot');
                addToHistory(data.response, 'bot');
                
                // Play audio if available and wait for it to finish
            if (data.audio) {
                    await playAudioResponse(data.audio);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage("Sorry, something went wrong. Please try again.", 'bot');
        } finally {
            isProcessingResponse = false;
            setInputState(false);
            // Automatically restart listening after response
            if (recognition && !isListening) {
                recognition.manualStop = false;
                recognition.start();
            }
        }
    }

    // Process voice input
    async function processVoiceInput(text) {
        if (isProcessingResponse || isInputDisabled) {
            console.log('Input is disabled, please wait...');
            return;
        }

        if (!text.trim()) {
            console.log('Empty voice input received');
            return;
        }
        
        console.log('Processing voice input:', text);
        isProcessingResponse = true;
        setInputState(true);
        
        try {
            // Update UI with user's speech
            addMessage(text, 'user');
            addToHistory(text, 'user');
            
            // Show typing indicator
            const typingIndicator = showTypingIndicator();
            
            // Send to server
            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: text,
                    context: getContext(),
                    voice_settings: {
                        accent: 'indian',
                        speed: 1.0,
                        pitch: 1.0,
                        voice_quality: 'high',
                        emphasis: 'natural',
                        clarity: 'high',
                        prosody: {
                            rate: 'medium',
                            pitch: 'medium',
                            volume: 'medium'
                        },
                        pronunciation: {
                            clarity: 'high',
                            emphasis: 'natural',
                            style: 'conversational'
                        }
                    },
                    response_settings: {
                        coherence: 'high',
                        context_aware: true,
                        avoid_random: true,
                        format_code: true
                    }
                })
            });
            
            const data = await response.json();
            
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);
            
            if (data.response) {
                addMessage(data.response, 'bot');
                addToHistory(data.response, 'bot');
                
                // Play audio if available and wait for it to finish
                if (data.audio) {
                    await playAudioResponse(data.audio);
                }
            }
        } catch (error) {
            console.error('Error processing voice input:', error);
            addMessage("Sorry, I couldn't process that request.", 'bot');
        } finally {
            isProcessingResponse = false;
            setInputState(false);
            // Automatically restart listening after response
            if (recognition && !isListening) {
                recognition.manualStop = false;
                recognition.start();
            }
        }
    }

    // Add giggle effect to wave
    function giggleWave() {
        voiceWave.classList.add('giggle');
        
        // Remove giggle class after animation completes
        setTimeout(() => {
            voiceWave.classList.remove('giggle');
            // Add a subtle bounce after giggle
            voiceWave.classList.add('bounce');
            setTimeout(() => {
                voiceWave.classList.remove('bounce');
            }, 500);
        }, 300);
    }

    // Toggle microphone
    function toggleMicrophone() {
        if (!recognition) return;
        
        if (isListening) {
            recognition.manualStop = true;
            recognition.stop();
        } else {
            recognition.manualStop = false;
            recognition.start();
        }
    }

    // Add mic button click event
    if (micButton) {
        micButton.addEventListener('click', () => {
            toggleMicrophone();
        });
    }

    // Start listening function
    function startListening() {
        if (recognition) {
            try {
                console.log('Attempting to start recognition');
                recognition.manualStop = false;
                recognition.start();
                console.log('Recognition started successfully');
            } catch (error) {
                console.error('Error starting recognition:', error);
                updateMicStatus('error', 'Failed to start listening');
                // Try to reinitialize if there's an error
                initializeVoiceRecognition();
                setTimeout(() => {
                    if (recognition) {
                        recognition.start();
                    }
                }, 2000);  // Increased delay
            }
        } else {
            console.error('Recognition not initialized');
            // Try to initialize if not already done
            initializeVoiceRecognition();
            setTimeout(() => {
                if (recognition) {
                    recognition.start();
                }
            }, 2000);  // Increased delay
        }
    }

    // Initialize voice recognition when the page loads
    initializeVoiceRecognition();
    
    // Start listening after a longer delay to ensure initialization is complete
    setTimeout(() => {
        console.log('Starting initial recognition');
        startListening();
    }, 2000);  // Increased delay

    // Handle visibility change (tab change)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Tab is hidden, stop listening and release microphone
            if (recognition && isListening) {
                recognition.manualStop = true;
                recognition.stop();
                    isListening = false;
                    micButton.classList.remove('active');
                    voiceWave.classList.remove('active');
                updateMicStatus('inactive', 'Click to start');
                stopAudioVisualization();
                
                // Release microphone stream
                if (microphone) {
                    microphone.disconnect();
                    microphone = null;
                }
                
                // Stop any active audio context
                if (audioContext) {
                    audioContext.close();
                    audioContext = null;
        }
    }
        }
    });

    // Handle page unload (redirect)
    window.addEventListener('beforeunload', () => {
        if (recognition && isListening) {
            recognition.manualStop = true;
            recognition.stop();
            isListening = false;
            micButton.classList.remove('active');
            voiceWave.classList.remove('active');
            updateMicStatus('inactive', 'Click to start');
            stopAudioVisualization();
            
            // Release microphone stream
            if (microphone) {
                microphone.disconnect();
                microphone = null;
            }
            
            // Stop any active audio context
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
            
            // Store the state that we're redirecting
            sessionStorage.setItem('isRedirecting', 'true');
        }
    });

    // Check if we're returning from a redirect
    if (sessionStorage.getItem('isRedirecting') === 'true') {
        sessionStorage.removeItem('isRedirecting');
        // Ensure microphone is off and requires manual activation
        if (recognition) {
            recognition.manualStop = true;
            recognition.stop();
            isListening = false;
            micButton.classList.remove('active');
            voiceWave.classList.remove('active');
            updateMicStatus('inactive', 'Click to start');
            stopAudioVisualization();
            
            // Release microphone stream
            if (microphone) {
                microphone.disconnect();
                microphone = null;
            }
            
            // Stop any active audio context
            if (audioContext) {
                audioContext.close();
                audioContext = null;
            }
        }
    }

    // Initialize keyboard visibility
    keyboardContainer.style.display = 'none';

    // Keyboard toggle functionality
    keyboardToggle.addEventListener('click', () => {
        if (isProcessingResponse || isInputDisabled) {
            console.log('Input is disabled, please wait...');
            return;
        }

        if (isListening) {
            stopListening();
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

    // Microphone toggle functionality
    micButton.addEventListener('click', () => {
        if (isProcessingResponse || isInputDisabled) {
            console.log('Input is disabled, please wait...');
            return;
        }

        if (keyboardContainer.style.display !== 'none') {
            keyboardContainer.style.display = 'none';
            keyboardToggle.classList.remove('active');
        }
        
        if (!isListening) {
            startListening();
        } else {
            stopListening();
        }
    });

    // Stop listening function
    function stopListening() {
        if (recognition) {
            console.log('Stopping recognition');
            recognition.manualStop = true;
            recognition.stop();
        isListening = false;
        micButton.classList.remove('active');
        voiceWave.classList.remove('active');
            updateMicStatus('inactive', 'Click to start');
            stopAudioVisualization();
        }
    }

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
});
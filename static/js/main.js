// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing application...');
    const micButton = document.getElementById('mic-button');
    const keyboardToggle = document.getElementById('keyboard-toggle');
    const keyboardContainer = document.getElementById('keyboard-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const voiceWave = document.getElementById('voice-wave');
    const dynamicTextPanel = document.querySelector('.dynamic-text-panel');
    
    let isListening = false;
    let isKeyboardVisible = false;
    let recognition = null;
    let lastStatusMessage = '';
    let micPermissionGranted = false;
    
    let audioContext = null;
    let analyser = null;
    let microphone = null;
    let animationFrameId = null;
    
    // Toggle keyboard visibility
    keyboardToggle.addEventListener('click', () => {
        isKeyboardVisible = !isKeyboardVisible;
        keyboardContainer.classList.toggle('visible', isKeyboardVisible);
        keyboardToggle.style.transform = isKeyboardVisible ? 'rotate(180deg)' : 'rotate(0)';
    });
    
    // Handle mic button click
    micButton.addEventListener('click', async () => {
        if (!micPermissionGranted) {
            const hasPermission = await requestMicrophonePermission();
            if (hasPermission) {
                initializeVoiceRecognition();
            }
        } else {
            toggleMicrophone();
        }
    });
    
    // Handle send button click
    sendButton.addEventListener('click', sendMessage);
    
    // Handle Enter key in input
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Function to send message
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        // Add user message
        addMessage(message, 'user');
        userInput.value = '';
        
        try {
            const response = await fetch('/api/send_message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            const data = await response.json();
            
            // Add bot response
            if (data.response) {
                addMessage(data.response, 'bot');
                
                // Play audio if available
                if (data.audio) {
                    const audio = new Audio(data.audio);
                    audio.play();
                }
            }
        } catch (error) {
            console.error('Error:', error);
            addMessage("Sorry, something went wrong. Please try again.", 'bot');
        }
    }
    
    // Function to add message to the panel
    function addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const p = document.createElement('p');
        p.textContent = text;
        
        contentDiv.appendChild(p);
        messageDiv.appendChild(contentDiv);
        dynamicTextPanel.appendChild(messageDiv);
        
        // Scroll to bottom
        dynamicTextPanel.scrollTop = dynamicTextPanel.scrollHeight;
    }
    
    // Voice wave animation
    function animateVoiceWave() {
        const wave = voiceWave.querySelector('.wave');
        if (isListening) {
            voiceWave.classList.add('active');
            voiceWave.classList.remove('processing', 'error');
            // Add more dynamic wave effect when listening
            const waveElements = wave.querySelectorAll('::before, ::after');
            waveElements.forEach((element, index) => {
                const delay = index * 0.2;
                element.style.animation = `listeningWave ${0.5 + delay}s ease-in-out infinite`;
                element.style.filter = `blur(${6 + index * 2}px) drop-shadow(0 0 15px var(--accent-cyan))`;
            });
        } else {
            voiceWave.classList.remove('active', 'processing', 'error');
            // Return to ambient wave animation
            const waveElements = wave.querySelectorAll('::before, ::after');
            waveElements.forEach((element, index) => {
                const delay = index * 0.5;
                element.style.animation = `ambientWave ${4 + delay}s ease-in-out infinite`;
                element.style.filter = `blur(${8 + index * 2}px) drop-shadow(0 0 10px var(--accent-cyan))`;
            });
        }
    }
    
    // Set processing state
    function setProcessingState() {
        voiceWave.classList.add('processing');
        voiceWave.classList.remove('active', 'error');
        const wave = voiceWave.querySelector('.wave');
        const waveElements = wave.querySelectorAll('::before, ::after');
        waveElements.forEach((element, index) => {
            element.style.animation = `processingWave ${1 + index * 0.2}s ease-in-out infinite`;
        });
    }
    
    // Set error state
    function setErrorState() {
        voiceWave.classList.add('error');
        voiceWave.classList.remove('active', 'processing');
        const wave = voiceWave.querySelector('.wave');
        const waveElements = wave.querySelectorAll('::before, ::after');
        waveElements.forEach((element) => {
            element.style.animation = 'errorWave 0.3s ease-in-out';
        });
        // Return to ambient state after error animation
        setTimeout(() => {
            voiceWave.classList.remove('error');
            animateVoiceWave();
        }, 1000);
    }
    
    // Add organic movement
    function addOrganicMovement() {
        const wave = voiceWave.querySelector('.wave');
        const randomScale = 0.8 + Math.random() * 0.4;
        const randomRotate = (Math.random() - 0.5) * 10;
        const randomTranslateX = (Math.random() - 0.5) * 30;
        const randomTranslateY = (Math.random() - 0.5) * 20;
        
        wave.style.transform = `
            scale(${randomScale}) 
            translate(${randomTranslateX}px, ${randomTranslateY}px) 
            rotate(${randomRotate}deg)
        `;
    }
    
    // Update wave animation periodically when not listening
    let waveInterval;
    function startWaveAnimation() {
        if (!isListening) {
            waveInterval = setInterval(addOrganicMovement, 3000);
        }
    }
    
    function stopWaveAnimation() {
        clearInterval(waveInterval);
    }
    
    // Initialize wave animation
    startWaveAnimation();
    
    // Add subtle continuous movement
    let subtleInterval = setInterval(() => {
        if (!isListening && !voiceWave.classList.contains('processing') && !voiceWave.classList.contains('error')) {
            const wave = voiceWave.querySelector('.wave');
            const subtleScale = 0.95 + Math.random() * 0.1;
            const subtleRotate = (Math.random() - 0.5) * 2;
            wave.style.transform = `
                scale(${subtleScale}) 
                rotate(${subtleRotate}deg)
            `;
        }
    }, 1000);

    function initializeAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
        }
    }

    function startAudioVisualization() {
        if (!audioContext) {
            initializeAudioContext();
        }

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                animateWave();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                updateMicStatus('error', 'Microphone error');
            });
    }

    function stopAudioVisualization() {
        if (microphone) {
            microphone.disconnect();
            microphone = null;
        }
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

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
            const scale = 1 + (average / 128) * 0.5; // Scale factor for wave height
            const rotation = (average / 128) * 5; // Rotation based on amplitude
            
            // Apply transformations to wave elements
            const waveElements = wave.querySelectorAll('::before, ::after, .wave-line-1, .wave-line-2, .wave-line-3');
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

    function updateVoiceWave(isActive) {
        const voiceWave = document.getElementById('voice-wave');
        if (isActive) {
            voiceWave.classList.add('active');
            voiceWave.classList.remove('processing', 'error');
            startAudioVisualization();
        } else {
            voiceWave.classList.remove('active', 'processing', 'error');
            stopAudioVisualization();
        }
    }

    function setProcessingState() {
        const voiceWave = document.getElementById('voice-wave');
        voiceWave.classList.add('processing');
        voiceWave.classList.remove('active', 'error');
        stopAudioVisualization();
    }

    function setErrorState() {
        const voiceWave = document.getElementById('voice-wave');
        voiceWave.classList.add('error');
        voiceWave.classList.remove('active', 'processing');
        stopAudioVisualization();
        
        // Return to idle state after error animation
        setTimeout(() => {
            voiceWave.classList.remove('error');
            updateVoiceWave(false);
        }, 1000);
    }

    async function requestMicrophonePermission() {
        try {
            // First check if we already have permission
            const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
            
            if (permissionStatus.state === 'granted') {
                micPermissionGranted = true;
                return true;
            }
            
            // If we don't have permission, request it
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            // Stop the stream after getting permission
            stream.getTracks().forEach(track => track.stop());
            micPermissionGranted = true;
            return true;
        } catch (error) {
            console.error('Microphone permission error:', error);
            micPermissionGranted = false;
            return false;
        }
    }

    async function initializeVoiceRecognition() {
        try {
            // Request microphone permission first
            const hasPermission = await requestMicrophonePermission();
            
            if (!hasPermission) {
                updateTextPanel('Microphone access is required for voice input. Please allow microphone access in your browser settings.', 'system');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                    recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-US';
                recognition.maxAlternatives = 1;

                // Update microphone status
                function updateMicStatus(status, message) {
                    const micButton = document.querySelector('.mic-button');
                    const micStatus = document.querySelector('.mic-status');
                    
                    if (micButton && micStatus) {
                        micButton.className = 'mic-button ' + status;
                        micStatus.className = 'mic-status ' + status;
                        micStatus.textContent = message;
                        
                        // Only show new status message if it's different from the last one
                        if (message !== lastStatusMessage) {
                            lastStatusMessage = message;
                            updateTextPanel(message, 'system');
                        }
                    }
                }
                    
                    recognition.onstart = () => {
                        isListening = true;
                    updateMicStatus('active', 'Listening...');
                    document.querySelector('.voice-wave').classList.add('active');
                    };
                    
                    recognition.onend = () => {
                        isListening = false;
                    updateMicStatus('inactive', 'Click to start listening');
                    document.querySelector('.voice-wave').classList.remove('active');
                    
                    // Only restart if we have permission and it wasn't manually stopped
                    if (micPermissionGranted && recognition && !recognition.manualStop) {
                        setTimeout(() => {
                            if (!isListening) {
                                recognition.start();
                            }
                        }, 100);
                        }
                    };
                    
                    recognition.onerror = (event) => {
                    isListening = false;
                    let errorMessage = 'Microphone error';
                    
                        switch(event.error) {
                        case 'no-speech':
                            errorMessage = 'No speech detected';
                                break;
                        case 'aborted':
                            errorMessage = 'Listening aborted';
                                break;
                            case 'audio-capture':
                            errorMessage = 'No microphone detected';
                            break;
                        case 'network':
                            errorMessage = 'Network error';
                            break;
                        case 'not-allowed':
                        case 'permission-denied':
                            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
                            micPermissionGranted = false;
                            break;
                        case 'service-not-allowed':
                            errorMessage = 'Speech recognition service not allowed';
                                break;
                            default:
                            errorMessage = `Error: ${event.error}`;
                    }
                    
                    updateMicStatus('error', errorMessage);
                    document.querySelector('.voice-wave').classList.remove('active');
                };

                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0].transcript)
                        .join('');
                    
                    if (event.results[0].isFinal) {
                        processVoiceInput(transcript);
                        giggleWave();
                    } else if (transcript.trim().length > 0) {
                        // Only show interim results if they're different from the last one
                        const lastMessage = document.querySelector('.message:last-child .message-content p');
                        if (!lastMessage || lastMessage.textContent !== transcript) {
                            updateTextPanel(transcript, 'user');
                        }
                    }
                };

                // Start recognition only if we have permission
                if (micPermissionGranted) {
                    recognition.start();
                }
            } else {
                updateTextPanel('Speech recognition not supported in this browser', 'system');
            }
        } catch (error) {
            console.error('Microphone initialization error:', error);
            let errorMessage = 'Error accessing microphone';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
                micPermissionGranted = false;
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone detected. Please connect a microphone and try again.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Microphone is busy. Please close other applications using the microphone.';
            }
            
            updateTextPanel(errorMessage, 'system');
        }
    }

    function updateTextPanel(text, type) {
        const panel = document.querySelector('.dynamic-text-panel');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} new`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const p = document.createElement('p');
        p.textContent = text;
        
        contentDiv.appendChild(p);
        messageDiv.appendChild(contentDiv);
        panel.appendChild(messageDiv);
        
        // Scroll to bottom
        panel.scrollTop = panel.scrollHeight;
        
        // Remove 'new' class after animation
        setTimeout(() => {
            messageDiv.classList.remove('new');
        }, 300);
    }

    function showTypingIndicator() {
        const panel = document.querySelector('.dynamic-text-panel');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        
        // Add three bouncing dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'typing-dot';
            typingDiv.appendChild(dot);
        }
        
        panel.appendChild(typingDiv);
        panel.scrollTop = panel.scrollHeight;
        return typingDiv;
    }

    function removeTypingIndicator(typingDiv) {
        if (typingDiv) {
            typingDiv.remove();
        }
    }

    function processVoiceInput(text) {
        if (!text.trim()) return;
        
        // Update UI with user's speech
        updateTextPanel(text, 'user');
        giggleWave();
        
        // Show typing indicator
        const typingIndicator = showTypingIndicator();
        
        // Send to server
        fetch('/api/send_message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: text })
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            removeTypingIndicator(typingIndicator);
            
            if (data.response) {
                updateTextPanel(data.response, 'assistant');
                giggleWave();
                if (data.audio) {
                    playAudioResponse(data.audio);
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            removeTypingIndicator(typingIndicator);
            updateTextPanel("Sorry, I couldn't process that request.", 'assistant');
        });
    }

    function giggleWave() {
        const voiceWave = document.getElementById('voice-wave');
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
});
// Add visual feedback for microphone states
function updateMicrophoneState(isActive) {
  const micButton = document.getElementById('mic-button');
  
  if (isActive) {
    micButton.classList.add('active');
    micButton.innerHTML = '<i class="fas fa-microphone"></i> Listening...';
  } else {
    micButton.classList.remove('active');
    micButton.innerHTML = '<i class="fas fa-microphone-slash"></i> Click to speak';
  }
}

// Better audio level detection for automatic cutoff
function setupVoiceDetection(stream, audioContext) {
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(stream);
  microphone.connect(analyser);
  
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  let silenceTimer = null;
  const SILENCE_THRESHOLD = 15; // Adjust based on testing
  const SILENCE_DURATION = 1500; // 1.5 seconds of silence before stopping
  
  function checkAudioLevel() {
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average volume level
    let sum = 0;
    for(let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    
    // Update visualization
    updateVolumeIndicator(average);
    
    if (average < SILENCE_THRESHOLD) {
      if (!silenceTimer) {
        silenceTimer = setTimeout(() => {
          stopListening();
        }, SILENCE_DURATION);
      }
    } else {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    }
    
    if (isListening) {
      requestAnimationFrame(checkAudioLevel);
    }
  }
  
  requestAnimationFrame(checkAudioLevel);
}

// Improved microphone permission handling
async function startListening() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    isListening = true;
    updateMicrophoneState(true);
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    setupVoiceDetection(stream, audioContext);
    
    // Set up recorder
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.start();
    
    // Stop after maximum duration
    const MAX_RECORDING_TIME = 15000; // 15 seconds
    recordingTimeout = setTimeout(() => {
      if (isListening) stopListening();
    }, MAX_RECORDING_TIME);
    
  } catch (error) {
    console.error("Error accessing microphone:", error);
    showNotification("Please allow microphone access to use voice input", "error");
  }
}
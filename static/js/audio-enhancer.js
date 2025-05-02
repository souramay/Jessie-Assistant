// Audio enhancement module for YouTube and other audio sources
const AudioEnhancer = {
    // Configuration
    config: {
        presets: {
            default: {
                bassBoost: 2.0,
                trebleBoost: 1.5,
                compression: {
                    threshold: -24,
                    knee: 6,
                    ratio: 4,
                    attack: 0.003,
                    release: 0.1
                },
                limiting: {
                    threshold: -3,
                    knee: 0,
                    ratio: 20,
                    attack: 0.001,
                    release: 0.1
                }
            },
            bass: {
                bassBoost: 3.0,
                trebleBoost: 1.0,
                compression: {
                    threshold: -20,
                    knee: 8,
                    ratio: 3,
                    attack: 0.005,
                    release: 0.2
                },
                limiting: {
                    threshold: -2,
                    knee: 0,
                    ratio: 20,
                    attack: 0.001,
                    release: 0.1
                }
            },
            clear: {
                bassBoost: 1.5,
                trebleBoost: 2.0,
                compression: {
                    threshold: -30,
                    knee: 4,
                    ratio: 5,
                    attack: 0.002,
                    release: 0.05
                },
                limiting: {
                    threshold: -3,
                    knee: 0,
                    ratio: 20,
                    attack: 0.001,
                    release: 0.1
                }
            }
        },
        maxRetries: 3,
        retryDelay: 1000,
        performanceMonitor: true
    },

    // Initialize the audio enhancer
    init() {
        this.setupMutationObserver();
        this.setupEventListeners();
        this.startPeriodicCheck();
        this.setupPerformanceMonitor();
    },

    // Set up MutationObserver to detect new audio/video elements
    setupMutationObserver() {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === 1 && (node.tagName === 'AUDIO' || node.tagName === 'VIDEO')) {
                        this.processAudioElement(node);
                    }
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    },

    // Set up event listeners
    setupEventListeners() {
        // Listen for YouTube iframe messages
        window.addEventListener('message', (event) => {
            if (event.origin && event.origin.includes('youtube.com')) {
                console.log('YouTube message received:', event.data);
                setTimeout(() => this.enhanceAllAudio(), 500);
            }
        });

        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.cleanupAllAudio();
            } else {
                this.enhanceAllAudio();
            }
        });

        // Listen for audio state changes
        document.addEventListener('play', (event) => {
            if (event.target.tagName === 'AUDIO' || event.target.tagName === 'VIDEO') {
                this.processAudioElement(event.target);
            }
        }, true);
    },

    // Set up performance monitoring
    setupPerformanceMonitor() {
        if (this.config.performanceMonitor) {
            this.performanceMetrics = {
                totalProcessed: 0,
                successfulEnhancements: 0,
                failedEnhancements: 0,
                averageProcessingTime: 0
            };
        }
    },

    // Start periodic check for new audio elements
    startPeriodicCheck() {
        setInterval(() => this.enhanceAllAudio(), 3000);
    },

    // Process a single audio element
    processAudioElement(element, retryCount = 0) {
        if (element.src && !element.audioContext) {
            try {
                const startTime = performance.now();
                console.log('Processing audio element:', element.src);
                this.createAudioContext(element);
                
                if (this.config.performanceMonitor) {
                    const processingTime = performance.now() - startTime;
                    this.performanceMetrics.totalProcessed++;
                    this.performanceMetrics.successfulEnhancements++;
                    this.performanceMetrics.averageProcessingTime = 
                        (this.performanceMetrics.averageProcessingTime * (this.performanceMetrics.totalProcessed - 1) + processingTime) / 
                        this.performanceMetrics.totalProcessed;
                }
            } catch (error) {
                console.error('Error processing audio element:', error);
                
                if (this.config.performanceMonitor) {
                    this.performanceMetrics.failedEnhancements++;
                }

                if (retryCount < this.config.maxRetries) {
                    console.log(`Retrying audio processing (attempt ${retryCount + 1}/${this.config.maxRetries})`);
                    setTimeout(() => this.processAudioElement(element, retryCount + 1), this.config.retryDelay);
                }
            }
        }
    },

    // Create and configure audio context for an element
    createAudioContext(element, preset = 'default') {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(element);
        const presetConfig = this.config.presets[preset] || this.config.presets.default;

        // Create audio processing chain
        const eq = audioContext.createBiquadFilter();
        eq.type = 'lowshelf';
        eq.frequency.value = 200;
        eq.gain.value = presetConfig.bassBoost;

        const highShelf = audioContext.createBiquadFilter();
        highShelf.type = 'highshelf';
        highShelf.frequency.value = 4000;
        highShelf.gain.value = presetConfig.trebleBoost;

        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.value = presetConfig.compression.threshold;
        compressor.knee.value = presetConfig.compression.knee;
        compressor.ratio.value = presetConfig.compression.ratio;
        compressor.attack.value = presetConfig.compression.attack;
        compressor.release.value = presetConfig.compression.release;

        const limiter = audioContext.createDynamicsCompressor();
        limiter.threshold.value = presetConfig.limiting.threshold;
        limiter.knee.value = presetConfig.limiting.knee;
        limiter.ratio.value = presetConfig.limiting.ratio;
        limiter.attack.value = presetConfig.limiting.attack;
        limiter.release.value = presetConfig.limiting.release;

        // Create analyzer for visualization
        const analyzer = audioContext.createAnalyser();
        analyzer.fftSize = 2048;
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Connect the audio processing chain
        source.connect(eq);
        eq.connect(highShelf);
        highShelf.connect(compressor);
        compressor.connect(analyzer);
        analyzer.connect(limiter);
        limiter.connect(audioContext.destination);

        // Store the audio context and analyzer for cleanup
        element.audioContext = audioContext;
        element.audioAnalyzer = analyzer;
        element.audioDataArray = dataArray;

        // Set optimal playback settings
        element.volume = 1.0;

        // Add error handling
        element.onerror = (error) => {
            console.error('Audio error:', error);
            this.cleanupAudioContext(element);
        };

        // Add visualization update
        this.updateVisualization(element);
    },

    // Update visualization for an element
    updateVisualization(element) {
        if (!element.audioAnalyzer || !element.audioDataArray) return;

        const update = () => {
            if (element.audioAnalyzer && !element.paused) {
                element.audioAnalyzer.getByteFrequencyData(element.audioDataArray);
                // Emit visualization data event
                const event = new CustomEvent('audioVisualization', {
                    detail: {
                        data: Array.from(element.audioDataArray),
                        element: element
                    }
                });
                document.dispatchEvent(event);
                requestAnimationFrame(update);
            }
        };

        update();
    },

    // Enhance all audio elements on the page
    enhanceAllAudio() {
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => this.processAudioElement(element));
    },

    // Clean up a single audio context
    cleanupAudioContext(element) {
        if (element.audioContext) {
            try {
                console.log('Cleaning up audio context');
                element.audioContext.close();
                element.audioContext = null;
                element.audioAnalyzer = null;
                element.audioDataArray = null;
            } catch (e) {
                console.error('Error closing audio context:', e);
            }
        }
    },

    // Clean up all audio contexts
    cleanupAllAudio() {
        const audioElements = document.querySelectorAll('audio, video');
        audioElements.forEach(element => this.cleanupAudioContext(element));
    },

    // Get performance metrics
    getPerformanceMetrics() {
        return this.config.performanceMonitor ? this.performanceMetrics : null;
    },

    // Set audio preset for an element
    setPreset(element, preset) {
        if (this.config.presets[preset]) {
            this.cleanupAudioContext(element);
            this.createAudioContext(element, preset);
        } else {
            console.warn(`Preset "${preset}" not found. Using default preset.`);
        }
    }
};

// Initialize the audio enhancer when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AudioEnhancer.init();
}); 
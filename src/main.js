import './style.css'
import { gsap } from 'gsap'

// Configuration
const CONFIG = {
  OPENROUTER_API_KEY: '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',
  OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  MODEL: 'meta-llama/llama-3.3-70b-instruct',
  DIFFICULTIES: {
    easy: 15000,
    medium: 8000,
    hard: 3000
  },
  MAX_PRONUNCIATION_ATTEMPTS: 3,
  PASSING_SCORE: 60,
  AI_TIMEOUT: 30000, // Increased to 30 seconds
  SPEECH_CONFIG: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
}

// Default vocabulary
const DEFAULT_VOCABULARY = [
  'house', 'car', 'book', 'water', 'food', 'family', 'friend', 'work', 'school', 'time',
  'day', 'night', 'morning', 'afternoon', 'evening', 'week', 'month', 'year', 'today', 'tomorrow',
  'yesterday', 'love', 'happy', 'sad', 'angry', 'beautiful', 'good', 'bad', 'big', 'small',
  'hot', 'cold', 'new', 'old', 'fast', 'slow', 'easy', 'difficult', 'important', 'interesting'
]

// Game state
class GameState {
  constructor() {
    this.reset()
  }

  reset() {
    this.vocabulary = []
    this.currentWordIndex = 0
    this.score = 0
    this.correctCount = 0
    this.incorrectCount = 0
    this.totalWords = 0
    this.difficulty = 'easy'
    this.currentWord = ''
    this.currentPhase = 'translation'
    this.timer = null
    this.timeLeft = 0
    this.translationCorrect = false
    this.pronunciationScore = 0
    this.pronunciationAttempts = 0
    this.errors = []
    this.gameActive = false
    this.aiCache = new Map()
  }

  getCurrentTimeLimit() {
    return CONFIG.DIFFICULTIES[this.difficulty]
  }

  nextWord() {
    this.currentWordIndex++
    this.currentPhase = 'translation'
    this.translationCorrect = false
    this.pronunciationScore = 0
    this.pronunciationAttempts = 0
  }

  addError(word, type, details) {
    this.errors.push({ word, type, details })
  }

  isGameComplete() {
    return this.currentWordIndex >= this.vocabulary.length
  }
}

// Game instance
const game = new GameState()

// UI Elements - Will be initialized after DOM loads
let ui = {}

// Particle system using p5.js
let particles = []

function initParticles() {
  const particlesContainer = document.getElementById('particles-container')
  
  // Create canvas for particles using native Canvas API
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  
  particlesContainer.appendChild(canvas)
  
  // Initialize particles
  particles = []
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 4 + 2,
      speedX: (Math.random() - 0.5) * 1,
      speedY: (Math.random() - 0.5) * 1,
      opacity: Math.random() * 0.2 + 0.1
    })
  }
  
  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    particles.forEach(particle => {
      // Update position
      particle.x += particle.speedX
      particle.y += particle.speedY
      
      // Wrap around screen
      if (particle.x < 0) particle.x = canvas.width
      if (particle.x > canvas.width) particle.x = 0
      if (particle.y < 0) particle.y = canvas.height
      if (particle.y > canvas.height) particle.y = 0
      
      // Draw particle
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`
      ctx.fill()
    })
    
    requestAnimationFrame(animate)
  }
  
  animate()
}

// AI Integration
class AIService {
  static async validateTranslation(englishWord, userTranslation) {
    const cacheKey = `translation_${englishWord}_${userTranslation.toLowerCase()}`
    
    if (game.aiCache.has(cacheKey)) {
      console.log('📋 Using cached translation result')
      return game.aiCache.get(cacheKey)
    }

    const prompt = `You are a Spanish teacher. Is "${userTranslation}" a correct Spanish translation of "${englishWord}"?

Consider: exact matches, synonyms, regional variations (Mexican/Spanish/Argentine), with/without articles.

Respond with ONLY this JSON format:
{
  "correct": true/false,
  "explanation": "Brief Spanish explanation",
  "alternatives": ["alt1", "alt2", "alt3"],
  "tips": "Brief Spanish tip"
}

Evaluate: "${englishWord}" → "${userTranslation}"`

    console.log('🧠 Validating translation with OpenRouter AI...')
    // ALWAYS use OpenRouter - no fallback to local
    const result = await this.callOpenRouter(prompt)
    game.aiCache.set(cacheKey, result)
    return result
  }

  static async analyzePronunciation(targetWord, spokenText, confidence) {
    const cacheKey = `pronunciation_${targetWord}_${spokenText.toLowerCase()}`
    
    if (game.aiCache.has(cacheKey)) {
      console.log('📋 Using cached pronunciation result')
      return game.aiCache.get(cacheKey)
    }

    const prompt = `You are an English pronunciation coach. Analyze pronunciation of "${targetWord}".

Student said: "${spokenText}"
Recognition confidence: ${confidence}%

Rate pronunciation considering Spanish speaker difficulties with English sounds.

Respond with ONLY this JSON:
{
  "accuracy": 85,
  "clarity": 90,
  "phoneticMatch": 80,
  "overallScore": 85,
  "feedback": "Spanish explanation of quality",
  "tips": "Spanish improvement tip"
}

Score 0-100: 90+=excellent, 80+=good, 70+=adequate, 60+=poor, <60=very poor`

    console.log('🗣️ Analyzing pronunciation with OpenRouter AI...')
    // ALWAYS use OpenRouter - no fallback to local
    const result = await this.callOpenRouter(prompt)
    game.aiCache.set(cacheKey, result)
    return result
  }

  static async callOpenRouter(prompt) {
    console.log('🌐 Calling OpenRouter API (ONLY - no fallback)...')
    console.log('📝 Prompt length:', prompt.length)
    console.log('🏠 Running from:', window.location.origin)
    
    // ONLY try OpenRouter - no fallback
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('⏰ OpenRouter request timeout after 30 seconds')
      controller.abort()
    }, CONFIG.AI_TIMEOUT)

    try {
      const requestBody = {
        model: CONFIG.MODEL,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 500
      }
      
      const response = await fetch(CONFIG.OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Translate Blitz Pro'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid OpenRouter response structure')
      }
      
      const content = data.choices[0].message.content.trim()
      console.log('✅ OpenRouter response received')
      
      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        console.log('✅ Successfully parsed OpenRouter response')
        return parsed
      } else {
        throw new Error('No valid JSON found in OpenRouter response')
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('❌ OpenRouter API Error - NO FALLBACK AVAILABLE')
      console.error('❌ Error:', error.message)
      throw error // Re-throw error instead of using fallback
    }
  }

  // No fallback functions - AI only mode
}

// Speech Recognition Service
class SpeechService {
  constructor() {
    this.recognition = null
    this.audioContext = null
    this.microphone = null
    this.analyser = null
    this.isRecording = false
    this.initializeSpeechRecognition()
    this.initializeAudioContext()
  }

  initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition()
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition()
    } else {
      console.error('Speech Recognition not supported')
      return
    }

    this.recognition.continuous = false
    this.recognition.interimResults = false
    this.recognition.lang = 'en-US' // Changed to English for pronunciation
    this.recognition.maxAlternatives = 5
  }

  async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
    } catch (error) {
      console.error('Audio Context initialization failed:', error)
    }
  }

  async startRecording() {
    if (!this.recognition) {
      throw new Error('Speech Recognition not available')
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Request microphone access with enhanced settings
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            ...CONFIG.SPEECH_CONFIG,
            sampleRate: 44100,
            channelCount: 1
          }
        })

        // Set up audio processing for amplification
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
        }

        if (this.audioContext) {
          this.microphone = this.audioContext.createMediaStreamSource(stream)
          const gainNode = this.audioContext.createGain()
          gainNode.gain.value = 2.5 // Amplify input
          
          this.analyser = this.audioContext.createAnalyser()
          this.microphone.connect(gainNode)
          gainNode.connect(this.analyser)
        }

        this.isRecording = true

        this.recognition.onresult = (event) => {
          const results = []
          for (let i = 0; i < event.results[0].length; i++) {
            results.push({
              transcript: event.results[0][i].transcript,
              confidence: event.results[0][i].confidence * 100
            })
          }
          
          // Stop microphone stream
          stream.getTracks().forEach(track => track.stop())
          this.isRecording = false
          
          resolve(results)
        }

        this.recognition.onerror = (event) => {
          stream.getTracks().forEach(track => track.stop())
          this.isRecording = false
          reject(new Error(`Speech recognition error: ${event.error}`))
        }

        this.recognition.onend = () => {
          if (this.isRecording) {
            stream.getTracks().forEach(track => track.stop())
            this.isRecording = false
            reject(new Error('Speech recognition ended without result'))
          }
        }

        this.recognition.start()

      } catch (error) {
        reject(error)
      }
    })
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop()
      this.isRecording = false
    }
  }
}

// Text-to-Speech Service
class TTSService {
  static speak(text, rate = 1) {
    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Text-to-speech not supported'))
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US' // Changed to English
      utterance.rate = rate
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onend = resolve
      utterance.onerror = reject

      speechSynthesis.speak(utterance)
    })
  }

  static getPhonetic(word) {
    // Basic phonetic mapping for common English words
    const phoneticMap = {
      house: '/haʊs/',
      car: '/kɑːr/',
      book: '/bʊk/',
      water: '/ˈwɔːtər/',
      food: '/fuːd/',
      family: '/ˈfæməli/',
      friend: '/frɛnd/',
      work: '/wɜːrk/',
      school: '/skuːl/',
      time: '/taɪm/',
      money: '/ˈmʌni/',
      phone: '/foʊn/',
      computer: '/kəmˈpjuːtər/',
      day: '/deɪ/',
      night: '/naɪt/',
      morning: '/ˈmɔːrnɪŋ/',
      afternoon: '/ˌæftərˈnuːn/',
      evening: '/ˈiːvnɪŋ/',
      week: '/wiːk/',
      month: '/mʌnθ/',
      year: '/jɪr/',
      today: '/təˈdeɪ/',
      tomorrow: '/təˈmɔːroʊ/',
      yesterday: '/ˈjɛstərdeɪ/',
      love: '/lʌv/',
      happy: '/ˈhæpi/',
      sad: '/sæd/',
      angry: '/ˈæŋɡri/',
      beautiful: '/ˈbjuːtəfəl/',
      good: '/ɡʊd/',
      bad: '/bæd/',
      big: '/bɪɡ/',
      small: '/smɔːl/',
      hot: '/hɑːt/',
      cold: '/koʊld/',
      new: '/nuː/',
      old: '/oʊld/',
      fast: '/fæst/',
      slow: '/sloʊ/',
      easy: '/ˈiːzi/',
      difficult: '/ˈdɪfɪkəlt/',
      important: '/ɪmˈpɔːrtənt/',
      interesting: '/ˈɪntrəstɪŋ/'
    }
    
    return phoneticMap[word.toLowerCase()] || `/${word}/`
  }
}

// Game Logic
class GameLogic {
  static async startGame() {
    console.log('🎮 Starting game...')
    
    // Test AI connection first - REQUIRED for game
    const aiWorking = await this.testAIConnection()
    
    // OpenRouter AI is REQUIRED - no fallback allowed
    if (!aiWorking) {
      console.log('❌ Cannot start game: OpenRouter AI is required')
      return false
    }
    
    console.log('✅ Proceeding with game start...')
    
    // Get settings
    game.difficulty = ui.difficultySelect.value
    console.log('Selected difficulty:', game.difficulty)
    
    // Load vocabulary
    if (ui.vocabularyUpload.files.length > 0) {
      try {
        const file = ui.vocabularyUpload.files[0]
        const text = await file.text()
        game.vocabulary = text.split(',').map(word => word.trim()).filter(word => word.length > 0)
        console.log('Loaded custom vocabulary:', game.vocabulary.length, 'words')
      } catch (error) {
        console.error('Error loading vocabulary file:', error)
        alert('Error loading vocabulary file. Using default vocabulary.')
        game.vocabulary = [...DEFAULT_VOCABULARY]
      }
    } else {
      game.vocabulary = [...DEFAULT_VOCABULARY]
      console.log('Using default vocabulary:', game.vocabulary.length, 'words')
    }

    // Shuffle vocabulary
    game.vocabulary = this.shuffleArray([...game.vocabulary])
    game.totalWords = game.vocabulary.length
    
    // Initialize game state
    game.gameActive = true
    game.currentWordIndex = 0
    
    console.log('Game state initialized. Total words:', game.totalWords)
    
    // Switch to game panel
    this.switchPanel('game')
    this.updateUI()
    this.loadWord()
  }

  static shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  static loadWord() {
    if (game.isGameComplete()) {
      this.endGame()
      return
    }

    game.currentWord = game.vocabulary[game.currentWordIndex]
    game.currentPhase = 'translation'
    game.translationCorrect = false
    game.pronunciationScore = 0
    game.pronunciationAttempts = 0

    // Update UI
    ui.currentWord.textContent = game.currentWord
    ui.translationInput.value = ''
    ui.translationInput.focus()
    
    // Show translation phase
    ui.translationPhase.classList.add('active')
    ui.pronunciationPhase.classList.remove('active')
    ui.nextWord.classList.add('hidden')
    
    // Clear feedback
    ui.translationFeedback.innerHTML = ''
    ui.pronunciationFeedback.innerHTML = ''
    
    // Start timer
    this.startTimer()
    this.updateUI()
  }

  static startTimer() {
    game.timeLeft = game.getCurrentTimeLimit()
    
    const updateTimer = () => {
      if (!game.gameActive) return
      
      game.timeLeft -= 100
      
      const seconds = Math.ceil(game.timeLeft / 1000)
      ui.timer.textContent = seconds
      
      const percentage = (game.timeLeft / game.getCurrentTimeLimit()) * 100
      ui.timerFill.style.width = `${Math.max(0, percentage)}%`
      
      if (game.timeLeft <= 0) {
        this.handleTimeout()
        return
      }
      
      game.timer = setTimeout(updateTimer, 100)
    }
    
    updateTimer()
  }

  static pauseTimer() {
    if (game.timer) {
      clearTimeout(game.timer)
      game.timer = null
    }
  }

  static resumeTimer() {
    if (game.gameActive && game.timeLeft > 0) {
      this.startTimer()
    }
  }

  static handleTimeout() {
    this.pauseTimer()
    
    if (game.currentPhase === 'translation') {
      game.addError(game.currentWord, 'timeout', 'Tiempo agotado en la fase de traducción')
    } else {
      game.addError(game.currentWord, 'timeout', 'Tiempo agotado en la fase de pronunciación')
    }
    
    game.nextWord()
    this.loadWord()
  }

  static async submitTranslation() {
    const userTranslation = ui.translationInput.value.trim()
    
    if (!userTranslation) {
      alert('Por favor ingresa una traducción')
      return
    }

    this.pauseTimer()
    this.showLoading('Validating translation with AI...')

    try {
      // ONLY use AI validation - no fallback dictionary
      const result = await AIService.validateTranslation(game.currentWord, userTranslation)
      console.log('✅ AI validation successful:', result)
      
      this.hideLoading()
      
      // Store the translation result
      game.translationCorrect = result.correct
      this.displayTranslationFeedback(result)
      
      // ALWAYS proceed to pronunciation phase regardless of translation result
      console.log('Moving to pronunciation phase...')
      setTimeout(() => this.startPronunciationPhase(), 2000)
      
    } catch (error) {
      this.hideLoading()
      console.error('❌ AI Translation validation failed:', error)
      
      // More specific error messages
      let errorMessage = 'Error connecting to AI service. '
      if (error.message.includes('timeout')) {
        errorMessage += 'The AI service is taking too long to respond. Please try again.'
      } else if (error.message.includes('HTTP error')) {
        errorMessage += 'There was a server error. Please check your internet connection and try again.'
      } else if (error.message.includes('JSON')) {
        errorMessage += 'The AI response was invalid. Please try again.'
      } else {
        errorMessage += 'Please check your internet connection and try again.'
      }
      
      const shouldRetry = confirm(errorMessage + '\n\nWould you like to try again?')
      if (shouldRetry) {
        this.resumeTimer()
      } else {
        // User chose not to retry, proceed to pronunciation anyway
        game.translationCorrect = false
        this.displayTranslationFeedback({
          correct: false,
          explanation: 'No se pudo validar la traducción debido a problemas de conectividad.',
          alternatives: [],
          tips: 'Verifica tu conexión a internet para obtener validación de IA.'
        })
        setTimeout(() => this.startPronunciationPhase(), 2000)
      }
    }
  }

  static displayTranslationFeedback(result) {
    const feedback = ui.translationFeedback
    feedback.className = `feedback-container ${result.correct ? 'success' : 'error'}`
    
    let html = `
      <div class="feedback-title ${result.correct ? 'success' : 'error'}">
        ${result.correct ? '✓ Correcto!' : '✗ Incorrecto'}
      </div>
      <div class="feedback-content">
        <p>${result.explanation}</p>
      </div>
    `
    
    if (result.alternatives && result.alternatives.length > 0) {
      html += `
        <div class="alternatives">
          <h4>Alternativas válidas:</h4>
          <div class="alternatives-list">
            ${result.alternatives.map(alt => `<span class="alternative-tag">${alt}</span>`).join('')}
          </div>
        </div>
      `
    }
    
    if (result.tips) {
      html += `
        <div class="tips">
          <h4>💡 Consejo:</h4>
          <p>${result.tips}</p>
        </div>
      `
    }
    
    feedback.innerHTML = html
    
    // Animate feedback
    gsap.fromTo(feedback, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    )
  }

  static startPronunciationPhase() {
    console.log('🎤 Starting pronunciation phase for word:', game.currentWord)
    game.currentPhase = 'pronunciation'
    game.pronunciationAttempts = 0
    
    // Use the English word for pronunciation (not Spanish translation)
    const englishWord = game.currentWord
    console.log('English word for pronunciation:', englishWord)
    
    // Update UI - show English word for pronunciation
    ui.pronunciationWord.textContent = englishWord
    ui.phoneticDisplay.textContent = TTSService.getPhonetic(englishWord)
    ui.attemptCounter.textContent = `Attempt 1 of ${CONFIG.MAX_PRONUNCIATION_ATTEMPTS}`
    
    // Show pronunciation phase
    ui.translationPhase.classList.remove('active')
    ui.pronunciationPhase.classList.add('active')
    
    console.log('UI updated for English pronunciation phase')
    
    // Resume timer
    this.resumeTimer()
  }

  static async playAudio(slow = false) {
    const englishWord = ui.pronunciationWord.textContent // Now this is the English word
    const rate = slow ? 0.6 : 1.0
    
    try {
      await TTSService.speak(englishWord, rate)
    } catch (error) {
      console.error('Text-to-speech error:', error)
      alert('Error playing audio. Please check your browser settings.')
    }
  }

  static async startRecording() {
    if (game.pronunciationAttempts >= CONFIG.MAX_PRONUNCIATION_ATTEMPTS) {
      return
    }

    const speechService = new SpeechService()
    const recordBtn = ui.recordBtn
    
    try {
      recordBtn.textContent = '🎙️ Recording...'
      recordBtn.classList.add('recording')
      
      this.pauseTimer()
      
      const results = await speechService.startRecording()
      
      recordBtn.textContent = '🎤 Start Recording'
      recordBtn.classList.remove('recording')
      
      if (results && results.length > 0) {
        await this.processPronunciationResult(results[0])
      } else {
        alert('No speech detected. Please try again.')
        this.resumeTimer()
      }
      
    } catch (error) {
      recordBtn.textContent = '🎤 Start Recording'
      recordBtn.classList.remove('recording')
      console.error('Recording error:', error)
      alert('Recording failed. Please check microphone permissions.')
      this.resumeTimer()
    }
  }

  static async processPronunciationResult(result) {
    game.pronunciationAttempts++
    
    this.showLoading('Analyzing pronunciation with AI...')
    
    const targetWord = ui.pronunciationWord.textContent
    const spokenText = result.transcript
    const confidence = result.confidence || 50
    
    try {
      // ONLY use AI analysis - no fallback
      const analysis = await AIService.analyzePronunciation(targetWord, spokenText, confidence)
      console.log('✅ AI pronunciation analysis successful:', analysis)
      this.hideLoading()
      
      this.displayPronunciationFeedback(analysis, game.pronunciationAttempts)
      
      // Store best score
      game.pronunciationScore = Math.max(game.pronunciationScore, analysis.overallScore)
      
      if (game.pronunciationAttempts >= CONFIG.MAX_PRONUNCIATION_ATTEMPTS) {
        this.completePronunciationPhase()
      } else {
        ui.attemptCounter.textContent = `Attempt ${game.pronunciationAttempts + 1} of ${CONFIG.MAX_PRONUNCIATION_ATTEMPTS}`
        this.resumeTimer()
      }
      
    } catch (error) {
      this.hideLoading()
      console.error('❌ AI pronunciation analysis failed:', error)
      
      // More specific error handling
      let errorMessage = 'Error analyzing pronunciation with AI. '
      if (error.message.includes('timeout')) {
        errorMessage += 'The AI service is taking too long to respond.'
      } else if (error.message.includes('HTTP error')) {
        errorMessage += 'There was a server error.'
      } else {
        errorMessage += 'Please check your internet connection.'
      }
      
      const shouldRetry = confirm(errorMessage + '\n\nWould you like to try recording again?')
      if (shouldRetry) {
        game.pronunciationAttempts-- // Don't count this attempt
        this.resumeTimer()
      } else {
        // Skip to next word if user doesn't want to retry
        console.log('User chose to skip pronunciation analysis')
        game.pronunciationScore = 0 // Set to 0 since we couldn't analyze
        this.completePronunciationPhase()
      }
    }
  }

  static displayPronunciationFeedback(analysis, attemptNumber) {
    const feedback = ui.pronunciationFeedback
    const isGood = analysis.overallScore >= CONFIG.PASSING_SCORE
    
    feedback.className = `feedback-container ${isGood ? 'success' : 'error'}`
    
    const html = `
      <div class="feedback-title ${isGood ? 'success' : 'error'}">
        Attempt ${attemptNumber}: ${analysis.overallScore}% Overall Score
      </div>
      <div class="feedback-content">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-bottom: 16px;">
          <div style="text-align: center;">
            <strong>Accuracy</strong><br>
            <span style="font-size: 1.5rem; color: #667eea;">${analysis.accuracy}%</span>
          </div>
          <div style="text-align: center;">
            <strong>Clarity</strong><br>
            <span style="font-size: 1.5rem; color: #667eea;">${analysis.clarity}%</span>
          </div>
          <div style="text-align: center;">
            <strong>Phonetic</strong><br>
            <span style="font-size: 1.5rem; color: #667eea;">${analysis.phoneticMatch}%</span>
          </div>
        </div>
        <p><strong>Feedback:</strong> ${analysis.feedback}</p>
      </div>
      <div class="tips">
        <h4>💡 Tips for improvement:</h4>
        <p>${analysis.tips}</p>
      </div>
    `
    
    feedback.innerHTML = html
    
    // Animate feedback
    gsap.fromTo(feedback, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
    )
  }

  static completePronunciationPhase() {
    console.log('🏁 Completing pronunciation phase')
    console.log('Translation correct:', game.translationCorrect)
    console.log('Pronunciation score:', game.pronunciationScore)
    console.log('Passing score needed:', CONFIG.PASSING_SCORE)
    
    this.pauseTimer()
    
    // Evaluate word completion
    const translationPassed = game.translationCorrect
    const pronunciationPassed = game.pronunciationScore >= CONFIG.PASSING_SCORE
    const bothPassed = translationPassed && pronunciationPassed
    
    console.log('Translation passed:', translationPassed)
    console.log('Pronunciation passed:', pronunciationPassed)
    console.log('Both passed:', bothPassed)
    
    if (bothPassed) {
      // Calculate score based on remaining time
      const timeBonus = Math.max(0, game.timeLeft / game.getCurrentTimeLimit())
      const wordScore = Math.round(100 * (1 + timeBonus))
      game.score += wordScore
      game.correctCount++
      console.log('✅ Word completed successfully! Score added:', wordScore)
    } else {
      // Record error and increment incorrect count
      game.incorrectCount++
      let errorType = 'both'
      if (translationPassed) errorType = 'pronunciation'
      else if (pronunciationPassed) errorType = 'translation'
      
      console.log('❌ Word failed. Error type:', errorType)
      
      game.addError(game.currentWord, errorType, {
        translation: translationPassed,
        pronunciation: pronunciationPassed,
        pronunciationScore: game.pronunciationScore
      })
    }
    
    // Show next word button
    ui.nextWord.classList.remove('hidden')
    ui.nextWord.onclick = () => {
      console.log('📝 Moving to next word...')
      game.nextWord()
      this.loadWord()
    }
    
    this.updateUI()
  }

  static endGame() {
    game.gameActive = false
    this.pauseTimer()
    
    // Calculate final stats
    const accuracy = game.totalWords > 0 ? Math.round((game.correctCount / game.totalWords) * 100) : 0
    
    // Update results UI
    ui.finalScore.textContent = game.score
    ui.finalAccuracy.textContent = `${accuracy}%`
    ui.wordsCompleted.textContent = game.totalWords
    
    // Display errors
    this.displayErrorReview()
    
    // Switch to results panel
    this.switchPanel('results')
  }

  static displayErrorReview() {
    const errorList = ui.errorList
    
    if (game.errors.length === 0) {
      errorList.innerHTML = '<p style="text-align: center; color: #10b981; font-weight: 600;">¡Perfecto! No hubo errores.</p>'
      return
    }
    
    let html = ''
    game.errors.forEach(error => {
      html += `
        <div class="error-item">
          <div class="error-word">${error.word}</div>
          <div class="error-type">Error type: ${error.type}</div>
          <div class="error-details">
            ${typeof error.details === 'string' ? error.details : this.formatErrorDetails(error.details)}
          </div>
        </div>
      `
    })
    
    errorList.innerHTML = html
  }

  static formatErrorDetails(details) {
    if (typeof details === 'string') return details
    
    if (details.explanation) {
      return `<strong>Explanation:</strong> ${details.explanation}<br>
              ${details.alternatives ? `<strong>Alternatives:</strong> ${details.alternatives.join(', ')}<br>` : ''}
              ${details.tips ? `<strong>Tips:</strong> ${details.tips}` : ''}`
    }
    
    return JSON.stringify(details)
  }

  static switchPanel(panelName) {
    // Hide all panels
    ui.setupPanel.classList.remove('active')
    ui.gamePanel.classList.remove('active')
    ui.resultsPanel.classList.remove('active')
    
    // Show target panel
    switch(panelName) {
      case 'setup':
        ui.setupPanel.classList.add('active')
        break
      case 'game':
        ui.gamePanel.classList.add('active')
        break
      case 'results':
        ui.resultsPanel.classList.add('active')
        break
    }
    
    // Animate panel transition
    gsap.fromTo(`.panel.active`, 
      { opacity: 0, scale: 0.95 }, 
      { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.2)" }
    )
  }

  static updateUI() {
    ui.score.textContent = game.score
    // Show correct/incorrect format
    ui.correctCount.textContent = `${game.correctCount}/${game.incorrectCount}`
    ui.progress.textContent = `${game.currentWordIndex}/${game.totalWords}`
  }

  static showLoading(message = 'Processing...') {
    ui.loadingOverlay.querySelector('.loading-text').textContent = message
    ui.loadingOverlay.classList.add('active')
  }

  static hideLoading() {
    ui.loadingOverlay.classList.remove('active')
  }

  static resetGame() {
    game.reset()
    this.switchPanel('setup')
  }

  // Test AI connectivity - ONLY OpenRouter
  static async testAIConnection() {
    console.log('🔍 Testing OpenRouter AI connection...')
    this.updateConnectivityStatus('checking', '🔍 Testing connectivity...')
    
    // First test basic internet
    const basicInternet = await this.testBasicConnectivity()
    if (!basicInternet) {
      console.log('❌ No basic internet connectivity')
      this.updateConnectivityStatus('error', '❌ No internet connection')
      this.showDetailedErrorInfo('No internet connection detected. Please check your network settings.')
      return false
    }
    
    this.updateConnectivityStatus('checking', '🔍 Testing AI service...')
    
    try {
      const testResult = await AIService.validateTranslation('test', 'prueba')
      console.log('✅ OpenRouter AI connection test successful')
      this.updateConnectivityStatus('connected', '☁️ OpenRouter AI Ready')
      this.showAIModeInfo('cloud')
      
      // Update button for production
      const startBtn = document.getElementById('start-game-btn')
      if (startBtn) {
        startBtn.innerHTML = '🚀 Start Game'
        startBtn.disabled = false
      }
      
      return true
    } catch (error) {
      console.log('❌ OpenRouter AI connection test failed:', error)
      
      // NO FALLBACK - OpenRouter is required
      this.updateConnectivityStatus('error', '❌ OpenRouter AI Required')
      
      let errorMessage = 'OpenRouter AI service is required for accurate translations.'
      
      if (error.message.includes('401') || error.message.includes('No auth credentials')) {
        errorMessage = `
          <strong>🔑 API Key Issue</strong><br>
          The OpenRouter API key appears to be invalid or expired.<br>
          Please check the API key configuration.<br><br>
          <em>OpenRouter AI is required for accurate translation validation.</em>
        `
      } else if (error.message.includes('CORS') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        errorMessage = `
          <strong>🌐 Connection Issue</strong><br>
          Cannot connect to OpenRouter AI service.<br>
          Please check your internet connection and try again.<br><br>
          <em>A stable internet connection is required for AI validation.</em>
        `
      } else {
        errorMessage = `
          <strong>⚠️ OpenRouter Service Error</strong><br>
          There was an error connecting to the OpenRouter AI service.<br>
          Error: ${error.message}<br><br>
          <em>Please try again in a few moments.</em>
        `
      }
      
      this.showDetailedErrorInfo(errorMessage)
      
      // Update button to show error state
      const startBtn = document.getElementById('start-game-btn')
      if (startBtn) {
        startBtn.innerHTML = '❌ AI Required - Cannot Start'
        startBtn.disabled = true
      }
      
      return false // Do not allow game without OpenRouter
    }
  }

  // Show detailed error information to user
  static showDetailedErrorInfo(message) {
    const aiInfo = document.querySelector('.ai-info')
    if (aiInfo) {
      // Remove any existing error info
      const existingError = aiInfo.querySelector('.error-details')
      if (existingError) {
        existingError.remove()
      }
      
      // Add new error info
      const errorDiv = document.createElement('div')
      errorDiv.className = 'error-details'
      errorDiv.innerHTML = `
        <div style="background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); border-radius: 8px; padding: 12px; margin-top: 10px;">
          <p style="margin: 0; color: #ff6b6b; font-size: 14px; line-height: 1.4;">
            ${message}
          </p>
        </div>
      `
      aiInfo.appendChild(errorDiv)
    }
  }

  // Alternative method to test basic connectivity
  static async testBasicConnectivity() {
    console.log('🌐 Testing basic internet connectivity...')
    try {
      // Test with a simple CORS-enabled endpoint
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        mode: 'cors'
      })
      console.log('✅ Basic internet connectivity works')
      return true
    } catch (error) {
      console.log('❌ Basic internet connectivity failed:', error)
      return false
    }
  }

  // Update connectivity indicator
  static updateConnectivityStatus(status, message) {
    const indicator = document.getElementById('connectivity-indicator')
    const statusContainer = document.getElementById('connectivity-status')
    
    if (indicator && statusContainer) {
      indicator.textContent = message
      statusContainer.className = `connectivity-status ${status}`
    }
  }

  // Show AI mode information to users
  static showAIModeInfo(mode) {
    const aiInfo = document.querySelector('.ai-info')
    if (!aiInfo) return
    
    // Remove existing mode info
    const existingModeInfo = aiInfo.querySelector('.ai-mode-info')
    if (existingModeInfo) {
      existingModeInfo.remove()
    }
    
    // Only show cloud mode - no local mode available
    if (mode === 'cloud') {
      const modeHTML = `
        <div class="ai-mode-info" style="
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 8px;
          padding: 12px;
          margin: 12px 0;
        ">
          <h5 style="color: #059669; margin-bottom: 8px;">☁️ Cloud AI Active</h5>
          <p style="color: #059669; font-size: 0.9rem;">
            Connected to Meta Llama 3.3 70B via OpenRouter for advanced AI analysis.
          </p>
        </div>
      `
      aiInfo.insertAdjacentHTML('beforeend', modeHTML)
    }
  }
}

// Enhanced debug functions to test AI integration (AI ONLY MODE)
window.testTranslationAI = async function(word, translation) {
  console.log(`🧪 Testing AI translation: "${word}" -> "${translation}"`)
  try {
    const result = await AIService.validateTranslation(word, translation)
    console.log('✅ AI Result:', result)
    return result
  } catch (error) {
    console.log('❌ AI Failed:', error)
    console.log('⚠️ No fallback available - AI only mode')
    throw error
  }
}

window.testPronunciationAI = async function(word, spokenText, confidence = 80) {
  console.log(`🧪 Testing AI pronunciation: "${word}" -> "${spokenText}" (${confidence}% confidence)`)
  try {
    const result = await AIService.analyzePronunciation(word, spokenText, confidence)
    console.log('✅ AI Result:', result)
    return result
  } catch (error) {
    console.log('❌ AI Failed:', error)
    console.log('⚠️ No fallback available - AI only mode')
    throw error
  }
}

console.log('🤖 AI-Only Mode Enabled - All validations require OpenRouter connection')

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI elements after DOM is loaded
  ui = {
    setupPanel: document.getElementById('setup-panel'),
    gamePanel: document.getElementById('game-panel'),
    resultsPanel: document.getElementById('results-panel'),
    vocabularyUpload: document.getElementById('vocabulary-upload'),
    difficultySelect: document.getElementById('difficulty-select'),
    startGameBtn: document.getElementById('start-game-btn'),
    score: document.getElementById('score'),
    correctCount: document.getElementById('correct-count'),
    progress: document.getElementById('progress'),
    timer: document.getElementById('timer'),
    timerFill: document.getElementById('timer-fill'),
    translationPhase: document.getElementById('translation-phase'),
    pronunciationPhase: document.getElementById('pronunciation-phase'),
    currentWord: document.getElementById('current-word'),
    translationInput: document.getElementById('translation-input'),
    submitTranslation: document.getElementById('submit-translation'),
    translationFeedback: document.getElementById('translation-feedback'),
    pronunciationWord: document.getElementById('pronunciation-word'),
    phoneticDisplay: document.getElementById('phonetic-display'),
    playNormal: document.getElementById('play-normal'),
    playSlow: document.getElementById('play-slow'),
    recordBtn: document.getElementById('record-btn'),
    attemptCounter: document.getElementById('attempt-counter'),
    pronunciationFeedback: document.getElementById('pronunciation-feedback'),
    nextWord: document.getElementById('next-word'),
    finalScore: document.getElementById('final-score'),
    finalAccuracy: document.getElementById('final-accuracy'),
    wordsCompleted: document.getElementById('words-completed'),
    errorList: document.getElementById('error-list'),
    playAgain: document.getElementById('play-again'),
    newSetup: document.getElementById('new-setup'),
    loadingOverlay: document.getElementById('loading-overlay')
  }

  // Debug: Check if elements are found
  console.log('UI Elements loaded:', ui)
  console.log('Start Game Button:', ui.startGameBtn)

  // Initialize particles
  initParticles()
  
  // Setup event listeners
  if (ui.startGameBtn) {
    ui.startGameBtn.addEventListener('click', () => {
      console.log('Start Game button clicked!')
      GameLogic.startGame()
    })
  } else {
    console.error('Start Game button not found!')
  }
  
  if (ui.submitTranslation) {
    ui.submitTranslation.addEventListener('click', () => GameLogic.submitTranslation())
  }
  
  if (ui.playNormal) {
    ui.playNormal.addEventListener('click', () => GameLogic.playAudio(false))
  }
  
  if (ui.playSlow) {
    ui.playSlow.addEventListener('click', () => GameLogic.playAudio(true))
  }
  
  if (ui.recordBtn) {
    ui.recordBtn.addEventListener('click', () => GameLogic.startRecording())
  }
  
  if (ui.playAgain) {
    ui.playAgain.addEventListener('click', () => GameLogic.resetGame())
  }
  
  if (ui.newSetup) {
    ui.newSetup.addEventListener('click', () => GameLogic.resetGame())
  }
  
  // Enter key support for translation input
  if (ui.translationInput) {
    ui.translationInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        GameLogic.submitTranslation()
      }
    })
  }
  
  // File upload validation
  if (ui.vocabularyUpload) {
    ui.vocabularyUpload.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file && !file.name.endsWith('.txt')) {
        alert('Please select a .txt file')
        e.target.value = ''
      }
    })
  }
  
  // Test AI connectivity on page load
  setTimeout(() => {
    GameLogic.testAIConnection()
  }, 1000)

  console.log('🎮 Translate Blitz Pro initialized!')
})

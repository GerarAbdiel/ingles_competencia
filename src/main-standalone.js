// Standalone version of Translate Blitz Pro - No module imports required
console.log('🎮 Loading Translate Blitz Pro Standalone...');

// Check if GSAP is available
if (typeof gsap === 'undefined') {
  console.error('❌ GSAP not loaded. Animation features will be limited.');
  // Create a minimal gsap polyfill
  window.gsap = {
    fromTo: (element, from, to) => {
      console.log('🎬 Animation skipped (GSAP not available)');
    }
  };
}

// Configuration
const CONFIG = {
  OPENROUTER_API_KEY: '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',
  OPENROUTER_ENDPOINT: 'https://openrouter.ai/api/v1/chat/completions',
  MODEL: 'meta-llama/llama-3.3-70b-instruct:free',
  DIFFICULTIES: {
    easy: 15000,
    medium: 8000,
    hard: 3000
  },
  MAX_PRONUNCIATION_ATTEMPTS: 3,
  PASSING_SCORE: 60,
  AI_TIMEOUT: 30000,
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

// UI Elements
let ui = {}

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
    const result = await this.callOpenRouter(prompt)
    game.aiCache.set(cacheKey, result)
    return result
  }

  static async callOpenRouter(prompt) {
    console.log('🌐 Calling OpenRouter API...')
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ OpenRouter request timeout after 30 seconds');
      controller.abort();
    }, CONFIG.AI_TIMEOUT);
    try {
      const apiKey = getAPIKey();
      const requestBody = {
        model: CONFIG.MODEL,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3,
        max_tokens: 500
      };
      const response = await fetch(CONFIG.OPENROUTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Translate Blitz Pro'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid OpenRouter response structure');
      }
      const content = data.choices[0].message.content.trim();
      // Si la respuesta es JSON, parsear, si no, devolver como string
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ OpenRouter API Error:', error.message);
      throw error;
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
      utterance.lang = 'en-US'
      utterance.rate = rate
      utterance.pitch = 1
      utterance.volume = 0.8

      utterance.onend = resolve
      utterance.onerror = reject

      speechSynthesis.speak(utterance)
    })
  }

  static getPhonetic(word) {
    const phoneticMap = {
      house: '/haʊs/', car: '/kɑːr/', book: '/bʊk/', water: '/ˈwɔːtər/', food: '/fuːd/',
      family: '/ˈfæməli/', friend: '/frɛnd/', work: '/wɜːrk/', school: '/skuːl/', time: '/taɪm/',
      day: '/deɪ/', night: '/naɪt/', morning: '/ˈmɔːrnɪŋ/', afternoon: '/ˌæftərˈnuːn/',
      evening: '/ˈiːvnɪŋ/', week: '/wiːk/', month: '/mʌnθ/', year: '/jɪr/', today: '/təˈdeɪ/',
      tomorrow: '/təˈmɔːroʊ/', yesterday: '/ˈjɛstərdeɪ/', love: '/lʌv/', happy: '/ˈhæpi/',
      sad: '/sæd/', angry: '/ˈæŋɡri/', beautiful: '/ˈbjuːtəfəl/', good: '/ɡʊd/', bad: '/bæd/',
      big: '/bɪɡ/', small: '/smɔːl/', hot: '/hɑːt/', cold: '/koʊld/', new: '/nuː/', old: '/oʊld/',
      fast: '/fæst/', slow: '/sloʊ/', easy: '/ˈiːzi/', difficult: '/ˈdɪfɪkəlt/',
      important: '/ɪmˈpɔːrtənt/', interesting: '/ˈɪntrəstɪŋ/'
    }
    return phoneticMap[word.toLowerCase()] || `/${word}/`
  }
}

// Speech Recognition Service  
class SpeechService {
  constructor() {
    this.recognition = null
    this.initializeSpeechRecognition()
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
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 5
  }

  async startRecording() {
    if (!this.recognition) {
      throw new Error('Speech Recognition not available')
    }

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event) => {
        const results = []
        for (let i = 0; i < event.results[0].length; i++) {
          results.push({
            transcript: event.results[0][i].transcript,
            confidence: event.results[0][i].confidence * 100
          })
        }
        resolve(results)
      }

      this.recognition.onerror = (event) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition.onend = () => {
        // Recognition ended
      }

      this.recognition.start()
    })
  }
}

// API Key Management
function getAPIKey() {
  const userAPIKey = localStorage.getItem('openrouter_api_key');
  if (userAPIKey && userAPIKey.trim()) {
    return userAPIKey.trim();
  }
  return CONFIG.OPENROUTER_API_KEY;
}

function setUserAPIKey(apiKey) {
  if (!apiKey || !apiKey.trim()) {
    localStorage.removeItem('openrouter_api_key')
    console.log('🗑️ Removed user API key')
    updateAPIKeyStatus()
    return false
  }
  
  if (!apiKey.startsWith('sk-or-v1-')) {
    console.error('❌ Invalid API key format. Must start with sk-or-v1-')
    return false
  }
  
  localStorage.setItem('openrouter_api_key', apiKey.trim())
  console.log('✅ User API key saved')
  updateAPIKeyStatus()
  return true
}

function updateAPIKeyStatus() {
  const userAPIKey = localStorage.getItem('openrouter_api_key')
  const apiKeyInput = document.getElementById('api-key-input')
  
  if (apiKeyInput) {
    if (userAPIKey) {
      apiKeyInput.placeholder = `Using your key: ${userAPIKey.substring(0, 12)}...`
    } else {
      apiKeyInput.placeholder = 'sk-or-v1-your-api-key-here'
    }
  }
}

// Game Logic Class
class GameLogic {
  static async startGame() {
    console.log('🎮 Starting game...')
    
    // Solo verificar AI si el botón está deshabilitado (no hay modelo funcional)
    const startBtn = document.getElementById('start-game-btn')
    if (startBtn && startBtn.disabled) {
      console.log('🔍 Button disabled, checking AI connection...')
      const aiWorking = await this.testAIConnection()
      if (!aiWorking) {
        console.log('❌ Cannot start game: OpenRouter AI is required')
        return false
      }
    } else {
      console.log('✅ Using previously detected working model:', CONFIG.MODEL)
    }
    
    game.difficulty = ui.difficultySelect.value
    
    if (ui.vocabularyUpload.files.length > 0) {
      try {
        const file = ui.vocabularyUpload.files[0]
        const text = await file.text()
        game.vocabulary = text.split(',').map(word => word.trim()).filter(word => word.length > 0)
      } catch (error) {
        console.error('Error loading vocabulary file:', error)
        alert('Error loading vocabulary file. Using default vocabulary.')
        game.vocabulary = [...DEFAULT_VOCABULARY]
      }
    } else {
      game.vocabulary = [...DEFAULT_VOCABULARY]
    }

    game.vocabulary = this.shuffleArray([...game.vocabulary])
    game.totalWords = game.vocabulary.length
    game.gameActive = true
    game.currentWordIndex = 0
    
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

    ui.currentWord.textContent = game.currentWord
    ui.translationInput.value = ''
    ui.translationInput.focus()
    
    ui.translationPhase.classList.add('active')
    ui.pronunciationPhase.classList.remove('active')
    ui.nextWord.classList.add('hidden')
    
    ui.translationFeedback.innerHTML = ''
    ui.pronunciationFeedback.innerHTML = ''
    
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
      const result = await AIService.validateTranslation(game.currentWord, userTranslation)
      this.hideLoading()
      
      game.translationCorrect = result.correct
      this.displayTranslationFeedback(result)
      
      setTimeout(() => this.startPronunciationPhase(), 2000)
      
    } catch (error) {
      this.hideLoading()
      console.error('❌ AI Translation validation failed:', error)
      
      const shouldRetry = confirm('Error connecting to AI service. Would you like to try again?')
      if (shouldRetry) {
        this.resumeTimer()
      } else {
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
  }

  static startPronunciationPhase() {
    game.currentPhase = 'pronunciation'
    game.pronunciationAttempts = 0
    
    const englishWord = game.currentWord
    
    ui.pronunciationWord.textContent = englishWord
    ui.phoneticDisplay.textContent = TTSService.getPhonetic(englishWord)
    ui.attemptCounter.textContent = `Attempt 1 of ${CONFIG.MAX_PRONUNCIATION_ATTEMPTS}`
    
    ui.translationPhase.classList.remove('active')
    ui.pronunciationPhase.classList.add('active')
    
    this.resumeTimer()
  }

  static async playAudio(slow = false) {
    const englishWord = ui.pronunciationWord.textContent
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
      const analysis = await AIService.analyzePronunciation(targetWord, spokenText, confidence)
      this.hideLoading()
      
      this.displayPronunciationFeedback(analysis, game.pronunciationAttempts)
      
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
      
      const shouldRetry = confirm('Error analyzing pronunciation with AI. Would you like to try recording again?')
      if (shouldRetry) {
        game.pronunciationAttempts--
        this.resumeTimer()
      } else {
        game.pronunciationScore = 0
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
  }

  static completePronunciationPhase() {
    this.pauseTimer()
    
    const translationPassed = game.translationCorrect
    const pronunciationPassed = game.pronunciationScore >= CONFIG.PASSING_SCORE
    const bothPassed = translationPassed && pronunciationPassed
    
    if (bothPassed) {
      const timeBonus = Math.max(0, game.timeLeft / game.getCurrentTimeLimit())
      const wordScore = Math.round(100 * (1 + timeBonus))
      game.score += wordScore
      game.correctCount++
    } else {
      game.incorrectCount++
      let errorType = 'both'
      if (translationPassed) errorType = 'pronunciation'
      else if (pronunciationPassed) errorType = 'translation'
      
      game.addError(game.currentWord, errorType, {
        translation: translationPassed,
        pronunciation: pronunciationPassed,
        pronunciationScore: game.pronunciationScore
      })
    }
    
    ui.nextWord.classList.remove('hidden')
    ui.nextWord.onclick = () => {
      game.nextWord()
      this.loadWord()
    }
    
    this.updateUI()
  }

  static endGame() {
    game.gameActive = false
    this.pauseTimer()
    
    const accuracy = game.totalWords > 0 ? Math.round((game.correctCount / game.totalWords) * 100) : 0
    
    ui.finalScore.textContent = game.score
    ui.finalAccuracy.textContent = `${accuracy}%`
    ui.wordsCompleted.textContent = game.totalWords
    
    this.displayErrorReview()
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
            ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}
          </div>
        </div>
      `
    })
    
    errorList.innerHTML = html
  }

  static switchPanel(panelName) {
    ui.setupPanel.classList.remove('active')
    ui.gamePanel.classList.remove('active')
    ui.resultsPanel.classList.remove('active')
    
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
  }

  static updateUI() {
    ui.score.textContent = game.score
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

  static async testAIConnection() {
    console.log('🔍 Testing OpenRouter AI connection...')
    this.updateConnectivityStatus('checking', '🔍 Testing AI models...')
    
    // Usar la misma lógica exitosa de test-models.html
    const apiKey = localStorage.getItem('openrouter_api_key') || CONFIG.OPENROUTER_API_KEY
    
    const WORKING_MODELS = [
      'meta-llama/llama-3.1-8b-instruct:free',
      'google/gemma-2-9b-it:free',
      'microsoft/phi-3-mini-128k-instruct:free',
      'qwen/qwen-2-7b-instruct:free',
      'huggingfaceh4/zephyr-7b-beta:free',
      'openchat/openchat-7b:free'
    ]
    
    console.log(`🔑 Testing with API key: ${apiKey.substring(0, 20)}...`)
    
    for (const model of WORKING_MODELS) {
      try {
        console.log(`🧪 Testing model: ${model}`)
        this.updateConnectivityStatus('checking', `🧪 Testing ${model}...`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)
        
        const response = await fetch(CONFIG.OPENROUTER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Translate Blitz Pro'
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: 'user',
              content: 'Respond with exactly: {"test": "success"}'
            }],
            temperature: 0.1,
            max_tokens: 50
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          console.log(`✅ Model ${model} works! Updating configuration...`)
          
          // Actualizar configuración para usar este modelo
          CONFIG.MODEL = model
          
          this.updateConnectivityStatus('connected', `☁️ Using ${model}`)
          
          const startBtn = document.getElementById('start-game-btn')
          if (startBtn) {
            startBtn.innerHTML = '� Start Game'
            startBtn.disabled = false
          }
          
          console.log(`✅ Game configured to use working model: ${model}`)
          return true
        } else {
          const errorText = await response.text()
          console.log(`❌ Model ${model} failed: HTTP ${response.status} - ${errorText}`)
        }
        
      } catch (error) {
        console.log(`❌ Model ${model} error:`, error.message)
      }
      
      // Pequeño delay entre modelos
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Si ningún modelo funcionó
    console.log('❌ No working models found')
    this.updateConnectivityStatus('error', '❌ No models available')
    
    const startBtn = document.getElementById('start-game-btn')
    if (startBtn) {
      startBtn.innerHTML = '❌ No models available'
      startBtn.disabled = true
    }
    
    return false
  }

  static updateConnectivityStatus(status, message) {
    const indicator = document.getElementById('connectivity-indicator')
    const statusContainer = document.getElementById('connectivity-status')
    
    if (indicator && statusContainer) {
      indicator.textContent = message
      statusContainer.className = `connectivity-status ${status}`
    }
  }
}

// Global debug functions
window.testAPIKey = async function(apiKey) {
  if (!apiKey) {
    console.log('Usage: testAPIKey("sk-or-v1-your-key-here")')
    return
  }
  
  const oldKey = localStorage.getItem('openrouter_api_key')
  
  try {
    localStorage.setItem('openrouter_api_key', apiKey)
    const result = await AIService.validateTranslation('test', 'prueba')
    console.log('✅ API key works!', result)
    updateAPIKeyStatus()
    alert('API key works! It has been saved.')
    return true
  } catch (error) {
    if (oldKey) {
      localStorage.setItem('openrouter_api_key', oldKey)
    } else {
      localStorage.removeItem('openrouter_api_key')
    }
    updateAPIKeyStatus()
    alert('API key test failed: ' + error.message)
    return false
  }
}

window.getCurrentAPIKey = function() {
  return getAPIKey()
}

window.clearAPIKey = function() {
  localStorage.removeItem('openrouter_api_key')
  updateAPIKeyStatus()
  console.log('🗑️ API key cleared')
}

window.getCurrentModel = function() {
  console.log('🤖 Current AI Model:', CONFIG.MODEL)
  return CONFIG.MODEL
}

// Initialize when DOM is loaded
function initializeApp() {
  console.log('🎮 Initializing Translate Blitz Pro Standalone...')
  
  // Debug: Check if we're actually running
  console.log('Document ready state:', document.readyState)
  console.log('Current URL:', window.location.href)
  
  // Initialize UI elements with error checking
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
  
  // Debug: Check which UI elements were found
  let missingElements = []
  for (const [key, element] of Object.entries(ui)) {
    if (!element) {
      missingElements.push(key)
    }
  }
  
  if (missingElements.length > 0) {
    console.warn('⚠️ Missing UI elements:', missingElements)
  } else {
    console.log('✅ All UI elements found')
  }
  
  // Critical elements check
  if (!ui.startGameBtn) {
    console.error('❌ Critical: Start Game button not found!')
    return
  }
  
  if (!ui.setupPanel) {
    console.error('❌ Critical: Setup panel not found!')
    return
  }

  // Setup event listeners with error checking
  console.log('🔗 Setting up event listeners...')
  
  if (ui.startGameBtn) {
    ui.startGameBtn.addEventListener('click', () => {
      console.log('🎮 Start Game button clicked!')
      GameLogic.startGame()
    })
    console.log('✅ Start Game button listener added')
  } else {
    console.error('❌ Cannot add listener: Start Game button not found')
  }
  
  if (ui.submitTranslation) {
    ui.submitTranslation.addEventListener('click', () => GameLogic.submitTranslation())
    console.log('✅ Submit Translation button listener added')
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
  
  // API Key configuration
  const saveAPIKeyBtn = document.getElementById('save-api-key')
  const clearAPIKeyBtn = document.getElementById('clear-api-key')
  const apiKeyInput = document.getElementById('api-key-input')
  
  if (saveAPIKeyBtn && apiKeyInput) {
    saveAPIKeyBtn.addEventListener('click', () => {
      const apiKey = apiKeyInput.value.trim()
      if (!apiKey) {
        alert('Please enter an API key')
        return
      }
      
      if (setUserAPIKey(apiKey)) {
        alert('API key saved successfully!')
        apiKeyInput.value = ''
        GameLogic.testAIConnection()
      }
    })
  }
  
  if (clearAPIKeyBtn) {
    clearAPIKeyBtn.addEventListener('click', () => {
      if (confirm('Remove custom API key?')) {
        setUserAPIKey('')
        alert('API key removed.')
        GameLogic.testAIConnection()
      }
    })
  }
  
  // Enter key support for translation
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
  
  // Load API key status and test connection
  console.log('🔑 Checking API key status...')
  updateAPIKeyStatus()
  
  // Check if we have a valid API key before testing
  const savedAPIKey = localStorage.getItem('openrouter_api_key')
  if (savedAPIKey && savedAPIKey.trim()) {
    console.log('🔑 Found saved API key, testing connection in 1 second...')
    setTimeout(() => {
      console.log('🧪 Starting AI connection test with saved key...')
      GameLogic.testAIConnection()
    }, 1000)
  } else {
    console.log('❌ No saved API key found, using default (may be rate-limited)')
    console.log('🔌 Testing AI connection with default key in 1 second...')
    setTimeout(() => {
      console.log('🧪 Starting AI connection test with default key...')
      GameLogic.testAIConnection()
    }, 1000)
  }

  console.log('✅ Translate Blitz Pro Standalone initialized successfully!')
  
  // Additional debug: Test if button is clickable
  setTimeout(() => {
    if (ui.startGameBtn) {
      console.log('🔍 Start button debug:', {
        exists: !!ui.startGameBtn,
        disabled: ui.startGameBtn.disabled,
        visible: ui.startGameBtn.offsetParent !== null,
        innerHTML: ui.startGameBtn.innerHTML
      })
    }
  }, 2000)
}

// Call initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp)
} else {
  // DOM is already loaded
  initializeApp()
}

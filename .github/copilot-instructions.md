# Copilot Instructions for Translate Blitz Pro

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is an interactive English-Spanish translation game called "Translate Blitz Pro" that integrates advanced AI for translation validation and pronunciation analysis.

## Key Technologies
- **Frontend**: Vanilla JavaScript with Vite build tool
- **AI Integration**: OpenRouter API with Meta Llama 3.3 70B Instruct
- **Speech Recognition**: Web Speech API
- **Audio Processing**: Web Audio API
- **Visual Effects**: p5.js for particle systems
- **Animations**: GSAP for smooth transitions
- **Design**: Modern gradient UI (blue-purple theme)

## Code Guidelines
- Use modern ES6+ JavaScript features
- Implement responsive design for mobile and desktop
- Follow educational gaming principles
- Ensure accessibility with clear visual and audio feedback
- Use async/await for API calls with proper error handling
- Cache AI responses to optimize performance
- Implement proper timeout handling for API calls

## AI Integration Specifics
- OpenRouter API endpoint: https://openrouter.ai/api/v1/chat/completions
- Model: Meta Llama 3.3 70B Instruct
- Translation validation considers synonyms, regional variations, and context
- Pronunciation analysis includes phonetic matching and clarity assessment
- All AI feedback should be educational and constructive

## Game Mechanics
- Three difficulty levels: Easy (15s), Medium (8s), Hard (3s)
- Two-phase gameplay: Translation + Pronunciation
- Both phases must pass (≥60%) to count as correct
- Detailed feedback and error analysis
- Custom vocabulary loading from .txt files

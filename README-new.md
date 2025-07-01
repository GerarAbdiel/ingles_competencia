# 🎮 Translate Blitz Pro

An interactive English-Spanish translation game powered by advanced AI for real-time translation validation and pronunciation analysis.

## ✨ Features

- **🤖 AI-Powered Validation**: Uses Meta Llama 3.3 70B via OpenRouter API
- **🎤 Speech Recognition**: Advanced pronunciation analysis
- **📚 Custom Vocabulary**: Load your own word lists
- **⏱️ Multiple Difficulty Levels**: Easy (15s), Medium (8s), Hard (3s)
- **🎯 Two-Phase Gameplay**: Translation + Pronunciation
- **📊 Detailed Feedback**: Smart error analysis and learning tips
- **🌟 Modern UI**: Beautiful gradient design with particle effects

## 🚀 Live Demo

**[Play Translate Blitz Pro →](https://your-username.github.io/programa-ingles)**

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript + Vite
- **AI**: OpenRouter API + Meta Llama 3.3 70B Instruct
- **Speech**: Web Speech API + Web Audio API
- **Animation**: GSAP + Canvas particle system
- **Design**: Modern CSS with glassmorphism

## 🎯 How to Play

1. **Choose difficulty** and optionally upload custom vocabulary
2. **Translation Phase**: Translate English words to Spanish
3. **Pronunciation Phase**: Pronounce the English word correctly
4. **Both phases must pass** (≥60%) to score points
5. **Get detailed AI feedback** for improvement

## 🚀 Quick Start

### Online (Recommended)
Visit the live demo link above - no setup required!

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/programa-ingles.git
cd programa-ingles

# Install dependencies
npm install

# Start development server
npm run dev
```

**Note**: When running locally, the game uses simulated AI responses due to CORS restrictions. Deploy to a web server for full AI functionality.

## 🌐 Deployment

### GitHub Pages (Recommended)

1. Fork this repository
2. Go to Settings → Pages
3. Select "Deploy from a branch"
4. Choose `main` branch and `/` (root)
5. Your app will be available at `https://your-username.github.io/programa-ingles`

### Alternative Platforms

- **Netlify**: Connect your GitHub repo for automatic deployments
- **Vercel**: Import your GitHub project
- **Surge.sh**: `npm run build && surge dist/`

## 📁 Project Structure

```
├── public/
│   └── sample-vocabulary.txt    # Example vocabulary file
├── src/
│   ├── main.js                  # Main game logic
│   └── style.css                # Styles and animations
├── index.html                   # Main HTML file
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## 🎮 Game Mechanics

- **Scoring**: Points awarded based on accuracy and speed
- **Validation**: AI considers synonyms, regional variations, and context
- **Pronunciation**: Phonetic matching with Spanish speaker considerations
- **Progressive Difficulty**: Timer pressure increases challenge

## 🔧 Configuration

The game automatically detects the environment:
- **Local Development**: Uses mock AI responses
- **Production**: Uses real OpenRouter AI

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Open a Pull Request

## 📜 License

MIT License - feel free to use this project for learning and development!

## 🎯 Educational Goals

This project demonstrates:
- Modern JavaScript development with Vite
- AI API integration and error handling
- Speech recognition and synthesis
- Game development principles
- Responsive web design
- Educational technology concepts

---

**Made with ❤️ for language learners everywhere**

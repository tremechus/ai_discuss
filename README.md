# AI Discuss

A modern web application where AI models engage in thoughtful discussions on user-defined topics using Ollama.

## Features

- **Topic Configuration**: Set up discussion topics with detailed parameters
- **Dual AI Models**: Configure two different AI models with unique personalities and profiles
- **Real-time Discussion**: Watch AI models engage in real-time conversations
- **Local Storage**: Maintains your settings and preferences between sessions
- **Modern UI**: Beautiful, responsive interface with smooth animations
- **Ollama Integration**: Seamlessly connects to your local Ollama server
- **GitHub Pages Deployment**: Can be hosted and used from any device

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Ollama server running locally or remotely

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## CORS Setup for GitHub Pages Deployment

If you're using the hosted version at `https://aidiscuss.tremech.us`, you need to configure CORS on your Ollama server.

### Docker Setup (Recommended for Local Servers)

If you're running Ollama in Docker on a local server:

1. Use the provided Docker Compose file:
   ```bash
   docker-compose up -d
   ```

2. Or run directly with Docker:
   ```bash   docker run -d \
     --name ollama \
     -p 11434:11434 \
     -e OLLAMA_ORIGINS="https://*.tremech.us,http://localhost:3000" \
     -v ollama:/root/.ollama \
     ollama/ollama
   ```

3. Update the Ollama Server URL in AI Discuss to your server's IP:
   ```
   http://YOUR_SERVER_IP:11434
   ```

### Quick Start Scripts
Run the provided batch script:
```cmd
start-ollama-with-cors.bat
```

### Quick Start (Linux/Mac)
Run the provided shell script:
```bash
chmod +x start-ollama-with-cors.sh
./start-ollama-with-cors.sh
```

### Manual Setup
Set the environment variable before starting Ollama:

**Windows:**
```cmd
set OLLAMA_ORIGINS=https://*.tremech.us,http://localhost:3000
ollama serve
```

**Linux/Mac:**
```bash
export OLLAMA_ORIGINS="https://*.tremech.us,http://localhost:3000"
ollama serve
```

For more detailed CORS setup instructions, see [CORS_SETUP.md](CORS_SETUP.md).

### Using the Application

#### Topic Page
1. **Ollama Server URL**: Enter your Ollama server URL (default: http://localhost:11434)
2. **Discussion Topic**: Enter the topic you want the AI models to discuss
3. **Model Configuration**: 
   - Select models from your Ollama server
   - Give each participant a name
   - Add personality profiles to guide their responses
4. **Begin Discussion**: Start the conversation once everything is configured

#### Discussion Page
- Watch the real-time conversation unfold
- Messages appear as they're generated
- Discussion automatically ends when one model says "that was a good chat"
- Use "New Topic" button to return to configuration

## Tech Stack

- **React 18**: Modern React with hooks
- **Ollama API**: Direct integration with Ollama chat API
- **CSS3**: Custom styling with gradients and animations
- **Local Storage**: Persistent configuration storage

## Project Structure

```
src/
├── components/
│   ├── TopicPage.jsx      # Configuration interface
│   └── DiscussionPage.jsx # Conversation interface
├── styles/
│   └── App.css           # All application styles
├── App.jsx               # Main application component
└── index.js              # Application entry point
```

## API Integration

The application communicates with Ollama using its REST API:

- **GET /api/tags**: Fetch available models
- **POST /api/chat**: Stream chat responses

## Features in Detail

### Real-time Streaming
- Messages appear character by character as they're generated
- Typing indicators show when AI is responding
- Automatic scrolling keeps latest messages visible

### Persistent Configuration
- All settings saved to browser's local storage
- Model selections, profiles, and server URLs persist
- Discussion topics remembered between sessions

### Responsive Design
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

## Development

### Available Scripts

- `npm start`: Runs the app in development mode
- `npm build`: Builds the app for production
- `npm test`: Launches the test runner
- `npm eject`: Ejects from Create React App

### Build for Production

```bash
npm run build
```

The build folder contains the production-ready files.

## License

This project is licensed under the MIT License.

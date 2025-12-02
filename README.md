# OpenChat - Modern LLaMA.cpp Web Interface

A modern, minimalistic web UI for chatting with AI models running on LLaMA.cpp servers. Built with Bun, Elysia, and modern web technologies.

## Features

- 🎨 **Modern Minimalistic Design** - Clean, responsive interface with dark/light theme support
- 🚀 **Real-time Chat** - WebSocket-based streaming responses from LLaMA.cpp models
- 🔧 **Easy Configuration** - Simple server connection and model selection
- 💾 **Chat History** - Local storage for conversation persistence
- 📱 **Mobile Responsive** - Works seamlessly on desktop and mobile devices
- ⚡ **High Performance** - Built with Bun for fast startup and execution
- 🌙 **Theme Support** - Switch between light and dark themes
- ⚙️ **Customizable Settings** - Adjust temperature, max tokens, and top-p parameters

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed on your system
- A running LLaMA.cpp server with HTTP API enabled

### Installation

1. Clone the repository:
```bash
git clone git@github.com:Trisert/openchat.git
cd openchat
```

2. Install dependencies:
```bash
bun install
```

3. Start the development server:
```bash
bun dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Usage

1. **Connect to LLaMA.cpp Server**:
   - Enter your LLaMA.cpp server URL (e.g., `http://localhost:8080`)
   - Select a model from the dropdown
   - Click "Connect"

2. **Start Chatting**:
   - Type your message in the input field
   - Press Enter or click Send
   - Watch the AI response stream in real-time

3. **Customize Settings**:
   - Click the settings icon (⚙️) to adjust parameters
   - Modify temperature, max tokens, and top-p values
   - Settings are automatically saved

## LLaMA.cpp Server Setup

Make sure your LLaMA.cpp server is running with HTTP API enabled. Example command:

```bash
./main -m your-model.gguf --host 0.0.0.0 --port 8080 -c 2048 --api
```

### Supported Endpoints

The application expects the following LLaMA.cpp API endpoints:

- `GET /health` - Health check
- `GET /v1/models` - List available models
- `POST /completion` - Generate completions with streaming support

## Project Structure

```
openchat/
├── public/                 # Static frontend files
│   ├── index.html         # Main application HTML
│   ├── css/
│   │   └── style.css      # Modern minimalistic styles
│   └── js/
│       └── app.js         # Frontend JavaScript
├── src/                   # Backend source code
│   ├── server.ts          # Main Bun server
│   ├── routes/
│   │   ├── chat.ts        # WebSocket chat routes
│   │   └── models.ts      # Model management routes
│   └── services/
│       └── llama-service.ts # LLaMA.cpp API client
├── package.json           # Project configuration
├── tsconfig.json          # TypeScript configuration
└── README.md             # This file
```

## Available Scripts

- `bun dev` - Start development server with hot reload
- `bun build` - Build for production
- `bun start` - Start production server
- `bun typecheck` - Run TypeScript type checking

## Configuration

### Environment Variables

You can configure the application using environment variables:

- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)

### Chat Settings

The application supports the following chat parameters:

- **Temperature** (0.0 - 2.0): Controls randomness in responses
- **Max Tokens** (1 - 4096): Maximum response length
- **Top P** (0.0 - 1.0): Nucleus sampling parameter

## Browser Support

- Chrome/Chromium 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Connection Issues

- Ensure your LLaMA.cpp server is running and accessible
- Check that the server URL is correct (include http:// or https://)
- Verify the model name matches exactly what's available on the server

### Performance Issues

- For large models, consider increasing the timeout in the LLaMA service
- Monitor your LLaMA.cpp server logs for any errors
- Ensure adequate system resources for both the web server and LLaMA.cpp

### Browser Issues

- Enable JavaScript in your browser
- Check browser console for any error messages
- Try clearing browser cache and cookies

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Bun](https://bun.sh/) - Fast JavaScript runtime
- [Elysia](https://elysiajs.com/) - Modern web framework
- [LLaMA.cpp](https://github.com/ggerganov/llama.cpp) - LLM inference engine
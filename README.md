# AI Group Chat

A WhatsApp-style group chat application that allows users to interact with multiple AI models simultaneously.

## Features

- **Multi-AI Conversations**: Chat with 6 different AI models (Gemini, GPT-4o mini, Claude, Llama, DeepSeek, Qwen) simultaneously
- **Reply-to-Message System**: WhatsApp-style reply functionality with direct conversation mode
- **Conversation Management**: Multiple conversation threads with automatic title generation
- **Provider Icons**: Official provider icons for each AI model with fallback support
- **Context Awareness**: Models reference previous messages and maintain conversation continuity
- **Real-time Streaming**: Server-sent events for real-time message delivery

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account and database setup
- OpenRouter API key

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in your Supabase and OpenRouter credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```

### Installation & Development

**Single Command Setup:**
```bash
# Install all dependencies (root, frontend, backend)
npm run install:all

# Start both frontend and backend servers
npm run dev
```

This will start:
- Backend server on http://localhost:7001
- Frontend server on http://localhost:5173

### Alternative Commands

```bash
# Development
npm run dev              # Start both servers
npm run dev:frontend     # Frontend only (port 5173)
npm run dev:backend      # Backend only (port 7001)

# Production
npm run build            # Build frontend for production
npm run start            # Start both in production mode

# Maintenance
npm run lint             # Lint frontend code
npm run clean            # Clean all node_modules and build files
npm run install:all      # Reinstall all dependencies
```

## Architecture

### Frontend (`frontend/`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS with custom WhatsApp theme
- **Components**: Single-file architecture in `App.jsx`

### Backend (`backend/`)
- **Framework**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenRouter API for multiple LLM access
- **Features**: Message streaming, conversation management, reply system

### Database
- **Provider**: Supabase (PostgreSQL)
- **Schema**: Users, conversations, messages, AI models
- **Features**: Reply tracking, conversation modes, context storage

## Project Structure

```
group-chat/
├── frontend/           # React frontend
│   ├── src/
│   │   ├── App.jsx    # Main application
│   │   ├── whatsapp.css
│   │   └── reply-styles.css
│   └── package.json
├── backend/            # Express backend
│   ├── index.js       # Main server
│   ├── database.js    # Database operations
│   └── package.json
├── prompts/           # AI prompt templates
├── .env               # Environment variables
└── package.json       # Root package (monorepo)
```

## Development Workflow

1. **Make changes** to frontend or backend code
2. **Hot reload** automatically updates the development servers
3. **Test features** at http://localhost:5173
4. **Check logs** in the terminal for both servers

## Key Features

### Reply System
- Click "Reply" on any AI message to start a 1-on-1 conversation
- Visual reply context with quoted original message
- Automatic mode switching between group and direct conversations

### Conversation Modes
- **Group Mode**: All AI models respond to your message
- **Direct Mode**: Only the replied-to model responds (triggered by replies)

### Provider Icons
- Official logos for Google, OpenAI, Anthropic, Meta, DeepSeek, Qwen
- Fallback colored avatars if icons fail to load

## Troubleshooting

### Common Issues
1. **Port conflicts**: Make sure ports 5173 and 7001 are available
2. **Environment variables**: Verify all required variables are set in `.env`
3. **Database connection**: Check Supabase credentials and network access

### Logs
- Frontend logs appear in browser console
- Backend logs appear in terminal
- Both servers log simultaneously when using `npm run dev`

## Contributing

1. Follow the existing code style (no TypeScript, ESLint rules)
2. Test both frontend and backend changes
3. Update documentation for new features
4. Ensure all environment variables are documented

## License

ISC
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a group chat application that allows users to interact with multiple AI models simultaneously in a WhatsApp-like interface. The architecture consists of:

- **Frontend**: React + Vite app with Tailwind CSS styling and custom WhatsApp-like UI
- **Backend**: Node.js Express server that orchestrates conversations between multiple AI models via OpenRouter API

## Development Commands

### Frontend (in `frontend/` directory)
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`  
- **Lint code**: `npm run lint`
- **Preview production build**: `npm run preview`

### Backend (in `backend/` directory)
- **Start development server**: `npm run dev`
- **Start production server**: `npm run start`

## Architecture

### Core Components

**Frontend (`frontend/src/App.jsx`)**:
- Single-page React app with main components in one file
- `App` - Main application component managing chat state and API calls
- `MessageBubble` - Renders individual chat messages with model attribution
- `ModelSelector` - Dropdown for choosing the first responder model
- `TypingIndicator` - Shows loading state during API calls
- `WhatsAppModelManager` - Advanced model selection with drag-and-drop ordering

**UI Components (`frontend/src/components/`):**
- ShadCN UI components for modern, accessible interface elements
- `ModelManager.jsx` - Custom WhatsApp-styled model manager with ShadCN integration
- `ui/avatar.tsx`, `ui/dropdown-menu.tsx`, `ui/button.tsx` - Reusable ShadCN components

**Backend (`backend/index.js`)**:
- Express server with single `/api/chat` endpoint
- Integrates with OpenRouter API to access multiple LLM models
- Uses prompt templates from `prompts/` directory for system instructions
- Implements "first responder" pattern where one model answers first, then others provide unique perspectives

### Key Features

1. **Model Orchestration**: The backend ensures each AI model provides a unique response by using different prompts
2. **Prompt Templates**: Located in `prompts/` directory:
   - `base-system.md` - Base instructions for first responder
   - `uniqueness.md` - Instructions for subsequent models to avoid repetition
3. **WhatsApp UI**: Custom CSS in `frontend/src/whatsapp.css` provides authentic WhatsApp styling
4. **Staggered Responses**: Models respond with artificial delays to simulate realistic conversation flow

### Configuration

- **Environment**: Backend requires `OPENROUTER_API_KEY` in `.env` file
- **Models**: Configured in `ALL_MODELS` array in backend and `MODELS` array in frontend
- **API Endpoint**: Frontend connects to backend on port 7001 by default
- **Character Limits**: Customizable character limit (50-2000) for AI responses
- **ShadCN Setup**: `components.json` configures ShadCN with Tailwind integration and path aliases

### Code Style

- **TypeScript Support**: Added TypeScript configuration for ShadCN UI components while maintaining JavaScript for main app
- **ESLint**: Frontend uses standard React ESLint rules with custom rule allowing unused vars starting with uppercase
- **Module Systems**: Frontend uses ES modules, backend uses CommonJS
- **Styling**: Tailwind CSS with custom WhatsApp theme overrides and ShadCN UI components

### Key Patterns

1. **Single File Components**: Frontend keeps all React components in `App.jsx` 
2. **Template Rendering**: Backend uses simple string replacement for prompt templates
3. **Error Handling**: Graceful degradation when models fail - returns error message instead of throwing
4. **Response Formatting**: Each model response includes model name, avatar, and message text

## Recent Updates (2025-01-09)

### Reply-to-Message Feature Implementation
Successfully implemented WhatsApp-style reply functionality with direct conversation mode:

**Core Features Added:**
- **Reply Button**: Added "Reply" button to all AI messages that enables 1-on-1 conversations
- **Reply Preview**: Visual reply context bar (blue/green) showing original message snippet
- **Direct Conversation Mode**: Clicking reply switches from group mode to direct mode with specific AI model
- **Visual Reply Context**: Messages show reply context with sender name and message preview

**Technical Implementation:**

**Frontend (`frontend/src/App.jsx`):**
- Added `replyToMessage` and `conversationMode` state management
- `handleReplyToMessage()` function sets reply context and switches to direct mode
- `MessageBubble` component enhanced with reply button and reply context display
- Added UUID validation to prevent replies to temporary/invalid message IDs
- Reply preview component with cancel functionality

**Backend (`backend/index.js`):**
- Enhanced `/api/chat` endpoint with `replyToMessageId` and `conversationMode` parameters
- Direct conversation mode filters conversation history to only include user + target model messages
- Proper fallback handling when reply messages can't be found (gracefully switches to group mode)
- Fixed const assignment errors and improved error handling

**Database (`backend/database.js`):**
- Schema-compatible implementation using existing database structure
- Reply information stored in `metadata` JSON field to avoid requiring new columns
- Added `getMessageById()` function for reply message lookup
- Proper error handling for UUID format validation

**Styling (`frontend/src/reply-styles.css`):**
- Complete reply UI styling matching WhatsApp design
- Light theme consistency for input area (removed dark mode elements)
- Fixed z-index issues that prevented button clicks (changed `.message` from `z-index: -1` to `z-index: 1`)
- Responsive reply button styling with hover effects

**Bug Fixes Resolved:**
1. **Z-index Click Issue**: Messages had `z-index: -1` making reply buttons unclickable
2. **UUID Format Errors**: Invalid message IDs were being sent to database causing PostgreSQL errors
3. **Const Assignment Errors**: Fixed variable scoping issues in conversation mode handling  
4. **Missing Message IDs**: Backend wasn't returning database IDs in API responses
5. **Mixed Model Outputs**: Direct conversation history now properly filtered per model
6. **Database Schema Compatibility**: Works with existing schema without requiring new columns

**Current Status:**
- ✅ Reply buttons are fully functional and clickable
- ✅ Reply preview displays correctly with proper WhatsApp-style UI
- ✅ Direct conversation mode works (only target model responds)
- ✅ Proper error handling and graceful fallbacks
- ✅ No more database or JavaScript errors
- ✅ Light theme consistency across interface

**Testing Notes:**
- Reply functionality works best with messages that have proper database UUIDs
- Temporary message IDs (generated during streaming) automatically fall back to group mode
- System gracefully handles missing reply messages and invalid UUIDs
- All error cases are properly handled without breaking the user experience

## Recent Updates (2025-01-26)

### ShadCN UI Migration and Enhanced Features
Successfully migrated from custom UI components to ShadCN UI for improved accessibility, styling, and maintainability:

**Core Features Added:**
- **Customizable Character Limit**: Replaced hardcoded 280-character limit with adjustable input field (50-2000 range)
- **Advanced Model Manager**: WhatsApp-styled dropdown with drag-and-drop model ordering and selection
- **ShadCN Profile Interface**: Professional dropdown menu with proper avatar and user info display
- **TypeScript Integration**: Added TypeScript support for UI components while maintaining JavaScript for main app

**Technical Implementation:**

**Frontend Architecture Updates:**
- **ShadCN Integration**: Added `components.json`, TypeScript config, and path aliases (`@/components/ui/*`)
- **Component Structure**: Moved from single-file to modular component architecture:
  - `frontend/src/components/ModelManager.jsx` - Custom model selection interface
  - `frontend/src/components/ui/` - Reusable ShadCN components (Avatar, DropdownMenu, Button, Dialog)
  - `frontend/src/lib/utils.ts` - Utility functions for component styling

**Profile Interface Improvements (`frontend/src/App.jsx`):**
- Replaced custom profile dropdown with ShadCN DropdownMenu for better accessibility
- Added ShadCN Avatar component with user initial fallback
- Removed unused `showUserMenu` state and event handlers (fixed JavaScript errors)
- Improved visual consistency with proper spacing and typography

**Model Management Features:**
- **Drag-and-Drop Ordering**: Users can reorder AI models by dragging to set response sequence
- **Visual Selection**: Clear indication of active/inactive models with WhatsApp-themed styling
- **Left-Side Positioning**: Dropdown appears on left to avoid overlaying chat messages
- **Responsive Design**: Proper scaling and collision avoidance for different screen sizes

**Styling and Design:**
- **WhatsApp Theme Integration**: Extended Tailwind config with WhatsApp color palette
- **ShadCN Customization**: Configured ShadCN components to match WhatsApp design patterns
- **CSS Organization**: Maintained existing WhatsApp styling while adding ShadCN integration
- **Accessibility**: Enhanced keyboard navigation and screen reader support through ShadCN

**Configuration Updates:**
- **Vite Config**: Added path aliases for clean imports (`@/components/ui/button`)
- **Tailwind Config**: Extended with WhatsApp colors and custom border radius utilities
- **Package Dependencies**: Added ShadCN, Radix UI, and related TypeScript dependencies
- **TypeScript Support**: Dual JS/TS setup allowing gradual migration if needed

**Bug Fixes Resolved:**
1. **CSS Positioning Issues**: Eliminated z-index conflicts and dropdown placement problems
2. **JavaScript Runtime Errors**: Fixed undefined state variable references after migration
3. **Model Selection State**: Proper state management for selected models array
4. **Character Limit Persistence**: User's character limit preference maintained across sessions
5. **Mobile Responsiveness**: Improved touch interaction and responsive breakpoints

**Current Status:**
- ✅ ShadCN UI components fully integrated and functional
- ✅ Custom character limits working (50-2000 range)
- ✅ Advanced model manager with drag-and-drop ordering
- ✅ Professional profile interface with proper accessibility
- ✅ No JavaScript errors or CSS conflicts
- ✅ Maintained WhatsApp visual design consistency
- ✅ TypeScript support ready for future expansion

**Development Notes:**
- ShadCN components are built on Radix UI primitives for maximum accessibility
- WhatsApp color scheme preserved throughout the ShadCN integration
- Path aliases (`@/`) simplify component imports and improve maintainability
- Dual JavaScript/TypeScript setup allows incremental adoption of TypeScript
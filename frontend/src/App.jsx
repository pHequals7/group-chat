import React, { useState, useEffect, useRef } from 'react';
import './reply-styles.css';
import { useAuth } from './AuthContext';
import WhatsAppModelManager from './components/ModelManager';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Configuration ---
const MODELS = [
    { id: "google/gemini-2.5-flash", name: "Gemini" },
    { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude" },
    { id: "meta-llama/llama-3-8b-instruct", name: "Llama" },
    { id: "deepseek/deepseek-chat", name: "DeepSeek Chat" },
    { id: "qwen/qwen-2.5-7b-instruct", name: "Qwen" },
    { id: "moonshotai/kimi-k2", name: "Kimi K2" },
];
const BACKEND_URL = 'http://localhost:7001';

// --- Main App Component ---
function App() {
    const { user, signOut, session } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [firstResponder, setFirstResponder] = useState(MODELS[0].id);
    const [isLoading, setIsLoading] = useState(false);
    const [typingModel, setTypingModel] = useState(null);
    const [conversationTitle, setConversationTitle] = useState('AI Group Chat');
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [replyToMessage, setReplyToMessage] = useState(null);
    const [conversationMode, setConversationMode] = useState('group');
    const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'profile'
    const [userPrompts, setUserPrompts] = useState([]);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [characterLimit, setCharacterLimit] = useState(280);
    const [selectedModels, setSelectedModels] = useState(MODELS.map(m => m.id));
    const chatContainerRef = useRef(null);

    // Helper function to get auth headers
    const getAuthHeaders = () => {
        const headers = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
            headers.Authorization = `Bearer ${session.access_token}`;
        }
        return headers;
    };

    // Load existing messages on component mount
    useEffect(() => {
        const initializeApp = async () => {
            await loadConversations();
            await loadMessages();
        };
        initializeApp();
    }, []);

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversationId && conversations.length > 0) {
            loadMessages();
        }
    }, [activeConversationId, conversations]);

    // Auto-scroll to the latest message
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);


    const loadConversations = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/conversations`, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const loadedConversations = await response.json();
                setConversations(loadedConversations);

                // If no active conversation is set and we have conversations, set the first one as active
                if (!activeConversationId && loadedConversations.length > 0) {
                    setActiveConversationId(loadedConversations[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load conversations:', error);
        }
    };

    const loadMessages = async () => {
        try {
            const url = activeConversationId 
                ? `${BACKEND_URL}/api/conversations/${activeConversationId}/messages`
                : `${BACKEND_URL}/api/messages`;
            
            console.log('Loading messages from:', url);
            
            const response = await fetch(url, {
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const loadedMessages = await response.json();
                console.log('Loaded messages:', loadedMessages.length);
                
                // Ensure messages have IDs and proper format
                const processedMessages = loadedMessages.map(msg => {
                    const processed = {
                        ...msg,
                        id: msg.id || `temp_${Date.now()}_${Math.random()}`, // Temporary ID for messages without DB ID
                        sender: msg.sender_type || msg.sender, // Handle both formats
                        text: msg.content || msg.text, // Handle both formats
                        time: new Date(msg.created_at || msg.time), // Handle both formats
                        model: msg.ai_models?.name || msg.model // Handle model name
                    };

                    // Parse metadata for reply information
                    if (msg.metadata) {
                        try {
                            const metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
                            console.log('📖 Processing message metadata for msg', msg.id, ':', metadata);
                            if (metadata.reply_to_message_id) {
                                processed.replyToMessageId = metadata.reply_to_message_id;
                                console.log('🔗 Found reply relationship:', processed.replyToMessageId);
                            }
                            if (metadata.conversation_mode === 'direct' || metadata.is_direct_reply) {
                                processed.isDirectReply = true;
                                console.log('💬 Marked as direct reply');
                            }
                        } catch (e) {
                            console.warn('Failed to parse message metadata:', e);
                        }
                    }

                    console.log('Processed message:', processed);
                    return processed;
                });

                // Second pass: resolve reply relationships
                const messagesWithReplies = processedMessages.map(msg => {
                    if (msg.replyToMessageId) {
                        // Find the message this is replying to
                        const replyToMessage = processedMessages.find(m => m.id === msg.replyToMessageId);
                        console.log('🔍 Looking for reply target:', msg.replyToMessageId, 'found:', !!replyToMessage);
                        if (replyToMessage) {
                            msg.replyTo = {
                                id: replyToMessage.id,
                                text: replyToMessage.text,
                                model: replyToMessage.model,
                                sender: replyToMessage.sender
                            };
                        }
                    }
                    return msg;
                });

                setMessages(messagesWithReplies);

                // Update conversation title based on active conversation
                const activeConv = conversations.find(c => c.id === activeConversationId);
                if (activeConv) {
                    setConversationTitle(activeConv.title || 'AI Group Chat');
                }
                
                // Generate title if we have user messages and no custom title
                const hasUserMessages = processedMessages.some(msg => msg.sender === 'user');
                if (hasUserMessages && (!activeConv || activeConv.title === 'New Chat')) {
                    generateTitle();
                }
            } else {
                console.error('Failed to load messages, status:', response.status, response.statusText);
                // Try fallback to old API
                const fallbackResponse = await fetch(`${BACKEND_URL}/api/messages`);
                if (fallbackResponse.ok) {
                    const loadedMessages = await fallbackResponse.json();
                    const processedMessages = loadedMessages.map(msg => {
                        const processed = {
                            ...msg,
                            id: msg.id || Date.now() + Math.random(),
                            sender: msg.sender_type || msg.sender,
                            text: msg.content || msg.text,
                            time: new Date(msg.created_at || msg.time)
                        };

                        // Parse metadata for reply information (fallback)
                        if (msg.metadata) {
                            try {
                                const metadata = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : msg.metadata;
                                if (metadata.reply_to_message_id) {
                                    processed.replyToMessageId = metadata.reply_to_message_id;
                                }
                                if (metadata.conversation_mode === 'direct' || metadata.is_direct_reply) {
                                    processed.isDirectReply = true;
                                }
                            } catch (e) {
                                console.warn('Failed to parse fallback message metadata:', e);
                            }
                        }

                        return processed;
                    });

                    // Resolve reply relationships for fallback messages
                    const messagesWithReplies = processedMessages.map(msg => {
                        if (msg.replyToMessageId) {
                            const replyToMessage = processedMessages.find(m => m.id === msg.replyToMessageId);
                            if (replyToMessage) {
                                msg.replyTo = {
                                    id: replyToMessage.id,
                                    text: replyToMessage.text,
                                    model: replyToMessage.model,
                                    sender: replyToMessage.sender
                                };
                            }
                        }
                        return msg;
                    });
                    setMessages(messagesWithReplies);
                }
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            // Fallback to default welcome message if loading fails
            setMessages([
                { id: 'welcome', sender: 'system', text: 'Welcome to the AI Group Chat! Select a First Responder and ask a question to begin.', time: new Date() }
            ]);
        }
    };

    const createNewConversation = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/conversations`, {
                method: 'POST',
                headers: getAuthHeaders()
            });
            if (response.ok) {
                const newConversation = await response.json();
                setActiveConversationId(newConversation.id);
                await loadConversations(); // Refresh conversation list
            }
        } catch (error) {
            console.error('Failed to create new conversation:', error);
        }
    };

    const generateTitle = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/generate-title`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: activeConversationId })
            });
            if (response.ok) {
                const { title } = await response.json();
                setConversationTitle(title);
                // Refresh conversations to show updated title in sidebar
                await loadConversations();
            }
        } catch (error) {
            console.error('Failed to generate title:', error);
        }
    };

    const handleReplyToMessage = (message) => {
        
        // Don't allow replies to temporary IDs or invalid UUID formats (not stored in database)
        const messageId = message.id && message.id.toString();
        const isValidUUID = messageId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(messageId);
        const isTempId = messageId && messageId.startsWith('temp_');
        
        if (!isValidUUID || isTempId) {
            setReplyToMessage(null);
            setConversationMode('group');
            return;
        }
        
        setReplyToMessage(message);
        if (message.sender === 'ai') {
            setConversationMode('direct');
        }
    };

    const clearReply = () => {
        setReplyToMessage(null);
        setConversationMode('group');
    };

    const handleStreamEvent = (data) => {
        switch (data.type) {
            case 'typing':
                setTypingModel({
                    model: data.model,
                    avatar: data.avatar
                });
                break;
                
            case 'message':
                // Clear typing indicator and add message
                setTypingModel(null);
                const aiMessage = {
                    id: `temp_ai_${Date.now()}_${Math.random()}`, // Temporary ID for streaming messages
                    sender: 'ai',
                    model: data.model,
                    avatar: data.avatar,
                    text: data.text,
                    time: new Date(),
                    isDirectReply: data.isDirectReply || false
                };
                setMessages(prev => [...prev, aiMessage]);
                
                // Clear reply if this was a direct response
                if (data.isDirectReply) {
                    setReplyToMessage(null);
                    setConversationMode('group');
                }
                break;
                
            case 'complete':
                setTypingModel(null);
                setIsLoading(false);
                
                // Generate title after first successful message exchange
                setTimeout(() => generateTitle(), 1000);
                break;
                
            case 'error':
                setTypingModel(null);
                setIsLoading(false);
                setMessages(prev => [...prev, { 
                    sender: 'system', 
                    text: `Error: ${data.message}`, 
                    time: new Date() 
                }]);
                break;
        }
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const promptToSend = input;
        const replyToId = replyToMessage?.id;
        const currentMode = conversationMode;
        
        setInput('');
        setIsLoading(true);
        setTypingModel(null);

        // Add user message immediately with reply context
        const userMessage = { 
            id: Date.now() + Math.random(), // Temporary ID
            sender: 'user', 
            text: promptToSend, 
            time: new Date(),
            replyTo: replyToMessage
        };
        setMessages(prev => [...prev, userMessage]);

        // Clear reply after sending
        if (replyToMessage) {
            setReplyToMessage(null);
        }

        try {
            // Use fetch with streaming instead of EventSource for POST data
            const response = await fetch(`${BACKEND_URL}/api/chat`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    prompt: promptToSend,
                    firstResponder,
                    conversationId: activeConversationId,
                    replyToMessageId: replyToId,
                    conversationMode: currentMode,
                    characterLimit: characterLimit,
                    selectedModels: selectedModels
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            handleStreamEvent(data);
                        } catch (e) {
                            console.warn('Failed to parse SSE data:', line);
                        }
                    }
                }
            }

        } catch (error) {
            console.error("Failed to connect to backend:", error);
            setIsLoading(false);
            setTypingModel(null);
            setMessages(prev => [...prev, { 
                id: Date.now() + Math.random(),
                sender: 'system', 
                text: `Error: ${error.message}`, 
                time: new Date() 
            }]);
        }
    };

    // ===== PROMPT MANAGEMENT FUNCTIONS =====

    const loadPrompts = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/prompts`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const prompts = await response.json();
                setUserPrompts(prompts);
            } else {
                console.error('Failed to load prompts:', response.status);
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
        }
    };

    const savePrompt = async (prompt) => {
        try {
            const url = prompt.id
                ? `${BACKEND_URL}/api/prompts/${prompt.id}`
                : `${BACKEND_URL}/api/prompts`;

            const method = prompt.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(prompt)
            });

            if (response.ok) {
                await loadPrompts(); // Reload prompts
                setEditingPrompt(null);
            } else {
                console.error('Failed to save prompt:', response.status);
            }
        } catch (error) {
            console.error('Error saving prompt:', error);
        }
    };

    const deletePrompt = async (promptId) => {
        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/prompts/${promptId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (response.ok) {
                await loadPrompts(); // Reload prompts
            } else {
                console.error('Failed to delete prompt:', response.status);
            }
        } catch (error) {
            console.error('Error deleting prompt:', error);
        }
    };

    // Load prompts when user changes or view changes to profile
    useEffect(() => {
        if (user && currentView === 'profile') {
            loadPrompts();
        }
    }, [user, currentView]);

    return (
        <div className="page">
            <div className="main-container">
                <Sidebar
                    conversations={conversations}
                    activeConversationId={activeConversationId}
                    onConversationSelect={setActiveConversationId}
                    onNewConversation={createNewConversation}
                    onProfileClick={() => setCurrentView(currentView === 'profile' ? 'chat' : 'profile')}
                />
                {currentView === 'profile' ? (
                    <ProfileView
                        userPrompts={userPrompts}
                        onSave={savePrompt}
                        onDelete={deletePrompt}
                        editingPrompt={editingPrompt}
                        setEditingPrompt={setEditingPrompt}
                        user={user}
                        onBack={() => setCurrentView('chat')}
                    />
                ) : (
                    <div className="chat">
                        <div className="chat-container">
                            <div className="user-bar">
                                <div className="user-info">
                                    <div className="avatar"><div style={{width:36,height:36,background:'#00a884',borderRadius:'50%',display:'block'}}/></div>
                                    <div className="name">{conversationTitle}<span className="status"> Online</span></div>
                                </div>
                            <div className="actions-group">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer">
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback className="bg-whatsapp-green text-white text-sm font-bold">
                                                {user?.email?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                            <span className="text-sm text-white/90">{user?.email || 'User'}</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Signed in as
                                                </p>
                                                <p className="text-sm font-medium leading-none">{user?.email}</p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={signOut}
                                            className="text-red-600 focus:text-red-600 cursor-pointer"
                                        >
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <div className="conversation">
                            <div className="conversation-container" ref={chatContainerRef}>
                                {messages.map((msg, index) => (
                                    <MessageBubble 
                                        key={index} 
                                        msg={msg} 
                                        onReply={handleReplyToMessage}
                                    />
                                ))}
                                {isLoading && typingModel && <TypingIndicator model={typingModel} />}
                            </div>
                            <div className="conversation-compose">
                                {replyToMessage && <ReplyPreview message={replyToMessage} onClear={clearReply} />}
                                <div className="input-row">
                                    {conversationMode === 'direct' ? (
                                        <ModelSelector selected={firstResponder} setSelected={setFirstResponder} disabled={true} />
                                    ) : (
                                        <WhatsAppModelManager selectedModels={selectedModels} setSelectedModels={setSelectedModels} disabled={isLoading} />
                                    )}
                                    <input
                                        className="input-msg"
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                                        placeholder={replyToMessage ? `Replying to ${replyToMessage.model || 'User'}...` : "Type a message"}
                                    />
                                    <input
                                        className="char-limit-input"
                                        type="number"
                                        min="50"
                                        max="2000"
                                        value={characterLimit}
                                        onChange={e => setCharacterLimit(parseInt(e.target.value) || 280)}
                                        placeholder="280"
                                        title="Character limit for responses"
                                    />
                                    <button className="send" onClick={handleSend} disabled={isLoading || !input.trim()}>
                                        <div className="circle"><SendIcon /></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}

// --- UI Components ---

// Provider icon component with fallback
const ProviderIcon = ({ modelId, size = 24 }) => {
    const [iconError, setIconError] = useState(false);
    
    // Map model IDs to provider names
    const getProviderFromModel = (modelId) => {
        if (modelId.startsWith('google/')) return 'google';
        if (modelId.startsWith('openai/')) return 'openai';
        if (modelId.startsWith('anthropic/')) return 'anthropic';
        if (modelId.startsWith('meta-llama/')) return 'meta';
        if (modelId.startsWith('deepseek/')) return 'deepseek';
        if (modelId.startsWith('qwen/')) return 'qwen';
        if (modelId.startsWith('moonshotai/')) return 'moonshot';
        return 'default';
    };

    const provider = getProviderFromModel(modelId);
    const iconPath = `/icons/${provider}.svg`;

    if (iconError || provider === 'default') {
        // Fallback to text avatar
        const initial = provider.charAt(0).toUpperCase();
        const colors = {
            'google': '#4285F4',
            'openai': '#00A67E',
            'anthropic': '#D97757',
            'meta': '#1877F2',
            'deepseek': '#6366F1',
            'qwen': '#EF4444',
            'default': '#6B7280'
        };
        
        return (
            <div 
                className="provider-icon fallback"
                style={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    backgroundColor: colors[provider],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: Math.max(10, size * 0.4)
                }}
            >
                {initial}
            </div>
        );
    }

    return (
        <img 
            src={iconPath}
            alt={`${provider} icon`}
            className="provider-icon"
            style={{ width: size, height: size, borderRadius: '50%' }}
            onError={() => setIconError(true)}
        />
    );
};

// Reply preview component (WhatsApp-style)
const ReplyPreview = ({ message, onClear }) => (
    <div className="reply-preview">
        <div className="reply-bar"></div>
        <div className="reply-content">
            <div className="reply-header">
                <span className="reply-sender">{message.model || 'You'}</span>
                <button className="reply-close" onClick={onClear}>×</button>
            </div>
            <div className="reply-text">
                {message.text.length > 50 ? message.text.substring(0, 50) + '...' : message.text}
            </div>
        </div>
    </div>
);

const Sidebar = ({ conversations, activeConversationId, onConversationSelect, onNewConversation, onProfileClick }) => (
    <div className="sidebar">
        <div className="sidebar-header">
            <div className="avatar">
                <img src="/robot.jpg" alt="user avatar" />
            </div>
            <div className="sidebar-actions">
                <button
                    className="new-chat-btn"
                    onClick={onProfileClick}
                    title="Profile & Settings"
                    style={{
                        background: '#00a884',
                        marginRight: '8px'
                    }}
                >
                    ⚙️
                </button>
                <button
                    className="new-chat-btn"
                    onClick={onNewConversation}
                    title="New Chat"
                >
                    +
                </button>
            </div>
        </div>
        <div className="sidebar-search">
            <input type="text" placeholder="Search or start new chat" />
        </div>
        <div className="chat-list">
            {conversations.map((conversation) => {
                let lastMessage = "Click to open conversation";
                if (conversation.last_message) {
                    const msg = conversation.last_message;
                    if (msg.sender_type === 'user') {
                        lastMessage = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
                    } else if (msg.sender_type === 'ai' && msg.ai_models) {
                        const content = msg.content.length > 40 ? msg.content.substring(0, 40) + '...' : msg.content;
                        lastMessage = `${msg.ai_models.name}: ${content}`;
                    } else if (msg.sender_type === 'system') {
                        lastMessage = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
                    }
                }
                
                return (
                    <ChatListItem
                        key={conversation.id}
                        name={conversation.title || 'New Chat'}
                        lastMessage={lastMessage}
                        time={conversation.updated_at ? formatConversationTime(conversation.updated_at) : ''}
                        avatar="/robot.jpg"
                        isActive={conversation.id === activeConversationId}
                        onClick={() => onConversationSelect(conversation.id)}
                    />
                );
            })}
        </div>
    </div>
);

const ChatListItem = ({ name, lastMessage, time, avatar, isActive, onClick }) => (
    <div 
        className={`chat-list-item ${isActive ? 'active' : ''}`}
        onClick={onClick}
    >
        <div className="avatar">
            <img src={avatar} alt="avatar" />
        </div>
        <div className="chat-details">
            <div className="chat-name">{name}</div>
            <div className="last-message">{lastMessage}</div>
        </div>
        <div className="chat-time">{time}</div>
    </div>
);


const ChatHeader = () => (
    <header className="flex items-center justify-between px-4 py-2 bg-[#202c33] text-white select-none">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-lg font-bold text-white">
                AI
            </div>
            <div>
                <h1 className="text-base font-semibold leading-tight">AI Group Chat</h1>
                <p className="text-[13px] text-gray-300 leading-tight">Gemini, GPT, Claude, Llama</p>
            </div>
        </div>
        <div className="flex items-center gap-4 opacity-80">
            <HeaderIcon title="Search">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M21.53 20.47l-3.66-3.66a8.5 8.5 0 10-1.06 1.06l3.66 3.66a.75.75 0 101.06-1.06zM10.5 18a7.5 7.5 0 110-15 7.5 7.5 0 010 15z"/></svg>
            </HeaderIcon>
            <HeaderIcon title="Menu">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
            </HeaderIcon>
        </div>
    </header>
);

const HeaderIcon = ({ children, title }) => (
    <button title={title} className="p-2 rounded-full hover:bg-white/10 transition-colors">
        {children}
    </button>
);

const ChatWindow = ({ messages, isLoading, chatEndRef }) => (
    <main
        className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 bg-[length:400px_400px]"
        style={{
            backgroundImage:
                "url('data:image/svg+xml;utf8, %3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 100 100%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.04%22%3E%3Ccircle cx=%225%22 cy=%225%22 r=%223%22/%3E%3Ccircle cx=%2255%22 cy=%2255%22 r=%223%22/%3E%3Ccircle cx=%2295%22 cy=%2290%22 r=%222%22/%3E%3Ccircle cx=%2225%22 cy=%2275%22 r=%222%22/%3E%3C/g%3E%3C/svg%3E')",
            backgroundColor: '#111b21'
        }}
    >
        <div className="max-w-3xl mx-auto space-y-1">
            {messages.map((msg, index) => <MessageBubble key={index} msg={msg} />)}
            {isLoading && <TypingIndicator />}
            <div ref={chatEndRef} />
        </div>
    </main>
);

// Helper function to get CSS class for AI model
const getModelColorClass = (modelName) => {
    const modelMap = {
        'Gemini': 'model-gemini',
        'GPT-4o mini': 'model-gpt-4o-mini',
        'Claude': 'model-claude',
        'Llama': 'model-llama',
        'DeepSeek Chat': 'model-deepseek-chat',
        'Qwen': 'model-qwen',
        'Kimi K2': 'model-kimi-k2'
    };
    return modelMap[modelName] || 'model-default';
};

const MessageBubble = ({ msg, onReply }) => {
    
    if (msg.sender === 'system') {
        return (
            <div className="message received" style={{textAlign:'center', maxWidth:'60%', marginLeft:'20%', marginRight:'20%'}}>
                {msg.text}
                <span className="metadata"><span className="time">{formatTime(msg.time)}</span></span>
            </div>
        );
    }

    const isUser = msg.sender === 'user';
    const bubbleClasses = isUser ? 'message sent' : 'message received';
    const modelColorClass = !isUser && msg.model ? getModelColorClass(msg.model) : '';

    const handleReplyClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onReply && typeof onReply === 'function') {
            onReply(msg);
        }
    };

    return (
        <div className={`${bubbleClasses} ${msg.isDirectReply ? 'direct-reply' : ''}`}>
            {/* Reply context if this message is replying to another AND it's a direct reply */}
            {msg.replyTo && msg.isDirectReply && (
                <div className="reply-context">
                    <div className="reply-context-bar"></div>
                    <div className="reply-context-content">
                        <span className="reply-context-sender">{msg.replyTo.model || 'You'}</span>
                        <span className="reply-context-text">
                            {msg.replyTo.text && msg.replyTo.text.length > 30 ? msg.replyTo.text.substring(0, 30) + '...' : msg.replyTo.text}
                        </span>
                    </div>
                </div>
            )}
            
            {/* Message header with icon and model name for AI messages */}
            {!isUser && (
                <div className="message-header">
                    <ProviderIcon modelId={MODELS.find(m => m.name === msg.model)?.id || msg.model} size={20} />
                    <strong className={`${modelColorClass}`} style={{fontSize:12,marginLeft:6,fontWeight:600}}>
                        {msg.model}
                        {msg.isDirectReply && <span className="direct-indicator"> • Direct reply</span>}
                    </strong>
                </div>
            )}
            
            {/* Message content */}
            <div className="message-content">
                {msg.text}
            </div>
            
            {/* Message metadata and actions */}
            <div className="message-footer">
                <span className="metadata">
                    <span className="time">{formatTime(msg.time)}</span>
                </span>
                {!isUser && (
                    <button 
                        className="reply-button" 
                        onClick={handleReplyClick} 
                        title="Reply to this message"
                    >
                        Reply
                    </button>
                )}
            </div>
        </div>
    );
};

const MessageInput = ({ input, setInput, onSend, isLoading, firstResponder, setFirstResponder }) => (
    <footer className="px-3 py-2 bg-[#202c33]">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
            <ModelSelector selected={firstResponder} setSelected={setFirstResponder} disabled={isLoading} />
            <button className="p-2 rounded-full text-gray-300 hover:bg-white/10" title="Emoji">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-3 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm6 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 18a5.5 5.5 0 01-5-3h10a5.5 5.5 0 01-5 3z"/></svg>
            </button>
            <div className="flex-1">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && onSend()}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#2a3942] text-[#e9edef] rounded-lg focus:outline-none placeholder:text-gray-400"
                    placeholder="Type a message"
                />
            </div>
            <button
                onClick={onSend}
                disabled={isLoading || !input.trim()}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${input.trim() ? 'bg-[#00a884] text-white hover:brightness-110' : 'bg-[#2a3942] text-gray-300'} disabled:opacity-50`}
                title="Send"
            >
                <SendIcon />
            </button>
        </div>
    </footer>
);

const ModelSelector = ({ selected, setSelected, disabled }) => (
    <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        disabled={disabled}
        className="py-2.5 px-3 border-none rounded-lg bg-[#2a3942] text-[#e9edef] focus:outline-none cursor-pointer disabled:opacity-50"
    >
        {MODELS.map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
        ))}
    </select>
);


const TypingIndicator = ({ model }) => (
    <div className="message received">
        <strong className={getModelColorClass(model?.model)} style={{display:'block',fontSize:12,marginBottom:4,fontWeight:600}}>
            {model?.model} is typing...
        </strong>
        <div className="flex items-center space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"/>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"/>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"/>
        </div>
        <span className="metadata">
            <span className="time">{formatTime(new Date())}</span>
        </span>
    </div>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
);

// ===== PROFILE VIEW COMPONENT =====
const ProfileView = ({ userPrompts, onSave, onDelete, editingPrompt, setEditingPrompt, user, onBack }) => {
    const promptTypes = [
        { key: 'base-system', label: 'Base System Prompt', description: 'The main system prompt for first responders in group chat' },
        { key: 'uniqueness', label: 'Uniqueness Prompt', description: 'Instructions for subsequent AI models to provide unique perspectives' },
        { key: 'thread-context', label: 'Thread Context Prompt', description: 'Instructions for ongoing conversation threads' },
        { key: 'direct-conversation', label: 'Direct Conversation Prompt', description: 'Instructions for 1-on-1 conversations with specific AI models' }
    ];

    const getPromptsForType = (type) => userPrompts.filter(p => p.prompt_type === type);

    const getDefaultPromptForType = (type) => {
        // System default prompts (fallback if no custom prompt exists)
        const systemDefaults = {
            'base-system': `You are one of several AI assistants in a coordinated group chat. Reply concisely and with high signal density. Avoid filler and restating the question. Prefer direct, practical guidance but with a jovial tone since this is a group chat at the end of the day.

Constraints:
- Max length: {{MAX_CHARS}} characters
- Response must be plain text only
- If unsure, say so briefly and suggest one concrete next step`,

            'uniqueness': `You are an AI assistant in a group chat. Your goal is to provide a unique perspective versus prior assistant answers.

Rules:
- Do not repeat core ideas, conclusions, or primary examples already given.
- Offer a NEW angle, method, or tradeoff the others missed. If the previous messages have missed an important point you should address them - but do not mention "New perspective" or any variations of that in your output responses
- Stay within {{MAX_CHARS}} characters.
- Plain text only.

Context:
- Original user question: "{{USER_PROMPT}}"
- Previous assistant answers:
{{PRIOR_ANSWERS}}`,

            'thread-context': `You are continuing an ongoing conversation thread. Maintain context and build upon previous messages while staying focused and concise.

Context:
{{CONVERSATION_HISTORY}}

Constraints:
- Max length: {{MAX_CHARS}} characters
- Plain text only
- Reference previous context when relevant`,

            'direct-conversation': `You are in a direct 1-on-1 conversation with the user. Provide focused, personalized responses.

Constraints:
- Max length: {{MAX_CHARS}} characters
- Plain text only
- Direct and conversational tone`
        };
        return systemDefaults[type] || '';
    };

    return (
        <div className="profile-view" style={{ height: '100vh', overflow: 'hidden', width: '100%' }}>
            <div className="user-bar">
                <div className="user-info">
                    <button
                        onClick={onBack}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            fontSize: '18px',
                            marginRight: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        ←
                    </button>
                    <div className="avatar"><div style={{width:36,height:36,background:'#00a884',borderRadius:'50%',display:'block'}}/></div>
                    <div className="name">Profile & Settings<span className="status"> {user?.email}</span></div>
                </div>
            </div>

            <div style={{ height: 'calc(100vh - 55px)', overflowY: 'auto', padding: '20px', background: '#111b21' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ color: '#e9edef', marginBottom: '20px', fontSize: '24px' }}>Custom AI Prompts</h2>
                    <p style={{ color: '#aebac1', marginBottom: '30px', fontSize: '16px', lineHeight: '1.5' }}>
                        Customize the system prompts used by AI models in different conversation contexts.
                    </p>

                    {promptTypes.map(type => {
                        const typePrompts = getPromptsForType(type.key);
                        const activePrompt = typePrompts.find(p => p.is_active && p.is_default);

                        return (
                            <div key={type.key} style={{
                                background: '#202c33',
                                borderRadius: '8px',
                                padding: '20px',
                                marginBottom: '20px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <div>
                                        <h3 style={{ color: '#ffffff', margin: 0, fontSize: '18px' }}>{type.label}</h3>
                                        <p style={{ color: '#aebac1', fontSize: '15px', margin: '8px 0 0 0', lineHeight: '1.4' }}>
                                            {type.description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEditingPrompt({
                                            prompt_type: type.key,
                                            title: `My ${type.label}`,
                                            content: '',
                                            is_default: true
                                        })}
                                        style={{
                                            background: '#00a884',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        + Add Custom
                                    </button>
                                </div>

                                {activePrompt ? (
                                    <div style={{
                                        background: '#111b21',
                                        padding: '15px',
                                        borderRadius: '6px',
                                        border: '1px solid #333'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '10px'
                                        }}>
                                            <h4 style={{ color: '#00a884', margin: 0, fontSize: '14px' }}>
                                                {activePrompt.title}
                                            </h4>
                                            <div>
                                                <button
                                                    onClick={() => setEditingPrompt(activePrompt)}
                                                    style={{
                                                        background: 'transparent',
                                                        color: '#8696a0',
                                                        border: '1px solid #8696a0',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        marginRight: '8px'
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                                {activePrompt.user_id !== '00000000-0000-0000-0000-000000000001' && (
                                                    <button
                                                        onClick={() => onDelete(activePrompt.id)}
                                                        style={{
                                                            background: 'transparent',
                                                            color: '#f87171',
                                                            border: '1px solid #f87171',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <pre style={{
                                            color: '#e9edef',
                                            fontSize: '13px',
                                            whiteSpace: 'pre-wrap',
                                            margin: 0
                                        }}>
                                            {activePrompt.content.length > 200
                                                ? activePrompt.content.substring(0, 200) + '...'
                                                : activePrompt.content
                                            }
                                        </pre>
                                    </div>
                                ) : (
                                    <div style={{
                                        background: '#0f1419',
                                        padding: '15px',
                                        borderRadius: '6px',
                                        border: '1px solid #2a3942'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            marginBottom: '10px'
                                        }}>
                                            <h4 style={{ color: '#8696a0', margin: 0, fontSize: '14px' }}>
                                                System Default
                                            </h4>
                                            <button
                                                onClick={() => setEditingPrompt({
                                                    prompt_type: type.key,
                                                    title: `My ${type.label}`,
                                                    content: getDefaultPromptForType(type.key),
                                                    is_default: true
                                                })}
                                                style={{
                                                    background: '#00a884',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                Customize
                                            </button>
                                        </div>
                                        <pre style={{
                                            color: '#aebac1',
                                            fontSize: '13px',
                                            whiteSpace: 'pre-wrap',
                                            margin: 0
                                        }}>
                                            {getDefaultPromptForType(type.key).length > 200
                                                ? getDefaultPromptForType(type.key).substring(0, 200) + '...'
                                                : getDefaultPromptForType(type.key)
                                            }
                                        </pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Prompt Modal */}
            {editingPrompt && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#202c33',
                        borderRadius: '8px',
                        padding: '20px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ color: '#e9edef', marginBottom: '20px' }}>
                            {editingPrompt.id ? 'Edit Prompt' : 'Add New Prompt'}
                        </h3>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#e9edef', display: 'block', marginBottom: '5px' }}>
                                Title
                            </label>
                            <input
                                type="text"
                                value={editingPrompt.title}
                                onChange={(e) => setEditingPrompt({ ...editingPrompt, title: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#111b21',
                                    color: '#e9edef',
                                    border: '1px solid #333',
                                    borderRadius: '4px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ color: '#e9edef', display: 'block', marginBottom: '5px' }}>
                                Content
                            </label>
                            <textarea
                                value={editingPrompt.content}
                                onChange={(e) => setEditingPrompt({ ...editingPrompt, content: e.target.value })}
                                rows={10}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: '#111b21',
                                    color: '#e9edef',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    resize: 'vertical'
                                }}
                                placeholder="Enter your custom prompt here..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setEditingPrompt(null)}
                                style={{
                                    background: 'transparent',
                                    color: '#8696a0',
                                    border: '1px solid #8696a0',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave(editingPrompt)}
                                disabled={!editingPrompt.title || !editingPrompt.content}
                                style={{
                                    background: '#00a884',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    opacity: (!editingPrompt.title || !editingPrompt.content) ? 0.5 : 1
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;

function formatTime(dateLike) {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function formatConversationTime(dateLike) {
    const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    const daysDiff = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) {
        // Today - show time
        return formatTime(d);
    } else if (daysDiff === 1) {
        // Yesterday
        return 'Yesterday';
    } else if (daysDiff < 7) {
        // This week - show day name
        return d.toLocaleDateString([], { weekday: 'short' }); // Mon, Tue, etc.
    } else if (daysDiff < 365) {
        // This year - show month and day
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }); // Dec 15
    } else {
        // Older than a year - show month, day, year
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); // Dec 15, 2023
    }
}
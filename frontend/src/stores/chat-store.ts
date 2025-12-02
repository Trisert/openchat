'use client';

import { create } from 'zustand';
import { Message, Conversation, ChatSettings, ThemeConfig, ConnectionState } from '@/types/chat';

interface ChatStore {
  // Messages and conversations
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string;
  
  // UI state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  settingsOpen: boolean;
  connectionDialogOpen: boolean;
  
  // Settings
  chatSettings: ChatSettings;
  theme: ThemeConfig;
  
  // WebSocket state
  connectionState: ConnectionState;
  isConnecting: boolean;
  
  // Server history
  serverHistory: string[];
  lastConnectedServer: string;
  autoReconnect: boolean;
  
  // Actions
  addMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  
  createConversation: (title?: string) => string;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  updateConversationTitle: (id: string, title: string) => void;
  
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleSettings: () => void;
  setSettingsOpen: (open: boolean) => void;
  
  updateChatSettings: (settings: Partial<ChatSettings>) => void;
  updateTheme: (themeUpdates: Partial<ThemeConfig>) => void;
  resetTheme: () => void;
  
  // WebSocket actions
  setConnectionState: (stateOrFn: ConnectionState | ((prev: ConnectionState) => ConnectionState)) => void;
  setIsConnecting: (connecting: boolean) => void;
  
  // Connection dialog actions
  setConnectionDialogOpen: (open: boolean) => void;
  toggleConnectionDialog: () => void;
  
  // Server history actions
  addToServerHistory: (serverUrl: string) => void;
  removeFromServerHistory: (serverUrl: string) => void;
  clearServerHistory: () => void;
  
  // Auto-reconnection actions
  setLastConnectedServer: (serverUrl: string) => void;
  setAutoReconnect: (enabled: boolean) => void;
}

const defaultChatSettings: ChatSettings = {
  temperature: 0.7,
  max_tokens: 2048,
  top_p: 0.9,
};

const defaultTheme: ThemeConfig = {
  mode: 'dark',
  colors: {
    primary: '#3b82f6',
    background: '#fafbfc',
    text: '#1f2937',
    accent: '#3b82f6',
  },
  fontSize: 16,
  borderRadius: 12,
  animations: true,
  compactMode: false,
};

// Load server history from localStorage
const loadServerHistory = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('openchat-server-history');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Load last connected server from localStorage
const loadLastConnectedServer = (): string => {
  if (typeof window === 'undefined') return '';
  try {
    const saved = localStorage.getItem('openchat-last-connected-server');
    return saved || '';
  } catch {
    return '';
  }
};

// Load auto-reconnect setting from localStorage
const loadAutoReconnect = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('openchat-auto-reconnect');
    return saved === 'true';
  } catch {
    return false;
  }
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  conversations: [],
  currentConversationId: 'current',
  sidebarOpen: false,
  sidebarCollapsed: true,
  mobileSidebarOpen: false,
  settingsOpen: false,
  connectionDialogOpen: false,
  chatSettings: defaultChatSettings,
  theme: defaultTheme,
  
  // WebSocket initial state
  connectionState: {
    connected: false,
    serverUrl: '',
    model: '',
  },
  isConnecting: false,
  
  // Server history initial state
  serverHistory: loadServerHistory(),
  lastConnectedServer: loadLastConnectedServer(),
  autoReconnect: loadAutoReconnect(),

  // Message actions
  addMessage: (messageData) => {
    const message: Message = {
      ...messageData,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    set((state) => {
      const updatedMessages = [...state.messages, message];
      
      // Update current conversation
      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === state.currentConversationId) {
          return {
            ...conv,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
        }
        return conv;
      });

      // If current conversation doesn't exist, create it
      const currentConv = updatedConversations.find((c) => c.id === state.currentConversationId);
      if (!currentConv && state.currentConversationId !== 'current') {
        updatedConversations.push({
          id: state.currentConversationId,
          title: message.content.slice(0, 50) + '...',
          messages: updatedMessages,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });

    return message;
  },

  updateMessage: (id, updates) => {
    set((state) => {
      const updatedMessages = state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      );

      const updatedConversations = state.conversations.map((conv) => {
        if (conv.id === state.currentConversationId) {
          return {
            ...conv,
            messages: updatedMessages,
            updatedAt: new Date(),
          };
        }
        return conv;
      });

      return {
        messages: updatedMessages,
        conversations: updatedConversations,
      };
    });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  // Conversation actions
  createConversation: (title) => {
    const id = Date.now().toString();
    const newConversation: Conversation = {
      id,
      title: title || 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: id,
      messages: [],
    }));

    return id;
  },

  switchConversation: (id) => {
    const conversation = get().conversations.find((c) => c.id === id);
    if (conversation) {
      set({
        currentConversationId: id,
        messages: conversation.messages,
      });
    }
  },

  deleteConversation: (id) => {
    set((state) => {
      const updatedConversations = state.conversations.filter((c) => c.id !== id);
      
      // If deleting current conversation, switch to 'current'
      const newCurrentId = state.currentConversationId === id ? 'current' : state.currentConversationId;
      
      return {
        conversations: updatedConversations,
        currentConversationId: newCurrentId,
        messages: newCurrentId === 'current' ? [] : state.messages,
      };
    });
  },

  updateConversationTitle: (id, title) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
      ),
    }));
  },

  // UI actions
  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  toggleSidebarCollapsed: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  toggleMobileSidebar: () => {
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen }));
  },

  setMobileSidebarOpen: (open) => {
    set({ mobileSidebarOpen: open });
  },

  toggleSettings: () => {
    set((state) => ({ settingsOpen: !state.settingsOpen }));
  },

  setSettingsOpen: (open) => {
    set({ settingsOpen: open });
  },

  // Settings actions
  updateChatSettings: (settings) => {
    set((state) => ({
      chatSettings: { ...state.chatSettings, ...settings },
    }));
  },

  updateTheme: (themeUpdates) => {
    set((state) => ({
      theme: { ...state.theme, ...themeUpdates },
    }));
  },

  resetTheme: () => {
    set({ theme: defaultTheme });
  },
  
  // WebSocket actions
  setConnectionState: (stateOrFn) => {
    set((prevState) => ({
      connectionState: typeof stateOrFn === 'function' ? stateOrFn(prevState.connectionState) : stateOrFn
    }));
  },
  
  setIsConnecting: (connecting) => {
    set({ isConnecting: connecting });
  },
  
  // Connection dialog actions
  setConnectionDialogOpen: (open) => {
    set({ connectionDialogOpen: open });
  },
  
  toggleConnectionDialog: () => {
    set((state) => ({ connectionDialogOpen: !state.connectionDialogOpen }));
  },
  
  // Server history actions
  addToServerHistory: (serverUrl) => {
    set((state) => {
      // Remove if already exists, then add to beginning
      const filtered = state.serverHistory.filter(url => url !== serverUrl);
      const updated = [serverUrl, ...filtered].slice(0, 10); // Keep max 10
      
      // Save to localStorage
      localStorage.setItem('openchat-server-history', JSON.stringify(updated));
      
      return { serverHistory: updated };
    });
  },
  
  removeFromServerHistory: (serverUrl) => {
    set((state) => {
      const updated = state.serverHistory.filter(url => url !== serverUrl);
      
      // Save to localStorage
      localStorage.setItem('openchat-server-history', JSON.stringify(updated));
      
      return { serverHistory: updated };
    });
  },
  
  clearServerHistory: () => {
    set({ serverHistory: [] });
    localStorage.removeItem('openchat-server-history');
  },
  
  // Auto-reconnection actions
  setLastConnectedServer: (serverUrl) => {
    set({ lastConnectedServer: serverUrl });
    localStorage.setItem('openchat-last-connected-server', serverUrl);
  },
  
  setAutoReconnect: (enabled) => {
    set({ autoReconnect: enabled });
    localStorage.setItem('openchat-auto-reconnect', enabled.toString());
  },
}));
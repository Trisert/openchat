class ChatApp {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.serverUrl = '';
    this.currentModel = '';
    this.chatHistory = [];
    this.conversations = [];
    this.currentConversationId = 'current';
    this.settings = {
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9
    };
    this.isRecording = false;
    this.recognition = null;
    this.isCommandPaletteOpen = false;
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.loadConversations();
    this.loadCustomTheme();
    this.clearChatHistory();
    this.setupEventListeners();
    this.setupTheme();
    this.setupPWA();
    this.updateUI();
    this.attemptAutoReconnect();
  }

  setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      this.toggleSidebar();
    });

    // Sidebar overlay click to close
    document.getElementById('sidebar-overlay').addEventListener('click', () => {
      this.closeSidebar();
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Settings modal
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('settings-close').addEventListener('click', () => {
      this.closeSettings();
    });

    // Theme tabs
    document.querySelectorAll('.theme-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchThemeTab(e.target.dataset.tab);
      });
    });

    // Color inputs
    document.getElementById('primary-bg').addEventListener('input', (e) => {
      this.updateThemePreview();
    });

    document.getElementById('primary-text').addEventListener('input', (e) => {
      this.updateThemePreview();
    });

    document.getElementById('accent-color').addEventListener('input', (e) => {
      this.updateThemePreview();
    });

    // Advanced settings
    document.getElementById('font-size').addEventListener('input', (e) => {
      document.getElementById('font-size-value').textContent = e.target.value + 'px';
      this.updateFontsize(e.target.value);
    });

    document.getElementById('border-radius').addEventListener('input', (e) => {
      document.getElementById('border-radius-value').textContent = e.target.value + 'px';
      this.updateBorderRadius(e.target.value);
    });

    document.getElementById('enable-animations').addEventListener('change', (e) => {
      this.toggleAnimations(e.target.checked);
    });

    document.getElementById('compact-mode').addEventListener('change', (e) => {
      this.toggleCompactMode(e.target.checked);
    });

    // Color inputs for theme customization
    const colorInputs = ['primary-bg', 'primary-text', 'accent-color'];
    colorInputs.forEach(inputId => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('input', () => {
          this.updateThemePreview();
        });
      }
    });

    // Server configuration
    document.getElementById('server-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.connectToServer();
    });

    // Message form
    document.getElementById('message-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Chat actions
    document.getElementById('new-chat').addEventListener('click', () => {
      this.createNewConversation();
    });

    document.getElementById('clear-history').addEventListener('click', () => {
      this.clearAllHistory();
    });

    document.getElementById('export-chat').addEventListener('click', () => {
      this.exportCurrentConversation();
    });

    // Search functionality
    document.getElementById('chat-search').addEventListener('input', (e) => {
      this.searchConversations(e.target.value);
    });

    document.getElementById('search-btn').addEventListener('click', () => {
      const searchTerm = document.getElementById('chat-search').value;
      this.searchConversations(searchTerm);
    });

    // Enhanced input actions
    document.getElementById('attach-btn').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    document.getElementById('voice-btn').addEventListener('click', () => {
      this.toggleVoiceRecording();
    });

    document.getElementById('emoji-btn').addEventListener('click', () => {
      this.toggleEmojiPicker();
    });

    document.getElementById('file-input').addEventListener('change', (e) => {
      this.handleFileAttachment(e.target.files);
    });

    // Settings controls
    document.getElementById('temperature').addEventListener('input', (e) => {
      this.settings.temperature = parseFloat(e.target.value);
      document.getElementById('temperature-value').textContent = e.target.value;
      this.saveSettings();
    });

    document.getElementById('max-tokens').addEventListener('input', (e) => {
      this.settings.max_tokens = parseInt(e.target.value);
      this.saveSettings();
    });

    document.getElementById('top-p').addEventListener('input', (e) => {
      this.settings.top_p = parseFloat(e.target.value);
      document.getElementById('top-p-value').textContent = e.target.value;
      this.saveSettings();
    });

    // Auto-resize textarea
    const messageInput = document.getElementById('message-input');
    messageInput.addEventListener('input', () => {
      this.autoResizeTextarea(messageInput);
    });

    // Handle Enter key to send message
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Close modal on outside click
    document.getElementById('settings-modal').addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') {
        this.closeSettings();
      }
    });

    // Close sidebar on window resize if open
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        this.closeSidebar();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.toggleCommandPalette();
      }
      
      // Escape to close modals
      if (e.key === 'Escape') {
        if (this.isCommandPaletteOpen) {
          this.closeCommandPalette();
        }
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal && settingsModal.classList.contains('active')) {
          this.closeSettings();
        }
        const exportModal = document.querySelector('.modal:not(#settings-modal)');
        if (exportModal) {
          this.closeExportModal();
        }
      }
      
      // Ctrl+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      }
      
      // Ctrl+/ for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        this.createNewConversation();
      }
      
      // Ctrl+Shift+C for clear history
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.clearAllHistory();
      }
      
      // Ctrl+E for export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.exportCurrentConversation();
      }
      
      // Ctrl+T for theme toggle
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.toggleTheme();
      }
      
      // Ctrl+, for settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        this.openSettings();
      }
      
      // Ctrl+Shift+H for help
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
        e.preventDefault();
        this.showKeyboardShortcuts();
      }
      
      // Arrow keys for conversation navigation
      if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        this.navigateToPreviousConversation();
      }
      
      if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        this.navigateToNextConversation();
      }
    });
  }

  setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    this.updateThemeIcon(newTheme);
  }

  updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  async connectToServer() {
    const serverUrl = document.getElementById('server-url').value.trim();

    if (!serverUrl) {
      this.showError('Please enter server URL');
      return;
    }

    this.updateConnectionStatus('connecting', 'Connecting...');

    try {
      // Test HTTP connection to LLaMA.cpp server
      const response = await fetch(`${serverUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        this.isConnected = true;
        this.serverUrl = serverUrl;
        this.updateConnectionStatus('connected', 'Connected');
        this.updateUI();
        
        // Enable message input when connected
        const messageInput = document.getElementById('message-input');
        if (messageInput) {
          messageInput.disabled = false;
          messageInput.placeholder = 'Type your message here...';
        }
        
        // Save connection for auto-reconnect
        localStorage.setItem('lastConnection', JSON.stringify({
          serverUrl: serverUrl,
          timestamp: Date.now()
        }));
        
        this.showError('Connected to LLaMA.cpp server!', 'success');
      } else {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      this.updateConnectionStatus('disconnected', 'Connection failed');
      this.showError(`Connection failed: ${error.message}`);
      
      // Ensure input is disabled on connection failure
      const messageInput = document.getElementById('message-input');
      if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Connect to a server first...';
      }
    }
  }

  async attemptAutoReconnect() {
    const lastConnection = localStorage.getItem('lastConnection');
    if (lastConnection) {
      try {
        const { serverUrl, timestamp } = JSON.parse(lastConnection);
        
        // Always attempt reconnect on app start (within 7 days)
        const daysSinceLastConnection = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSinceLastConnection < 7) {
          console.log('Auto-reconnecting to last server:', serverUrl);
          document.getElementById('server-url').value = serverUrl;
          this.updateConnectionStatus('connecting', 'Reconnecting...');
          await this.connectToServer();
        }
      } catch (error) {
        console.error('Failed to parse last connection data:', error);
      }
    }
  }

  // Keyboard Shortcut Methods
  showKeyboardShortcuts() {
    const shortcuts = [
      { key: 'Ctrl+K', description: 'Open command palette' },
      { key: 'Ctrl+Enter', description: 'Send message' },
      { key: 'Ctrl+/', description: 'New chat' },
      { key: 'Ctrl+Shift+C', description: 'Clear all history' },
      { key: 'Ctrl+E', description: 'Export conversation' },
      { key: 'Ctrl+T', description: 'Toggle theme' },
      { key: 'Ctrl+,', description: 'Open settings' },
      { key: 'Ctrl+Shift+H', description: 'Show keyboard shortcuts' },
      { key: 'Alt+↑', description: 'Previous conversation' },
      { key: 'Alt+↓', description: 'Next conversation' },
      { key: 'Enter', description: 'Send message (when input focused)' },
      { key: 'Shift+Enter', description: 'New line (when input focused)' },
      { key: 'Escape', description: 'Close modals' }
    ];
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Keyboard Shortcuts</h2>
          <button class="modal-close" onclick="app.closeKeyboardShortcuts()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="shortcuts-grid">
            ${shortcuts.map(shortcut => `
              <div class="shortcut-item">
                <div class="shortcut-key">${shortcut.key}</div>
                <div class="shortcut-desc">${shortcut.description}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  closeKeyboardShortcuts() {
    const modal = document.querySelector('.modal:not(#settings-modal):not(.export-modal)');
    if (modal) {
      modal.remove();
    }
  }

  navigateToPreviousConversation() {
    const conversationItems = Array.from(document.querySelectorAll('.conversation-item'));
    const currentIndex = conversationItems.findIndex(item => 
      item.classList.contains('active')
    );
    
    if (currentIndex > 0) {
      conversationItems[currentIndex].classList.remove('active');
      conversationItems[currentIndex - 1].classList.add('active');
      this.loadConversation(conversationItems[currentIndex - 1].dataset.id);
    }
  }

  navigateToNextConversation() {
    const conversationItems = Array.from(document.querySelectorAll('.conversation-item'));
    const currentIndex = conversationItems.findIndex(item => 
      item.classList.contains('active')
    );
    
    if (currentIndex < conversationItems.length - 1) {
      conversationItems[currentIndex].classList.remove('active');
      conversationItems[currentIndex + 1].classList.add('active');
      this.loadConversation(conversationItems[currentIndex + 1].dataset.id);
    }
  }

  // Core missing methods
  loadSettings() {
    const saved = localStorage.getItem('chatSettings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        this.settings = { ...this.settings, ...settings };
        
        // Update UI controls
        document.getElementById('temperature').value = this.settings.temperature;
        document.getElementById('max-tokens').value = this.settings.max_tokens;
        document.getElementById('top-p').value = this.settings.top_p;
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }

  loadConversations() {
    const saved = localStorage.getItem('conversations');
    if (saved) {
      try {
        this.conversations = JSON.parse(saved);
        this.updateConversationsList();
      } catch (error) {
        console.error('Failed to load conversations:', error);
        this.conversations = [];
      }
    }
  }

  clearChatHistory() {
    this.chatHistory = [];
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.innerHTML = `
        <div class="welcome-message">
          <h2>Welcome to OpenChat</h2>
          <p>Connect to a LLaMA.cpp server to start chatting with AI models.</p>
        </div>
      `;
    }
  }

  updateUI() {
    // Update connection status
    const statusElement = document.getElementById('connection-status');
    const messageInput = document.getElementById('message-input');
    
    if (statusElement) {
      const indicator = statusElement.querySelector('.status-indicator');
      const text = statusElement.querySelector('.status-text');
      
      if (this.isConnected) {
        indicator.className = 'status-indicator connected';
        text.textContent = 'Connected';
        
        // Enable input when connected
        if (messageInput) {
          messageInput.disabled = false;
          messageInput.placeholder = 'Type your message here...';
        }
      } else {
        indicator.className = 'status-indicator disconnected';
        text.textContent = 'Disconnected';
        
        // Disable input when disconnected
        if (messageInput) {
          messageInput.disabled = true;
          messageInput.placeholder = 'Connect to a server first...';
        }
      }
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    }
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
    }
  }

  openSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'flex';
      this.loadSettings(); // Refresh settings when opening
    }
  }

  closeSettings() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  saveSettings() {
    this.settings.temperature = parseFloat(document.getElementById('temperature').value);
    this.settings.max_tokens = parseInt(document.getElementById('max-tokens').value);
    this.settings.top_p = parseFloat(document.getElementById('top-p').value);
    
    localStorage.setItem('chatSettings', JSON.stringify(this.settings));
  }

  updateConnectionStatus(status, message) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      const indicator = statusElement.querySelector('.status-indicator');
      const text = statusElement.querySelector('.status-text');
      
      indicator.className = `status-indicator ${status}`;
      text.textContent = message;
    }
  }

  showError(message, type = 'error') {
    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  handleWebSocketMessage(data) {
    console.log('WebSocket message:', data);
    
    switch (data.type) {
      case 'connected':
        this.isConnected = true;
        this.updateConnectionStatus('connected', 'Connected');
        this.updateUI();
        
        // Save connection for auto-reconnect
        localStorage.setItem('lastConnection', JSON.stringify({
          serverUrl: data.serverUrl,
          timestamp: Date.now()
        }));
        break;
        
      case 'message':
        this.addMessage(data.content, 'assistant');
        break;
        
      case 'error':
        this.showError(data.message);
        break;
        
      case 'disconnected':
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'Disconnected');
        this.updateUI();
        break;
    }
  }

  addMessage(content, role = 'user') {
    const message = {
      id: Date.now(),
      role,
      content,
      timestamp: new Date().toISOString()
    };
    
    this.chatHistory.push(message);
    this.displayMessage(message);
  }

  displayMessage(message) {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;
    
    // Remove welcome message on first message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.role}`;
    messageElement.innerHTML = `
      <div class="message-content">${this.formatMessageText(message.content)}</div>
      <div class="message-time">${new Date(message.timestamp).toLocaleTimeString()}</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  addStreamingMessage(messageId) {
    console.log('Adding streaming message:', messageId);
    const messagesContainer = document.getElementById('messages-container');
    console.log('Messages container:', messagesContainer);
    
    if (!messagesContainer) {
      console.error('Messages container not found!');
      return;
    }
    
    // Remove welcome message on first message
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
      welcomeMessage.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message assistant streaming`;
    messageElement.id = `message-${messageId}`;
    messageElement.innerHTML = `
      <div class="message-content">
        <span class="streaming-text"></span>
        <span class="streaming-cursor">▋</span>
      </div>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    `;
    
    console.log('Created message element:', messageElement);
    messagesContainer.appendChild(messageElement);
    console.log('Added message to container');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  updateStreamingMessage(messageId, content) {
    console.log('Updating streaming message:', messageId, content);
    const messageElement = document.getElementById(`message-${messageId}`);
    console.log('Found message element:', messageElement);
    
    if (messageElement) {
      const textElement = messageElement.querySelector('.streaming-text');
      console.log('Found text element:', textElement);
      
      if (textElement) {
        // Try without formatting first to see if that's the issue
        textElement.textContent = content;
        console.log('Updated text content to:', content);
        // textElement.innerHTML = this.formatMessageText(content);
      } else {
        console.error('Text element not found in message');
      }
    } else {
      console.error('Message element not found:', messageId);
    }
  }

  finalizeStreamingMessage(messageId, content) {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      const contentElement = messageElement.querySelector('.message-content');
      if (contentElement) {
        contentElement.innerHTML = this.formatMessageText(content);
      }
      messageElement.classList.remove('streaming');
    }
    
    // Add to chat history
    this.chatHistory.push({
      id: messageId,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString()
    });
  }

  formatMessageText(text) {
    // Comprehensive Markdown formatting
    let formatted = text;
    
    // Code blocks first (to avoid interfering with other formatting)
    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
      const language = lang || 'text';
      return `<div class="code-block-container" data-language="${language}"><pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre></div>`;
    });
    
    // Headers
    formatted = formatted
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Bold text: **text** -> <strong>text</strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text: *text* -> <em>text</em> (avoid interfering with bold)
    formatted = formatted.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
    
    // Strikethrough: ~~text~~ -> <del>text</del>
    formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');
    
    // Inline code: `code` -> <code>code</code>
    formatted = formatted.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');
    
    // Blockquotes: > text -> <blockquote>text</blockquote>
    formatted = formatted.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
    
    // Horizontal rules: --- or *** -> <hr>
    formatted = formatted.replace(/^(---|\*\*\*)$/gm, '<hr>');
    
    // Tables: | col1 | col2 | -> <table>
    formatted = formatted.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => cell.trim());
      const isHeader = /^\s*[\|\-]+\s*\|$/.test(match);
      if (isHeader) return '';
      
      const cellTags = cells.map(cell => `<td>${cell}</td>`).join('');
      return `<tr>${cellTags}</tr>`;
    });
    
    // Wrap table rows in table tags
    formatted = formatted.replace(/(<tr>.*<\/tr>)/gs, '<table class="markdown-table">$1</table>');
    
    // Unordered lists: - item or * item
    formatted = formatted.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    
    // Ordered lists: 1. item
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, '<ol>$1</ol>');
    
    // Links: [text](url) -> <a href="url">text</a>
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // URLs: http://example.com -> <a href="http://example.com">http://example.com</a>
    formatted = formatted.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank">$1</a>');
    
    // Line breaks (convert double line breaks to paragraphs)
    formatted = formatted.replace(/\n\n+/g, '</p><p>');
    formatted = '<p>' + formatted + '</p>';
    
    // Single line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Clean up empty paragraphs
    formatted = formatted.replace(/<p><\/p>/g, '');
    formatted = formatted.replace(/<p>(<br>)?<\/p>/g, '');
    
    return formatted;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async sendMessage() {
    const input = document.getElementById('message-input');
    const content = input.value.trim();
    
    if (!content || !this.isConnected) {
      if (!this.isConnected) {
        this.showError('Not connected to server');
      }
      return;
    }
    
    this.addMessage(content, 'user');
    input.value = '';
    
    // Send to LLaMA.cpp server via HTTP API with streaming
    try {
      this.updateConnectionStatus('connecting', 'Thinking...');
      console.log('Sending message to:', `${this.serverUrl}/v1/chat/completions`);
      
      const response = await fetch(`${this.serverUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "models/Qwen3-4B-Instruct-2507-UD-Q4_K_XL.gguf",
          messages: [
            { role: "user", content: content }
          ],
          max_tokens: this.settings.max_tokens,
          temperature: this.settings.temperature,
          top_p: this.settings.top_p,
          stream: true
        }),
        signal: AbortSignal.timeout(60000)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let messageId = Date.now();
      
      // Create initial message element
      this.addStreamingMessage(messageId);
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                assistantMessage += content;
                console.log('Streaming content:', content);
                console.log('Total message so far:', assistantMessage);
                this.updateStreamingMessage(messageId, assistantMessage);
              }
            } catch (e) {
              console.error('Parse error:', e, 'Data:', data);
            }
          }
        }
      }
      
      // Finalize the message
      this.finalizeStreamingMessage(messageId, assistantMessage);
      this.updateConnectionStatus('connected', 'Connected');
      
    } catch (error) {
      console.error('API call failed:', error);
      this.updateConnectionStatus('connected', 'Connected');
      this.showError(`Failed to get response: ${error.message}`);
      this.addMessage('Error: Could not get response from server', 'assistant');
    }
  }

  loadCustomTheme() {
    const customTheme = localStorage.getItem('customTheme');
    if (customTheme) {
      try {
        const theme = JSON.parse(customTheme);
        // Apply custom theme variables
        const root = document.documentElement;
        Object.entries(theme).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, value);
        });
      } catch (error) {
        console.error('Failed to load custom theme:', error);
      }
    }
  }

  setupPWA() {
    // Basic PWA setup
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }
  }

  // Placeholder methods for other functionality
  createNewConversation() {
    this.clearChatHistory();
    this.currentConversationId = 'current';
  }

  clearAllHistory() {
    if (confirm('Are you sure you want to clear all conversation history?')) {
      this.conversations = [];
      localStorage.removeItem('conversations');
      this.clearChatHistory();
    }
  }

  exportCurrentConversation() {
    const data = {
      messages: this.chatHistory,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  searchConversations(searchTerm) {
    // Basic search implementation
    console.log('Searching for:', searchTerm);
    // This would filter and display matching conversations
  }

  loadConversation(conversationId) {
    console.log('Loading conversation:', conversationId);
    // This would load a specific conversation
  }

  switchThemeTab(tabName) {
    // Remove active class from all tabs and panels
    document.querySelectorAll('.theme-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    document.querySelectorAll('.theme-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    // Add active class to selected tab and panel
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    const selectedPanel = document.getElementById(`${tabName}-panel`);
    
    if (selectedTab) selectedTab.classList.add('active');
    if (selectedPanel) selectedPanel.classList.add('active');
  }

  updateThemePreview() {
    const primaryBg = document.getElementById('primary-bg')?.value;
    const primaryText = document.getElementById('primary-text')?.value;
    const accentColor = document.getElementById('accent-color')?.value;
    
    const preview = document.getElementById('theme-preview');
    if (preview && primaryBg && primaryText && accentColor) {
      preview.style.backgroundColor = primaryBg;
      preview.style.color = primaryText;
      preview.style.borderColor = accentColor;
      
      // Update preview messages
      const userMessage = preview.querySelector('.preview-message.user');
      const assistantMessage = preview.querySelector('.preview-message.assistant');
      
      if (userMessage) {
        userMessage.style.backgroundColor = accentColor + '20';
        userMessage.style.color = primaryText;
      }
      
      if (assistantMessage) {
        assistantMessage.style.backgroundColor = primaryBg;
        assistantMessage.style.color = primaryText;
        assistantMessage.style.border = `1px solid ${accentColor}40`;
      }
    }
  }
  updateFontsize(size) {
    document.documentElement.style.setProperty('--font-size-base', size + 'px');
  }

  updateBorderRadius(size) {
    document.documentElement.style.setProperty('--radius-md', size + 'px');
  }

  toggleAnimations(enabled) {
    if (enabled) {
      document.body.classList.remove('no-animations');
    } else {
      document.body.classList.add('no-animations');
    }
  }

  toggleCompactMode(enabled) {
    if (enabled) {
      document.body.classList.add('compact-mode');
    } else {
      document.body.classList.remove('compact-mode');
    }
  }
  toggleVoiceRecording() {}
  toggleEmojiPicker() {}
  handleFileAttachment() {}
  autoResizeTextarea() {}
  toggleCommandPalette() {}
  closeCommandPalette() {}
  closeExportModal() {}
  updateConversationsList() {}

  resetThemeColors() {
    // Reset to default colors
    const defaults = {
      'primary-bg': '#fafbfc',
      'primary-text': '#1f2937',
      'accent-color': '#3b82f6'
    };
    
    Object.entries(defaults).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) {
        input.value = value;
      }
    });
    
    this.updateThemePreview();
    this.showError('Theme colors reset to default', 'success');
  }

  saveCustomTheme() {
    const theme = {
      'primary-bg': document.getElementById('primary-bg')?.value,
      'primary-text': document.getElementById('primary-text')?.value,
      'accent-color': document.getElementById('accent-color')?.value
    };
    
    localStorage.setItem('customTheme', JSON.stringify(theme));
    
    // Apply theme immediately
    Object.entries(theme).forEach(([key, value]) => {
      const cssVar = '--' + key.replace('-', '-');
      document.documentElement.style.setProperty(cssVar, value);
    });
    
    this.showError('Custom theme saved!', 'success');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new ChatApp();
});
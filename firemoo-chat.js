/**
 * Firemoo Chat Widget - Embeddable Chat Widget
 * Version: 1.0.0
 *
 * Usage:
 *   <script src="firemoo-chat.js" 
 *           api-key="YOUR_API_KEY" 
 *           base-url="api-firemoo.dmpt.my.id"
 *           primary-color="#10b981"
 *           text-color="#ffffff"></script>
 */

(function (global) {
  'use strict';

  // Get configuration from script tag
  function getConfig() {
    const scripts = document.getElementsByTagName('script');
    let config = {
      apiKey: null,
      baseUrl: 'http://127.0.0.1:9090',
      websiteUrl: window.location.origin,
      primaryColor: '#10b981', // Default green
      textColor: '#ffffff', // Default white
      position: 'bottom-right' // bottom-right, bottom-left
    };

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes('firemoo-chat')) {
        config.apiKey = script.getAttribute('api-key') || script.getAttribute('data-api-key');
        config.baseUrl = script.getAttribute('base-url') || script.getAttribute('data-base-url') || config.baseUrl;
        config.websiteUrl = script.getAttribute('website-url') || script.getAttribute('data-website-url') || config.websiteUrl;
        config.primaryColor = script.getAttribute('primary-color') || script.getAttribute('data-primary-color') || config.primaryColor;
        config.textColor = script.getAttribute('text-color') || script.getAttribute('data-text-color') || config.textColor;
        config.position = script.getAttribute('position') || script.getAttribute('data-position') || config.position;
        break;
      }
    }

    if (!config.apiKey) {
      console.error('Firemoo Chat: API key is required. Add api-key attribute to script tag.');
      return null;
    }

    // Remove trailing slash from baseUrl
    config.baseUrl = config.baseUrl.replace(/\/$/, '');
    // Ensure baseUrl has protocol
    if (!config.baseUrl.startsWith('http://') && !config.baseUrl.startsWith('https://')) {
      config.baseUrl = 'https://' + config.baseUrl;
    }

    return config;
  }

  const config = getConfig();
  if (!config) return;

  // Generate or get visitor ID from localStorage
  function getVisitorID() {
    const storageKey = 'firemoo_chat_visitor_id';
    let visitorID = localStorage.getItem(storageKey);
    if (!visitorID) {
      visitorID = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem(storageKey, visitorID);
    }
    return visitorID;
  }

  const visitorID = getVisitorID();

  // Helper function to make API requests
  async function apiRequest(method, endpoint, data = null) {
    const url = `${config.baseUrl}${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-Website-Url': config.websiteUrl
      }
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      console.error('Firemoo Chat API Error:', error);
      throw error;
    }
  }

  // Chat Widget Class
  class FiremooChatWidget {
    constructor() {
      this.isOpen = false;
      this.conversationId = null;
      this.messages = [];
      this.isLoading = false;
      this.pollInterval = null;
      this.pollDelay = 3000; // Poll every 3 seconds for new messages

      this.init();
    }

    init() {
      this.createWidget();
      this.attachEventListeners();
      this.loadExistingConversation();
    }

    createWidget() {
      // Create container
      const container = document.createElement('div');
      container.id = 'firemoo-chat-widget';
      container.innerHTML = `
        <!-- Chat Button -->
        <button id="firemoo-chat-button" class="firemoo-chat-button" aria-label="Open chat">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        <!-- Chat Window -->
        <div id="firemoo-chat-window" class="firemoo-chat-window">
          <!-- Header -->
          <div class="firemoo-chat-header">
            <div class="firemoo-chat-header-content">
              <div class="firemoo-chat-header-icon">💬</div>
              <div class="firemoo-chat-header-text">
                <div class="firemoo-chat-header-title">Chat Support</div>
                <div class="firemoo-chat-header-subtitle">Kami siap membantu Anda</div>
              </div>
            </div>
            <button id="firemoo-chat-close" class="firemoo-chat-close" aria-label="Close chat">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Messages Container -->
          <div id="firemoo-chat-messages" class="firemoo-chat-messages">
            <div class="firemoo-chat-welcome">
              <div class="firemoo-chat-welcome-icon">👋</div>
              <div class="firemoo-chat-welcome-text">
                <div class="firemoo-chat-welcome-title">Halo! Ada yang bisa kami bantu?</div>
                <div class="firemoo-chat-welcome-subtitle">Kirim pesan dan tim kami akan merespons segera</div>
              </div>
            </div>
          </div>

          <!-- Input Container -->
          <div class="firemoo-chat-input-container">
            <div id="firemoo-chat-typing" class="firemoo-chat-typing" style="display: none;">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div class="firemoo-chat-input-wrapper">
              <input 
                type="text" 
                id="firemoo-chat-input" 
                class="firemoo-chat-input" 
                placeholder="Ketik pesan Anda..."
                autocomplete="off"
              />
              <button id="firemoo-chat-send" class="firemoo-chat-send" aria-label="Send message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(container);
      this.applyStyles();
    }

    applyStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #firemoo-chat-widget {
          position: fixed;
          ${config.position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
          bottom: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        .firemoo-chat-button {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: ${config.primaryColor};
          color: ${config.textColor};
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .firemoo-chat-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .firemoo-chat-button:active {
          transform: scale(0.95);
        }

        .firemoo-chat-window {
          position: absolute;
          ${config.position === 'bottom-left' ? 'left: 0;' : 'right: 0;'}
          bottom: 80px;
          width: 380px;
          max-width: calc(100vw - 40px);
          height: 600px;
          max-height: calc(100vh - 100px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: none;
          flex-direction: column;
          overflow: hidden;
          animation: firemoo-slide-up 0.3s ease;
        }

        @keyframes firemoo-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .firemoo-chat-window.open {
          display: flex;
        }

        .firemoo-chat-header {
          background-color: ${config.primaryColor};
          color: ${config.textColor};
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 16px 16px 0 0;
        }

        .firemoo-chat-header-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .firemoo-chat-header-icon {
          font-size: 24px;
        }

        .firemoo-chat-header-text {
          flex: 1;
        }

        .firemoo-chat-header-title {
          font-weight: 600;
          font-size: 16px;
          line-height: 1.4;
        }

        .firemoo-chat-header-subtitle {
          font-size: 12px;
          opacity: 0.9;
          line-height: 1.4;
        }

        .firemoo-chat-close {
          background: none;
          border: none;
          color: ${config.textColor};
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .firemoo-chat-close:hover {
          opacity: 1;
        }

        .firemoo-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .firemoo-chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .firemoo-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .firemoo-chat-messages::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .firemoo-chat-messages::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        .firemoo-chat-welcome {
          text-align: center;
          padding: 32px 20px;
          color: #6b7280;
        }

        .firemoo-chat-welcome-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .firemoo-chat-welcome-title {
          font-weight: 600;
          font-size: 16px;
          color: #111827;
          margin-bottom: 8px;
        }

        .firemoo-chat-welcome-subtitle {
          font-size: 14px;
          line-height: 1.5;
        }

        .firemoo-chat-message {
          display: flex;
          margin-bottom: 8px;
          animation: firemoo-message-appear 0.3s ease;
        }

        @keyframes firemoo-message-appear {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .firemoo-chat-message.visitor {
          justify-content: flex-end;
        }

        .firemoo-chat-message.agent {
          justify-content: flex-start;
        }

        .firemoo-chat-message-bubble {
          max-width: 75%;
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          line-height: 1.5;
          font-size: 14px;
        }

        .firemoo-chat-message.visitor .firemoo-chat-message-bubble {
          background-color: ${config.primaryColor};
          color: ${config.textColor};
          border-bottom-right-radius: 4px;
        }

        .firemoo-chat-message.agent .firemoo-chat-message-bubble {
          background-color: white;
          color: #111827;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }

        .firemoo-chat-message-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 4px;
          padding: 0 4px;
        }

        .firemoo-chat-message.visitor .firemoo-chat-message-time {
          text-align: right;
        }

        .firemoo-chat-message.agent .firemoo-chat-message-time {
          text-align: left;
        }

        .firemoo-chat-typing {
          padding: 8px 20px;
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .firemoo-chat-typing span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #9ca3af;
          animation: firemoo-typing 1.4s infinite;
        }

        .firemoo-chat-typing span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .firemoo-chat-typing span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes firemoo-typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .firemoo-chat-input-container {
          border-top: 1px solid #e5e7eb;
          background: white;
        }

        .firemoo-chat-input-wrapper {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 8px;
        }

        .firemoo-chat-input {
          flex: 1;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 10px 16px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
        }

        .firemoo-chat-input:focus {
          border-color: ${config.primaryColor};
        }

        .firemoo-chat-send {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${config.primaryColor};
          color: ${config.textColor};
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .firemoo-chat-send:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .firemoo-chat-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .firemoo-chat-window {
            width: calc(100vw - 20px);
            height: calc(100vh - 100px);
            ${config.position === 'bottom-left' ? 'left: 10px;' : 'right: 10px;'}
            bottom: 80px;
          }
        }
      `;

      document.head.appendChild(style);
    }

    attachEventListeners() {
      const button = document.getElementById('firemoo-chat-button');
      const closeBtn = document.getElementById('firemoo-chat-close');
      const sendBtn = document.getElementById('firemoo-chat-send');
      const input = document.getElementById('firemoo-chat-input');

      button.addEventListener('click', () => this.toggleChat());
      closeBtn.addEventListener('click', () => this.closeChat());
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });
    }

    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    }

    openChat() {
      const window = document.getElementById('firemoo-chat-window');
      window.classList.add('open');
      this.isOpen = true;
      
      // Focus input
      setTimeout(() => {
        document.getElementById('firemoo-chat-input').focus();
      }, 100);

      // Start polling for messages
      this.startPolling();
    }

    closeChat() {
      const window = document.getElementById('firemoo-chat-window');
      window.classList.remove('open');
      this.isOpen = false;
      
      // Stop polling
      this.stopPolling();
    }

    async loadExistingConversation() {
      // Try to load conversation from localStorage
      const storageKey = `firemoo_chat_conversation_${visitorID}`;
      const savedConversationId = localStorage.getItem(storageKey);
      
      if (savedConversationId) {
        this.conversationId = savedConversationId;
        await this.loadMessages();
      }
    }

    async createConversation(message) {
      try {
        const response = await apiRequest('POST', '/api/chat/conversations', {
          visitor_id: visitorID,
          message: message,
          current_page: window.location.href,
          referrer: document.referrer || null
        });

        this.conversationId = response.id;
        
        // Save to localStorage
        const storageKey = `firemoo_chat_conversation_${visitorID}`;
        localStorage.setItem(storageKey, this.conversationId);

        return response;
      } catch (error) {
        this.showError('Gagal membuat percakapan. Silakan coba lagi.');
        throw error;
      }
    }

    async sendMessage() {
      const input = document.getElementById('firemoo-chat-input');
      const message = input.value.trim();

      if (!message || this.isLoading) return;

      // Clear input
      input.value = '';
      input.disabled = true;
      this.isLoading = true;

      try {
        // If no conversation, create one
        if (!this.conversationId) {
          await this.createConversation(message);
        }

        // Send message
        await apiRequest('POST', `/api/chat/conversations/${this.conversationId}/messages`, {
          message: message,
          message_type: 'text'
        });

        // Add message to UI immediately
        this.addMessage(message, 'visitor');

        // Reload messages to get server response
        await this.loadMessages();
      } catch (error) {
        this.showError('Gagal mengirim pesan. Silakan coba lagi.');
      } finally {
        input.disabled = false;
        this.isLoading = false;
        input.focus();
      }
    }

    async loadMessages() {
      if (!this.conversationId) return;

      try {
        const response = await apiRequest('GET', `/api/chat/conversations/${this.conversationId}/messages?limit=50`);
        
        if (response.messages && response.messages.length > 0) {
          this.messages = response.messages;
          this.renderMessages();
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    }

    addMessage(text, senderType) {
      const message = {
        id: 'temp_' + Date.now(),
        message: text,
        sender_type: senderType,
        created_at: new Date().toISOString()
      };

      this.messages.push(message);
      this.renderMessages();
    }

    renderMessages() {
      const container = document.getElementById('firemoo-chat-messages');
      const welcome = container.querySelector('.firemoo-chat-welcome');
      
      if (this.messages.length > 0 && welcome) {
        welcome.remove();
      }

      // Clear existing messages (except welcome)
      const existingMessages = container.querySelectorAll('.firemoo-chat-message');
      existingMessages.forEach(msg => msg.remove());

      // Render messages
      this.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `firemoo-chat-message ${msg.sender_type}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'firemoo-chat-message-bubble';
        bubble.textContent = msg.message;

        const time = document.createElement('div');
        time.className = 'firemoo-chat-message-time';
        const date = new Date(msg.created_at);
        time.textContent = date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        messageDiv.appendChild(bubble);
        messageDiv.appendChild(time);
        container.appendChild(messageDiv);
      });

      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
    }

    showTyping() {
      const typing = document.getElementById('firemoo-chat-typing');
      typing.style.display = 'flex';
    }

    hideTyping() {
      const typing = document.getElementById('firemoo-chat-typing');
      typing.style.display = 'none';
    }

    showError(message) {
      // Simple error notification
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: firemoo-slide-up 0.3s ease;
      `;
      errorDiv.textContent = message;
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    }

    startPolling() {
      // Poll for new messages every 3 seconds
      this.pollInterval = setInterval(() => {
        if (this.conversationId) {
          this.loadMessages();
        }
      }, this.pollDelay);
    }

    stopPolling() {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    }
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new FiremooChatWidget();
    });
  } else {
    new FiremooChatWidget();
  }

  // Export to global scope
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FiremooChatWidget;
  } else {
    global.FiremooChatWidget = FiremooChatWidget;
  }

})(typeof window !== 'undefined' ? window : this);

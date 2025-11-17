/**
 * Firemoo Chat Widget - Embeddable Chat Widget
 * Version: 1.0.0
 * update : 2025-11-17 21:58
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
    let config = {
      apiKey: null,
      baseUrl: 'https://api-firemoo.dmpt.my.id',
      websiteUrl: window.location.origin,
      primaryColor: '#10b981', // Default green
      textColor: '#ffffff', // Default white
      position: 'bottom-right' // bottom-right, bottom-left
    };

    let targetScript = document.currentScript;

    if (!targetScript) {
      const scripts = document.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const hasFiremooAttr = script.hasAttribute('api-key') || script.hasAttribute('data-api-key');
        const src = script.src || '';
        const matchesSrc =
          src.includes('firemoo-chat') ||
          src.includes('cdn-firemoo') ||
          src.includes('chat-v1');

        if (hasFiremooAttr || matchesSrc) {
          targetScript = script;
          break;
        }
      }
    }

    if (targetScript) {
      config.apiKey = targetScript.getAttribute('api-key') || targetScript.getAttribute('data-api-key');
      const baseUrlAttr =
        targetScript.getAttribute('base-url') ||
        targetScript.getAttribute('data-base-url') ||
        targetScript.getAttribute('url') ||
        targetScript.getAttribute('data-url');
      if (baseUrlAttr) {
        config.baseUrl = baseUrlAttr;
      }
      config.websiteUrl = targetScript.getAttribute('website-url') || targetScript.getAttribute('data-website-url') || config.websiteUrl;
      config.primaryColor = targetScript.getAttribute('primary-color') || targetScript.getAttribute('data-primary-color') || config.primaryColor;
      config.textColor = targetScript.getAttribute('text-color') || targetScript.getAttribute('data-text-color') || config.textColor;
      config.position = targetScript.getAttribute('position') || targetScript.getAttribute('data-position') || config.position;
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

  // Get or save visitor data from localStorage
  function getVisitorData() {
    const storageKey = 'firemoo_chat_visitor_data';
    const data = localStorage.getItem(storageKey);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  function saveVisitorData(data) {
    const storageKey = 'firemoo_chat_visitor_data';
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

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
      this.ws = null;
      this.wsReconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 3000;
      this.shouldReconnect = true;
      this.visitorData = getVisitorData();
      this.showForm = !this.visitorData; // Show form if no visitor data
      this.hasExistingConversation = false;
      this.isChatActive = false; // Track if chat is already active
      this.sentMessageIds = new Set(); // Track message IDs sent from this widget (always visitor)

      this.init();
    }

    init() {
      this.createWidget();
      this.attachEventListeners();
      this.checkExistingConversation();
      
      // Cleanup WebSocket on page unload
      window.addEventListener('beforeunload', () => {
        this.disconnectWebSocket();
      });
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

          <!-- Visitor Info Form -->
          <div id="firemoo-chat-form" class="firemoo-chat-form" style="display: none;">
            <div class="firemoo-chat-form-content">
              <div class="firemoo-chat-form-title">Isi Data Diri Anda</div>
              <div class="firemoo-chat-form-subtitle">Mohon lengkapi informasi berikut untuk memulai chat</div>
              
              <div class="firemoo-chat-form-group">
                <label for="firemoo-chat-name">Nama Lengkap *</label>
                <input 
                  type="text" 
                  id="firemoo-chat-name" 
                  class="firemoo-chat-form-input" 
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>
              
              <div class="firemoo-chat-form-group">
                <label for="firemoo-chat-email">Email *</label>
                <input 
                  type="email" 
                  id="firemoo-chat-email" 
                  class="firemoo-chat-form-input" 
                  placeholder="nama@email.com"
                  required
                />
              </div>
              
              <div class="firemoo-chat-form-group">
                <label for="firemoo-chat-phone">Nomor Telepon *</label>
                <input 
                  type="tel" 
                  id="firemoo-chat-phone" 
                  class="firemoo-chat-form-input" 
                  placeholder="+6281234567890"
                  required
                />
              </div>
              
              <button id="firemoo-chat-form-submit" class="firemoo-chat-form-submit">
                Mulai Chat
              </button>
            </div>
          </div>

          <!-- Continue or New Chat Options -->
          <div id="firemoo-chat-options" class="firemoo-chat-options" style="display: none;">
            <div class="firemoo-chat-options-content">
              <div class="firemoo-chat-options-title">Anda memiliki chat sebelumnya</div>
              <div class="firemoo-chat-options-subtitle">Pilih opsi di bawah ini</div>
              
              <button id="firemoo-chat-continue" class="firemoo-chat-option-button">
                <span class="firemoo-chat-option-icon">💬</span>
                <span class="firemoo-chat-option-text">
                  <div class="firemoo-chat-option-title">Lanjutkan Chat</div>
                  <div class="firemoo-chat-option-desc">Lanjutkan percakapan sebelumnya</div>
                </span>
              </button>
              
              <button id="firemoo-chat-new" class="firemoo-chat-option-button">
                <span class="firemoo-chat-option-icon">🆕</span>
                <span class="firemoo-chat-option-text">
                  <div class="firemoo-chat-option-title">Chat Baru</div>
                  <div class="firemoo-chat-option-desc">Mulai percakapan baru</div>
                </span>
              </button>
            </div>
          </div>

          <!-- Messages Container -->
          <div id="firemoo-chat-messages" class="firemoo-chat-messages" style="display: none;">
            <div class="firemoo-chat-welcome">
              <div class="firemoo-chat-welcome-icon">👋</div>
              <div class="firemoo-chat-welcome-text">
                <div class="firemoo-chat-welcome-title">Halo! Ada yang bisa kami bantu?</div>
                <div class="firemoo-chat-welcome-subtitle">Kirim pesan dan tim kami akan merespons segera</div>
              </div>
            </div>
          </div>

          <!-- Input Container -->
          <div id="firemoo-chat-input-container" class="firemoo-chat-input-container" style="display: none;">
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
          gap: 4px;
          scroll-behavior: smooth;
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
          flex-direction: row;
          margin-bottom: 12px;
            opacity: 1;
          transform: translateX(0);
          transition: opacity 0.3s ease, transform 0.3s ease;
          width: 100%;
          box-sizing: border-box;
        }

        /* Visitor (Pengirim) - Posisi KANAN */
        .firemoo-chat-message.visitor {
          justify-content: flex-end;
          align-items: flex-end;
        }

        /* Agent (Penerima/Admin) - Posisi KIRI */
        .firemoo-chat-message.agent {
          justify-content: flex-start;
          align-items: flex-start;
        }

        .firemoo-chat-message-content {
          display: flex;
          flex-direction: column;
          max-width: 75%;
          min-width: 0;
        }

        /* Visitor content - align ke kanan (pengirim) */
        .firemoo-chat-message.visitor .firemoo-chat-message-content {
          align-items: flex-end;
          margin-left: auto;
        }

        /* Agent content - align ke kiri (penerima/admin) */
        .firemoo-chat-message.agent .firemoo-chat-message-content {
          align-items: flex-start;
          margin-right: auto;
        }

        .firemoo-chat-message-bubble {
          padding: 12px 16px;
          border-radius: 18px;
          word-wrap: break-word;
          word-break: break-word;
          line-height: 1.5;
          font-size: 14px;
          max-width: 100%;
          box-sizing: border-box;
          display: block;
          text-align: left;
        }

        /* Visitor bubble - KANAN dengan warna primary (pengirim) */
        .firemoo-chat-message.visitor .firemoo-chat-message-bubble {
          background-color: ${config.primaryColor};
          color: ${config.textColor};
          border-bottom-right-radius: 4px;
        }

        /* Agent bubble - KIRI dengan background putih (penerima/admin) */
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
          display: block;
          width: 100%;
        }

        /* Visitor time - align KANAN */
        .firemoo-chat-message.visitor .firemoo-chat-message-time {
          text-align: right;
        }

        /* Agent time - align KIRI */
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

        .firemoo-chat-form {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .firemoo-chat-form-content {
          width: 100%;
          max-width: 320px;
        }

        .firemoo-chat-form-title {
          font-weight: 600;
          font-size: 18px;
          color: #111827;
          margin-bottom: 8px;
          text-align: center;
        }

        .firemoo-chat-form-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 24px;
          text-align: center;
        }

        .firemoo-chat-form-group {
          margin-bottom: 16px;
        }

        .firemoo-chat-form-group label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .firemoo-chat-form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .firemoo-chat-form-input:focus {
          border-color: ${config.primaryColor};
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }

        .firemoo-chat-form-submit {
          width: 100%;
          padding: 12px 24px;
          background-color: ${config.primaryColor};
          color: ${config.textColor};
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .firemoo-chat-form-submit:hover:not(:disabled) {
          opacity: 0.9;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .firemoo-chat-form-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .firemoo-chat-options {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .firemoo-chat-options-content {
          width: 100%;
          max-width: 320px;
        }

        .firemoo-chat-options-title {
          font-weight: 600;
          font-size: 18px;
          color: #111827;
          margin-bottom: 8px;
          text-align: center;
        }

        .firemoo-chat-options-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 24px;
          text-align: center;
        }

        .firemoo-chat-option-button {
          width: 100%;
          padding: 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .firemoo-chat-option-button:hover {
          border-color: ${config.primaryColor};
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .firemoo-chat-option-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .firemoo-chat-option-text {
          flex: 1;
        }

        .firemoo-chat-option-title {
          font-weight: 600;
          font-size: 14px;
          color: #111827;
          margin-bottom: 4px;
        }

        .firemoo-chat-option-desc {
          font-size: 12px;
          color: #6b7280;
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
      const formSubmit = document.getElementById('firemoo-chat-form-submit');
      const continueBtn = document.getElementById('firemoo-chat-continue');
      const newChatBtn = document.getElementById('firemoo-chat-new');

      button.addEventListener('click', () => this.toggleChat());
      closeBtn.addEventListener('click', () => this.closeChat());
      sendBtn.addEventListener('click', () => this.sendMessage());
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendMessage();
        }
      });

      if (formSubmit) {
        formSubmit.addEventListener('click', () => this.submitForm());
      }

      // Allow form submission with Enter key
      const nameInput = document.getElementById('firemoo-chat-name');
      const emailInput = document.getElementById('firemoo-chat-email');
      const phoneInput = document.getElementById('firemoo-chat-phone');
      
      if (nameInput) {
        nameInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            emailInput.focus();
          }
        });
      }
      
      if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            phoneInput.focus();
          }
        });
      }
      
      if (phoneInput) {
        phoneInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.submitForm();
          }
        });
      }

      if (continueBtn) {
        continueBtn.addEventListener('click', () => this.continueChat());
      }

      if (newChatBtn) {
        newChatBtn.addEventListener('click', () => this.startNewChat());
      }
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
      
      // Show appropriate view
      this.showCurrentView();
      
      // Connect WebSocket if chat is active
      if (this.isChatActive || (!this.visitorData && !this.hasExistingConversation)) {
        // Will connect when chat interface is shown
      }
    }

    showCurrentView() {
      const form = document.getElementById('firemoo-chat-form');
      const options = document.getElementById('firemoo-chat-options');
      const messages = document.getElementById('firemoo-chat-messages');
      const inputContainer = document.getElementById('firemoo-chat-input-container');

      // Hide all views first
      if (form) form.style.display = 'none';
      if (options) options.style.display = 'none';
      if (messages) messages.style.display = 'none';
      if (inputContainer) inputContainer.style.display = 'none';

      // Show appropriate view
      if (!this.visitorData) {
        // Show form if no visitor data
        if (form) form.style.display = 'flex';
      } else if (this.hasExistingConversation && this.conversationId) {
        // Show options if has existing conversation (only on first open)
        // After user chooses, it will show chat interface
        if (options && !this.isChatActive) {
          if (options) options.style.display = 'flex';
        } else {
          // Show chat interface if already active
          this.showChatInterface();
        }
      } else {
        // Show chat interface if visitor data exists but no conversation
        this.showChatInterface();
      }
    }

    closeChat() {
      const window = document.getElementById('firemoo-chat-window');
      window.classList.remove('open');
      this.isOpen = false;
      
      // Disconnect WebSocket
      this.disconnectWebSocket();
      
      // Reset chat active state when closing (so options show again on next open if conversation exists)
      // Only reset if we have existing conversation, otherwise keep it active
      if (this.hasExistingConversation && this.conversationId) {
        this.isChatActive = false;
      }
    }

    async checkExistingConversation() {
      // Try to load conversation from localStorage
      const storageKey = `firemoo_chat_conversation_${visitorID}`;
      const savedConversationId = localStorage.getItem(storageKey);
      
      if (savedConversationId) {
        this.conversationId = savedConversationId;
        this.hasExistingConversation = true;
        
        // Try to verify conversation exists
        try {
        await this.loadMessages();
        } catch (error) {
          // Conversation might not exist, clear it
          this.conversationId = null;
          this.hasExistingConversation = false;
          localStorage.removeItem(storageKey);
        }
      }
    }

    async loadExistingConversation() {
      if (this.conversationId) {
        await this.loadMessages();
        this.showChatInterface();
      }
    }

    showChatInterface() {
      const form = document.getElementById('firemoo-chat-form');
      const options = document.getElementById('firemoo-chat-options');
      const messages = document.getElementById('firemoo-chat-messages');
      const inputContainer = document.getElementById('firemoo-chat-input-container');

      if (form) form.style.display = 'none';
      if (options) options.style.display = 'none';
      if (messages) messages.style.display = 'flex';
      if (inputContainer) inputContainer.style.display = 'block';

      this.isChatActive = true;

      setTimeout(() => {
        const input = document.getElementById('firemoo-chat-input');
        if (input) input.focus();
      }, 100);

      // Connect WebSocket for real-time messages
      this.connectWebSocket();
    }

    submitForm() {
      const nameInput = document.getElementById('firemoo-chat-name');
      const emailInput = document.getElementById('firemoo-chat-email');
      const phoneInput = document.getElementById('firemoo-chat-phone');
      const submitBtn = document.getElementById('firemoo-chat-form-submit');

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();

      // Validation
      if (!name || !email || !phone) {
        this.showError('Mohon lengkapi semua field yang wajib diisi.');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        this.showError('Format email tidak valid.');
        return;
      }

      // Save visitor data
      const visitorData = { name, email, phone };
      saveVisitorData(visitorData);
      this.visitorData = visitorData;

      // Hide form and show chat interface
      this.showChatInterface();
    }

    continueChat() {
      if (this.conversationId) {
        this.shouldReconnect = true;
        this.showChatInterface();
      } else {
        this.startNewChat();
      }
    }

    startNewChat() {
      // Clear conversation ID
      const storageKey = `firemoo_chat_conversation_${visitorID}`;
      localStorage.removeItem(storageKey);
      this.conversationId = null;
      this.hasExistingConversation = false;
      this.messages = [];
      this.isChatActive = true;

      // Disconnect WebSocket for old conversation
      this.disconnectWebSocket();

      // Clear welcome message if exists
      const container = document.getElementById('firemoo-chat-messages');
      if (container) {
        const welcome = container.querySelector('.firemoo-chat-welcome');
        if (welcome) {
          welcome.style.display = 'block';
        }
      }

      // Show chat interface (WebSocket will connect when new conversation is created)
      this.showChatInterface();
    }

    async createConversation(message) {
      try {
        if (!this.visitorData) {
          throw new Error('Visitor data is required');
        }

        const response = await apiRequest('POST', '/api/chat/conversations', {
          visitor_id: visitorID,
          name: this.visitorData.name,
          email: this.visitorData.email,
          phone: this.visitorData.phone,
          message: message,
          current_page: window.location.href,
          referrer: document.referrer || null
        });

        this.conversationId = response.id;
        this.hasExistingConversation = true;
        
        // Save to localStorage
        const storageKey = `firemoo_chat_conversation_${visitorID}`;
        localStorage.setItem(storageKey, this.conversationId);

        // Load messages to get the first message ID and mark it as visitor
        // The first message in a new conversation is always from the visitor
        try {
          await this.loadMessages();
          // Find the message that matches what we sent (should be the first or last message)
          // Messages are ordered by created_at ASC, so first message is at index 0
          // But we also check the last message in case ordering is different
          const matchingMessage = this.messages.find(m => m.message === message && !m.id.toString().startsWith('temp_')) || 
                                  (this.messages.length > 0 && !this.messages[0].id.toString().startsWith('temp_') ? this.messages[0] : null);
          if (matchingMessage) {
            this.sentMessageIds.add(matchingMessage.id);
            matchingMessage.sender_type = 'visitor';
            // Don't render again, loadMessages already rendered
          }
        } catch (error) {
          // Ignore error, will be handled in sendMessage
        }

        // Connect WebSocket and subscribe to chat channel
        this.shouldReconnect = true;
        this.connectWebSocket();

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

      // Check if visitor data exists
      if (!this.visitorData) {
        this.showError('Mohon lengkapi data diri terlebih dahulu.');
        return;
      }

      // Store message text before clearing input
      const messageText = message;

      // Clear input
      input.value = '';
      input.disabled = true;
      this.isLoading = true;

      // Track if this is a new conversation
      const isNewConversation = !this.conversationId;
      
      // Only add temp message for existing conversations (optimistic update)
      // For new conversations, we'll load messages after creation to avoid duplicates
      let tempMessage = null;
      if (!isNewConversation) {
        tempMessage = {
          id: 'temp_' + Date.now(),
          message: messageText,
          sender_type: 'visitor', // IMPORTANT: Always 'visitor' for messages sent from widget
          created_at: new Date().toISOString()
        };
        this.messages.push(tempMessage);
        this.renderMessages();
      }

      try {
        // If no conversation, create one (this already sends the first message)
        if (isNewConversation) {
          await this.createConversation(messageText);
          // createConversation already loads messages and marks the first message as visitor
          // No need to render again as loadMessages already does it
        } else {
          // Send message for existing conversation
          const sendResponse = await apiRequest('POST', `/api/chat/conversations/${this.conversationId}/messages`, {
            message: messageText,
            message_type: 'text'
          });

          // Store the sent message ID to ensure it's always marked as visitor
          // This is CRITICAL: messages sent from this widget are always from visitor
          const sentMessageId = sendResponse.id;
          this.sentMessageIds.add(sentMessageId);

          // Remove temp message before loading real messages
          if (tempMessage) {
            this.messages = this.messages.filter(m => m.id !== tempMessage.id);
          }

          // Reload messages to get server response (includes the message we just sent)
          // This will replace the temp message with the real one from server
          await this.loadMessages();
        }
      } catch (error) {
        // Remove temp message on error
        if (tempMessage) {
          this.messages = this.messages.filter(m => m.id !== tempMessage.id);
          this.renderMessages();
        }
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
          // Normalize sender_type for all messages
          // IMPORTANT: Pesan dari visitor harus tetap 'visitor', bukan 'agent'
          const normalizedMessages = response.messages.map(msg => {
            // CRITICAL: If this message was sent from this widget, it's always 'visitor'
            if (this.sentMessageIds.has(msg.id)) {
              return {
                ...msg,
                sender_type: 'visitor'
              };
            }
            
            // Normalize sender_type: case-insensitive, trim whitespace
            let senderType = (msg.sender_type || '').toString().toLowerCase().trim();
            
            // If sender_type is empty or unclear, try to determine from sender_id
            // If sender_id matches our visitorID pattern or is from conversation visitor, it's visitor
            if (!senderType || (senderType !== 'visitor' && senderType !== 'agent')) {
              // Check if we can determine from sender_id
              // For now, default to 'agent' if unclear (but this should rarely happen)
              senderType = 'agent';
            }
            
            // Final normalization: only 'visitor' stays as 'visitor', everything else is 'agent'
            const finalSenderType = senderType === 'visitor' ? 'visitor' : 'agent';
            
            return {
              ...msg,
              sender_type: finalSenderType
            };
          });
          
          // Remove duplicates by ID: use Set to track unique message IDs
          const seenIds = new Set();
          const uniqueMessages = normalizedMessages.filter(msg => {
            const msgId = msg.id ? msg.id.toString() : null;
            if (!msgId) {
              // Messages without ID are kept (shouldn't happen, but handle it)
              return true;
            }
            if (seenIds.has(msgId)) {
              return false; // Duplicate, skip
            }
            seenIds.add(msgId);
            return true; // Unique, keep
          });
          
          // Simply replace all messages with server messages (after removing temp messages)
          // This ensures no duplicates and no temp messages remain
          this.messages = uniqueMessages;
          this.renderMessages();
        }
        
        // After loading messages, ensure WebSocket is connected
        if (this.isChatActive) {
          this.connectWebSocket();
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

      // Store current scroll position
      const wasAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

      // Clear existing messages (except welcome)
      const existingMessages = container.querySelectorAll('.firemoo-chat-message');
      existingMessages.forEach(msg => msg.remove());

      // Render messages
      this.messages.forEach((msg, index) => {
        // Normalize sender_type: case-insensitive, trim whitespace
        // IMPORTANT: Pesan dari visitor harus tetap 'visitor', bukan 'agent'
        // - visitor = visitor (pengirim/visitor di KANAN)
        // - agent/admin/user = agent (penerima/admin di KIRI)
        const senderTypeRaw = (msg.sender_type || '').toString().toLowerCase().trim();
        const senderType = senderTypeRaw === 'visitor' ? 'visitor' : 'agent';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `firemoo-chat-message ${senderType}`;
        
        // Create wrapper for bubble and time
        const messageContent = document.createElement('div');
        messageContent.className = 'firemoo-chat-message-content';
        
        const bubble = document.createElement('div');
        bubble.className = 'firemoo-chat-message-bubble';
        bubble.textContent = msg.message;

        const time = document.createElement('div');
        time.className = 'firemoo-chat-message-time';
        const date = new Date(msg.created_at);
        // Use user's local timezone instead of hardcoded 'id-ID'
        time.textContent = date.toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });

        messageContent.appendChild(bubble);
        messageContent.appendChild(time);
        messageDiv.appendChild(messageContent);
        container.appendChild(messageDiv);

        // Add smooth animation for new messages (especially from agent)
        if (index === this.messages.length - 1) {
          // Last message - add animation
          setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = senderType === 'visitor' 
              ? 'translateX(10px)' 
              : 'translateX(-10px)';
            messageDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            
            requestAnimationFrame(() => {
              messageDiv.style.opacity = '1';
              messageDiv.style.transform = 'translateX(0)';
            });
          }, 10);
        }
      });

      // Smooth scroll to bottom if user was at bottom or if it's a new message
      if (wasAtBottom || this.messages.length > 0) {
        this.smoothScrollToBottom(container);
      }
    }

    smoothScrollToBottom(container) {
      const targetScroll = container.scrollHeight - container.clientHeight;
      const startScroll = container.scrollTop;
      const distance = targetScroll - startScroll;
      const duration = 300;
      let start = null;

      const animateScroll = (timestamp) => {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const percentage = Math.min(progress / duration, 1);
        
        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - percentage, 3);
        
        container.scrollTop = startScroll + (distance * easeOut);
        
        if (progress < duration) {
          requestAnimationFrame(animateScroll);
        }
      };

      requestAnimationFrame(animateScroll);
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

    connectWebSocket() {
      // Don't connect if already connected or no conversation
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        return;
      }

      if (!this.conversationId) {
        // Will connect when conversation is created
        return;
      }

      // Build WebSocket URL
      let wsUrl;
      if (config.baseUrl.startsWith('https://')) {
        wsUrl = config.baseUrl.replace('https://', 'wss://');
      } else if (config.baseUrl.startsWith('http://')) {
        wsUrl = config.baseUrl.replace('http://', 'ws://');
      } else {
        // If no protocol, assume https
        wsUrl = 'wss://' + config.baseUrl;
      }
      
      // Add /websocket path and query parameters
      const params = new URLSearchParams({
        api_key: config.apiKey,
        website_url: config.websiteUrl
      });
      wsUrl = `${wsUrl}/websocket?${params.toString()}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.wsReconnectAttempts = 0;
          
          // Small delay to ensure connection is fully established
          setTimeout(() => {
            // Subscribe to chat channel for this conversation
        if (this.conversationId) {
              this.subscribeToChatChannel();
            }
          }, 100);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            // Handle WebSocket message
            this.handleWebSocketMessage(message);
          } catch (error) {
            // Try to handle as plain text if JSON parsing fails
            if (typeof event.data === 'string') {
              this.handleWebSocketMessage({ message: event.data });
            } else {
              console.error('Firemoo Chat: Failed to parse WebSocket message', error, event.data);
            }
          }
        };

        this.ws.onerror = (error) => {
          console.error('Firemoo Chat: WebSocket error', error);
        };

        this.ws.onclose = () => {
          // Auto-reconnect if should reconnect and haven't exceeded max attempts
          if (this.shouldReconnect && this.wsReconnectAttempts < this.maxReconnectAttempts && this.isOpen && this.conversationId) {
            this.wsReconnectAttempts++;
            setTimeout(() => {
              // Check again before reconnecting
              if (this.shouldReconnect && this.isOpen && this.conversationId) {
                this.connectWebSocket();
              }
            }, this.reconnectDelay * this.wsReconnectAttempts);
          }
        };
      } catch (error) {
        console.error('Firemoo Chat: Failed to create WebSocket connection', error);
      }
    }

    subscribeToChatChannel() {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        // Retry subscription if WebSocket is not ready yet
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          setTimeout(() => this.subscribeToChatChannel(), 500);
        }
        return;
      }

      if (!this.conversationId) {
        return;
      }

      // Subscribe to chat channel for this conversation
      // Support multiple subscription formats
      const subscribeMessages = [
        {
          action: 'subscribe',
          channel: `chat:${this.conversationId}`
        },
        {
          type: 'subscribe',
          channel: `chat:${this.conversationId}`
        },
        {
          event: 'subscribe',
          channel: `chat:${this.conversationId}`
        }
      ];

      try {
        // Try first format (most common)
        this.ws.send(JSON.stringify(subscribeMessages[0]));
      } catch (error) {
        console.error('Firemoo Chat: Failed to subscribe to chat channel', error);
      }
    }

    handleWebSocketMessage(message) {
      // Skip if no message or invalid
      if (!message || typeof message !== 'object') {
        return;
      }
      
      // Handle different message types
      // Support multiple message formats from backend
      if (message.type === 'channel:event' || message.type === 'event') {
        // Check if it's a chat message event
        const channel = message.channel || message.channel_name;
        if (channel && (channel.startsWith('chat:') || channel === `chat:${this.conversationId}`)) {
          const eventName = message.event || message.event_name;
          // Support multiple event names
          if (eventName === 'message:new' || 
              eventName === 'message:created' || 
              eventName === 'new_message' ||
              eventName === 'message') {
            // New message received
            let messageData = message.data || message.payload || message.message;
            
            if (messageData) {
              // Parse if it's a string
              if (typeof messageData === 'string') {
                try {
                  messageData = JSON.parse(messageData);
                } catch (e) {
                  // If parsing fails, treat as plain text
                  messageData = { message: messageData };
                }
              }
              
              // Ensure we have a proper message object
              const newMessage = {
                id: messageData.id || messageData.message_id || 'ws_' + Date.now(),
                message: messageData.message || messageData.text || messageData.content || '',
                sender_type: messageData.sender_type || messageData.senderType || 'agent',
                created_at: messageData.created_at || messageData.createdAt || new Date().toISOString(),
                conversation_id: messageData.conversation_id || messageData.conversationId || this.conversationId
              };
              
              // CRITICAL: If this message was sent from this widget, it's always 'visitor'
              if (this.sentMessageIds.has(newMessage.id)) {
                newMessage.sender_type = 'visitor';
              } else {
                // Normalize sender_type: case-insensitive, trim whitespace
                // IMPORTANT: Pesan dari visitor harus tetap 'visitor', bukan 'agent'
                const senderType = (newMessage.sender_type || '').toString().toLowerCase().trim();
                newMessage.sender_type = senderType === 'visitor' ? 'visitor' : 'agent';
              }
              
              // Only add if it's not already in messages and belongs to current conversation
              // Also check if conversation_id matches or if it's not specified (assume current conversation)
              const conversationMatches = !newMessage.conversation_id || 
                                         newMessage.conversation_id === this.conversationId ||
                                         newMessage.conversation_id.toString() === this.conversationId.toString();
              
              const exists = this.messages.some(m => m.id === newMessage.id || 
                                                     (m.id && newMessage.id && m.id.toString() === newMessage.id.toString()));
              
              if (!exists && conversationMatches && this.conversationId) {
                // Hide typing indicator if showing
                this.hideTyping();
                
                // Ensure conversation_id is set
                newMessage.conversation_id = this.conversationId;
                
                // Add message with smooth animation
                this.messages.push(newMessage);
                this.renderMessages();
                
                // Show notification sound or visual feedback for agent messages
                if (newMessage.sender_type === 'agent' && !this.isOpen) {
                  // Could add notification here if chat is closed
                }
              }
            }
          }
        }
      } else if (message.type === 'system:event' || message.type === 'system') {
        // Handle system events
        const eventName = message.event || message.event_name;
        if (eventName === 'connected' || eventName === 'connection:established') {
          // WebSocket connected, subscribe to chat channel
          if (this.conversationId) {
            this.subscribeToChatChannel();
          }
        }
      } else if (message.action === 'message' || message.message) {
        // Direct message format (fallback)
        const newMessage = {
          id: message.id || message.message_id || 'ws_' + Date.now(),
          message: message.message || message.text || message.content || '',
          sender_type: message.sender_type || message.senderType || 'agent',
          created_at: message.created_at || message.createdAt || new Date().toISOString(),
          conversation_id: message.conversation_id || message.conversationId || this.conversationId
        };
        
        // Normalize sender_type
        if (!this.sentMessageIds.has(newMessage.id)) {
          const senderType = (newMessage.sender_type || '').toString().toLowerCase().trim();
          newMessage.sender_type = senderType === 'visitor' ? 'visitor' : 'agent';
        } else {
          newMessage.sender_type = 'visitor';
        }
        
        // Only add if it's not already in messages and belongs to current conversation
        const conversationMatches = !newMessage.conversation_id || 
                                   newMessage.conversation_id === this.conversationId ||
                                   newMessage.conversation_id.toString() === this.conversationId.toString();
        
        const exists = this.messages.some(m => m.id === newMessage.id || 
                                               (m.id && newMessage.id && m.id.toString() === newMessage.id.toString()));
        
        if (!exists && conversationMatches && this.conversationId) {
          // Ensure conversation_id is set
          newMessage.conversation_id = this.conversationId;
          
          this.hideTyping();
          this.messages.push(newMessage);
          this.renderMessages();
        }
      }
    }

    disconnectWebSocket() {
      this.shouldReconnect = false;
      
      if (this.ws) {
        // Remove event listeners to prevent reconnection
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.onmessage = null;
        this.ws.onopen = null;
        
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
        this.ws = null;
      }
      
      // Reset reconnect attempts
      this.wsReconnectAttempts = 0;
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

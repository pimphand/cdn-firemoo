/**
 * Firemoo CDN - Real-time Database SDK
 * Version: 1.0.0
 *
 * Usage:
 *   <script src="firemoo.js" api-key="YOUR_API_KEY" base-url="api-firemoo.dmpt.my.id"></script>
 *
 *   firemoo.getCollections()
 *   firemoo.getDocuments(collectionId)
 *   let ws = firemoo.websocket()
 */

(function (global) {
  'use strict';

  // Get configuration from script tag
  function getConfig() {
    const scripts = document.getElementsByTagName('script');
    let config = {
      apiKey: null,
      baseUrl: 'api-firemoo.dmpt.my.id',
      websiteUrl: window.location.origin
    };

    for (let i = 0; i < scripts.length; i++) {
      const script = scripts[i];
      if (script.src && script.src.includes('firemoo')) {
        config.apiKey = script.getAttribute('api-key') || script.getAttribute('data-api-key');
        config.baseUrl = script.getAttribute('base-url') || script.getAttribute('data-base-url') || config.baseUrl;
        config.websiteUrl = script.getAttribute('website-url') || script.getAttribute('data-website-url') || config.websiteUrl;
        break;
      }
    }

    if (!config.apiKey) {
      console.error('Firemoo: API key is required. Add api-key attribute to script tag.');
      throw new Error('Firemoo: API key is required');
    }

    // Remove trailing slash from baseUrl
    config.baseUrl = config.baseUrl.replace(/\/$/, '');

    return config;
  }

  const config = getConfig();

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
      console.error('Firemoo API Error:', error);
      throw error;
    }
  }

  // Collections API
  const collections = {
    /**
     * Get all collections
     * @returns {Promise<Object>} Response with collections array
     */
    async getAll() {
      return await apiRequest('GET', '/api/collections');
    },

    /**
     * Get a single collection by ID
     * @param {string} collectionId - Collection UUID
     * @returns {Promise<Object>} Collection object
     */
    async get(collectionId) {
      return await apiRequest('GET', `/api/collections/${collectionId}`);
    },

    /**
     * Create a new collection
     * @param {string} name - Collection name
     * @param {Object} options - Optional parent collection/document IDs
     * @returns {Promise<Object>} Created collection
     */
    async create(name, options = {}) {
      const data = {
        name: name,
        ...options
      };
      return await apiRequest('POST', '/api/collections', data);
    },

    /**
     * Delete a collection
     * @param {string} collectionId - Collection UUID
     * @returns {Promise<Object>} Success message
     */
    async delete(collectionId) {
      return await apiRequest('DELETE', `/api/collections/${collectionId}`);
    }
  };

  // Documents API
  const documents = {
    /**
     * Get all documents in a collection
     * @param {string} collectionId - Collection UUID
     * @param {Object} options - Pagination options (page, limit)
     * @returns {Promise<Object>} Response with documents array and pagination info
     */
    async getAll(collectionId, options = {}) {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const query = params.toString();
      const endpoint = `/api/collections/${collectionId}/documents${query ? '?' + query : ''}`;
      return await apiRequest('GET', endpoint);
    },

    /**
     * Get a single document by ID
     * @param {string} collectionId - Collection UUID
     * @param {string} documentId - Document ID
     * @param {Object} options - Format options (format: 'firestore', project_id, database_id)
     * @returns {Promise<Object>} Document object
     */
    async get(collectionId, documentId, options = {}) {
      const params = new URLSearchParams();
      if (options.format) params.append('format', options.format);
      if (options.project_id) params.append('project_id', options.project_id);
      if (options.database_id) params.append('database_id', options.database_id);

      const query = params.toString();
      const endpoint = `/api/collections/${collectionId}/documents/${documentId}${query ? '?' + query : ''}`;
      return await apiRequest('GET', endpoint);
    },

    /**
     * Create a new document
     * @param {string} collectionId - Collection UUID
     * @param {Object} data - Document data
     * @param {string} documentId - Optional document ID (auto-generated if not provided)
     * @returns {Promise<Object>} Created document
     */
    async create(collectionId, data, documentId = null) {
      const payload = {
        data: data
      };
      if (documentId) {
        payload.document_id = documentId;
      }
      return await apiRequest('POST', `/api/collections/${collectionId}/documents`, payload);
    },

    /**
     * Update a document
     * @param {string} collectionId - Collection UUID
     * @param {string} documentId - Document ID
     * @param {Object} data - Updated document data
     * @returns {Promise<Object>} Updated document
     */
    async update(collectionId, documentId, data) {
      return await apiRequest('PUT', `/api/collections/${collectionId}/documents/${documentId}`, { data });
    },

    /**
     * Patch (partial update) a document
     * @param {string} collectionId - Collection UUID
     * @param {string} documentId - Document ID
     * @param {Object} data - Partial document data
     * @returns {Promise<Object>} Updated document
     */
    async patch(collectionId, documentId, data) {
      return await apiRequest('PATCH', `/api/collections/${collectionId}/documents/${documentId}`, { data });
    },

    /**
     * Delete a document
     * @param {string} collectionId - Collection UUID
     * @param {string} documentId - Document ID
     * @returns {Promise<Object>} Success message
     */
    async delete(collectionId, documentId) {
      return await apiRequest('DELETE', `/api/collections/${collectionId}/documents/${documentId}`);
    }
  };

  // WebSocket wrapper
  class FiremooWebSocket {
    constructor() {
      this.ws = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 5;
      this.reconnectDelay = 1000;
      this.listeners = new Map();
      this.isConnected = false;
      this.shouldReconnect = true;
    }

    /**
     * Connect to WebSocket
     * @param {Object} options - Connection options
     * @returns {Promise<void>}
     */
    async connect(options = {}) {
      return new Promise((resolve, reject) => {
        try {
          // WebSocket in browser can't send custom headers, so we use query parameters
          const params = new URLSearchParams({
            api_key: config.apiKey,
            website_url: config.websiteUrl
          });
          const wsUrl = config.baseUrl.replace(/^http/, 'ws') + '/websocket?' + params.toString();
          this.ws = new WebSocket(wsUrl);

          this.ws.onopen = () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.emit('connected');

            // Auto-subscribe to firestore channel for realtime events
            this.subscribe('firestore');

            if (options.onConnect) options.onConnect();
            resolve();
          };

          this.ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Firemoo WebSocket: Failed to parse message', error);
            }
          };

          this.ws.onerror = (error) => {
            console.error('Firemoo WebSocket: Error', error);
            this.emit('error', error);
            if (options.onError) options.onError(error);
            reject(error);
          };

          this.ws.onclose = () => {
            this.isConnected = false;
            this.emit('disconnected');
            if (options.onDisconnect) options.onDisconnect();

            // Auto-reconnect
            if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              setTimeout(() => {
                this.connect(options).catch(() => {});
              }, this.reconnectDelay * this.reconnectAttempts);
            }
          };

        } catch (error) {
          reject(error);
        }
      });
    }

    /**
     * Handle incoming WebSocket messages
     * @param {Object} message - Parsed message
     */
    handleMessage(message) {
      // Handle different message types
      if (message.type === 'firestore:connected') {
        this.emit('firestore:connected', message);
        return;
      }

      if (message.type === 'channel:event') {
        this.emit(`channel:${message.channel}:${message.event}`, message.data);
        this.emit('channel:event', {
          channel: message.channel,
          event: message.event,
          data: message.data
        });
        return;
      }

      if (message.type === 'system:event') {
        this.emit(`system:${message.event}`, message.data);
        this.emit('system:event', {
          event: message.event,
          data: message.data
        });
        return;
      }

      // Firestore realtime events
      if (message.type && message.type.startsWith('document_') || message.type.startsWith('collection_')) {
        this.emit('firestore:event', message);
        this.emit(message.type, message);
        return;
      }

      // Default: emit as generic message
      this.emit('message', message);
    }

    /**
     * Subscribe to a channel
     * @param {string} channel - Channel name
     */
    subscribe(channel) {
      if (!this.isConnected) {
        console.warn('Firemoo WebSocket: Not connected. Call connect() first.');
        return;
      }

      this.send({
        action: 'subscribe',
        channel: channel
      });
    }

    /**
     * Unsubscribe from a channel
     * @param {string} channel - Channel name
     */
    unsubscribe(channel) {
      if (!this.isConnected) {
        console.warn('Firemoo WebSocket: Not connected. Call connect() first.');
        return;
      }

      this.send({
        action: 'unsubscribe',
        channel: channel
      });
    }

    /**
     * Send a message through WebSocket
     * @param {Object} data - Message data
     */
    send(data) {
      if (!this.isConnected || !this.ws) {
        console.warn('Firemoo WebSocket: Not connected. Call connect() first.');
        return;
      }

      this.ws.send(JSON.stringify(data));
    }

    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function (optional, removes all if not provided)
     */
    off(event, callback) {
      if (!this.listeners.has(event)) {
        return;
      }

      if (callback) {
        const callbacks = this.listeners.get(event);
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      } else {
        this.listeners.delete(event);
      }
    }

    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
      if (this.listeners.has(event)) {
        this.listeners.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error('Firemoo WebSocket: Error in event listener', error);
          }
        });
      }
    }

    /**
     * Disconnect WebSocket
     */
    disconnect() {
      this.shouldReconnect = false;
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.isConnected = false;
    }

    /**
     * Ping the server
     */
    ping() {
      this.send({ action: 'ping' });
    }
  }

  // Main Firemoo object
  const firemoo = {
    version: '1.0.0',
    name: 'firemoo',
    description: 'Firemoo is a real-time database for your web applications.',
    author: 'Pimphand',
    license: 'MIT',

    // Collections API
    getCollections: collections.getAll.bind(collections),
    getCollection: collections.get.bind(collections),
    createCollection: collections.create.bind(collections),
    deleteCollection: collections.delete.bind(collections),

    // Documents API
    getDocuments: documents.getAll.bind(documents),
    getDocument: documents.get.bind(documents),
    createDocument: documents.create.bind(documents),
    updateDocument: documents.update.bind(documents),
    patchDocument: documents.patch.bind(documents),
    deleteDocument: documents.delete.bind(documents),

    // WebSocket
    websocket: function() {
      const ws = new FiremooWebSocket();
      // Auto-connect with API key authentication
      // Note: WebSocket authentication happens via Origin header and API key
      // The server will authenticate based on the Origin header matching the website URL
      ws.connect().catch(error => {
        console.error('Firemoo: Failed to connect WebSocket', error);
      });
      return ws;
    },

    // Direct access to collections and documents objects
    collections: collections,
    documents: documents,

    // Configuration
    getConfig: function() {
      return { ...config };
    }
  };

  // Export to global scope
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = firemoo;
  } else {
    global.firemoo = firemoo;
  }

})(typeof window !== 'undefined' ? window : this);


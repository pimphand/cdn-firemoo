// Documentation Content Data
const docsData = {
    sections: [
        {
            id: 'introduction',
            title: '1. Pengenalan',
            content: `
                <p class="mb-4">Firemoo adalah SDK JavaScript untuk mengakses database real-time melalui CDN. Dengan Firemoo, Anda dapat dengan mudah mengelola collections, documents, dan menerima update real-time melalui WebSocket.</p>

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>📌 Info:</strong> Firemoo menggunakan API Key untuk autentikasi dan mendukung koneksi WebSocket untuk update real-time.
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Fitur Utama</h3>
                <ul class="list-disc list-inside space-y-2 mb-6">
                    <li>✅ Manajemen Collections (CRUD)</li>
                    <li>✅ Manajemen Documents (CRUD)</li>
                    <li>✅ Real-time updates melalui WebSocket</li>
                    <li>✅ Auto-reconnect untuk koneksi WebSocket</li>
                    <li>✅ Event-driven architecture</li>
                    <li>✅ Pagination support untuk documents</li>
                    <li>✅ Firestore format compatibility</li>
                </ul>
            `
        },
        {
            id: 'installation',
            title: '2. Instalasi',
            content: `
                <p class="mb-4">Tambahkan script Firemoo ke halaman HTML Anda dengan atribut yang diperlukan:</p>

                <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>&lt;script
    src="https://cdn.jsdelivr.net/gh/pimphand/cdn-firemoo/firemoo.js"
    api-key="YOUR_API_KEY"
    base-url="https://api-firemoo.dmpt.my.id"
    website-url="https://yourdomain.com"&gt;
&lt;/script&gt;</code></pre>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Atribut Script</h3>
                <div class="overflow-x-auto mb-6">
                    <table class="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr class="bg-gray-900 text-white">
                                <th class="border border-gray-300 px-4 py-2 text-left">Atribut</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Wajib</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Default</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Deskripsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">api-key</code> atau <code class="bg-gray-100 px-2 py-1 rounded">data-api-key</code></td>
                                <td class="border border-gray-300 px-4 py-2">✅ Ya</td>
                                <td class="border border-gray-300 px-4 py-2">-</td>
                                <td class="border border-gray-300 px-4 py-2">API Key untuk autentikasi</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">base-url</code> atau <code class="bg-gray-100 px-2 py-1 rounded">data-base-url</code></td>
                                <td class="border border-gray-300 px-4 py-2">❌ Tidak</td>
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">https://api-firemoo.dmpt.my.id</code></td>
                                <td class="border border-gray-300 px-4 py-2">URL base server API</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">website-url</code> atau <code class="bg-gray-100 px-2 py-1 rounded">data-website-url</code></td>
                                <td class="border border-gray-300 px-4 py-2">❌ Tidak</td>
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">window.location.origin</code></td>
                                <td class="border border-gray-300 px-4 py-2">URL website untuk autentikasi</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>⚠️ Peringatan:</strong> API Key wajib disediakan. Jika tidak ada, script akan throw error.
                </div>
            `
        },
        {
            id: 'configuration',
            title: '3. Konfigurasi',
            content: `
                <p class="mb-4">Setelah script dimuat, Firemoo akan otomatis membaca konfigurasi dari script tag. Anda juga dapat melihat konfigurasi saat ini:</p>

                <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>// Mendapatkan konfigurasi saat ini
const config = firemoo.getConfig();
console.log(config);
// {
//   apiKey: "YOUR_API_KEY",
//   baseUrl: "https://api-firemoo.dmpt.my.id",
//   websiteUrl: "https://yourdomain.com"
// }</code></pre>

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>📌 Info:</strong> Base URL secara otomatis menghilangkan trailing slash jika ada.
                </div>
            `
        },
        {
            id: 'collections',
            title: '4. Collections API',
            content: `
                <p class="mb-6">API untuk mengelola collections di database.</p>

                ${createMethodCard('firemoo.getCollections()', 'Mendapatkan semua collections.', 'async getCollections() → Promise&lt;Object&gt;', [], 'Promise&lt;Object&gt; - Response dengan array collections', `try {
    const response = await firemoo.getCollections();
    console.log(response.collections); // Array of collections
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.getCollection(collectionId)', 'Mendapatkan collection berdasarkan ID.', 'async getCollection(collectionId: string) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' }
                ], 'Promise&lt;Object&gt; - Collection object', `try {
    const collection = await firemoo.getCollection('uuid-collection-id');
    console.log(collection);
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.createCollection(name, options)', 'Membuat collection baru.', 'async createCollection(name: string, options?: Object) → Promise&lt;Object&gt;', [
                    { name: 'name', type: 'string', desc: 'Nama collection' },
                    { name: 'options', type: 'Object', desc: 'Opsi parent collection/document IDs', optional: true }
                ], 'Promise&lt;Object&gt; - Collection yang dibuat', `try {
    // Create simple collection
    const collection = await firemoo.createCollection('users');

    // Create nested collection
    const nestedCollection = await firemoo.createCollection('posts', {
        parent_collection_id: 'users-uuid',
        parent_document_id: 'user-doc-uuid'
    });
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.deleteCollection(collectionId)', 'Menghapus collection.', 'async deleteCollection(collectionId: string) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' }
                ], 'Promise&lt;Object&gt; - Pesan sukses', `try {
    const result = await firemoo.deleteCollection('uuid-collection-id');
    console.log(result.message); // Success message
} catch (error) {
    console.error('Error:', error);
}`)}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Alternatif: Menggunakan Object Collections</h3>
                <p class="mb-4">Anda juga dapat menggunakan object <code class="bg-gray-100 px-2 py-1 rounded">firemoo.collections</code> secara langsung:</p>
                <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>// Setara dengan firemoo.getCollections()
await firemoo.collections.getAll();

// Setara dengan firemoo.getCollection(id)
await firemoo.collections.get(collectionId);

// Setara dengan firemoo.createCollection(name, options)
await firemoo.collections.create(name, options);

// Setara dengan firemoo.deleteCollection(id)
await firemoo.collections.delete(collectionId);</code></pre>
            `
        },
        {
            id: 'documents',
            title: '5. Documents API',
            content: `
                <p class="mb-6">API untuk mengelola documents di dalam collection.</p>

                ${createMethodCard('firemoo.getDocuments(collectionId, options)', 'Mendapatkan semua documents dalam collection dengan support pagination.', 'async getDocuments(collectionId: string, options?: Object) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' },
                    { name: 'options', type: 'Object', desc: 'Opsi pagination: page (number), limit (number)', optional: true }
                ], 'Promise&lt;Object&gt; - Response dengan array documents dan info pagination', `try {
    // Get all documents
    const response = await firemoo.getDocuments('collection-id');
    console.log(response.documents);

    // Get with pagination
    const paginated = await firemoo.getDocuments('collection-id', {
        page: 1,
        limit: 10
    });
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.getDocument(collectionId, documentId, options)', 'Mendapatkan document berdasarkan ID.', 'async getDocument(collectionId: string, documentId: string, options?: Object) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' },
                    { name: 'documentId', type: 'string', desc: 'Document ID' },
                    { name: 'options', type: 'Object', desc: 'Format options: format, project_id, database_id', optional: true }
                ], 'Promise&lt;Object&gt; - Document object', `try {
    // Get document
    const doc = await firemoo.getDocument('collection-id', 'document-id');

    // Get with firestore format
    const firestoreDoc = await firemoo.getDocument('collection-id', 'document-id', {
        format: 'firestore',
        project_id: 'my-project',
        database_id: '(default)'
    });
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.createDocument(collectionId, data, documentId)', 'Membuat document baru.', 'async createDocument(collectionId: string, data: Object, documentId?: string) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' },
                    { name: 'data', type: 'Object', desc: 'Data document' },
                    { name: 'documentId', type: 'string', desc: 'Document ID custom (auto-generated jika tidak disediakan)', optional: true }
                ], 'Promise&lt;Object&gt; - Document yang dibuat', `try {
    // Create with auto-generated ID
    const doc1 = await firemoo.createDocument('collection-id', {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
    });

    // Create with custom ID
    const doc2 = await firemoo.createDocument('collection-id', {
        name: 'Jane Doe',
        email: 'jane@example.com'
    }, 'custom-doc-id');
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.updateDocument(collectionId, documentId, data)', 'Update seluruh document (replace semua field).', 'async updateDocument(collectionId: string, documentId: string, data: Object) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' },
                    { name: 'documentId', type: 'string', desc: 'Document ID' },
                    { name: 'data', type: 'Object', desc: 'Data baru untuk document' }
                ], 'Promise&lt;Object&gt; - Document yang diupdate', `try {
    const updated = await firemoo.updateDocument('collection-id', 'document-id', {
        name: 'John Updated',
        email: 'john.updated@example.com',
        age: 31
    });
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.patchDocument(collectionId, documentId, data)', 'Partial update document (hanya update field yang disediakan).', 'async patchDocument(collectionId: string, documentId: string, data: Object) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' },
                    { name: 'documentId', type: 'string', desc: 'Document ID' },
                    { name: 'data', type: 'Object', desc: 'Partial data untuk diupdate' }
                ], 'Promise&lt;Object&gt; - Document yang diupdate', `try {
    // Only update age field
    const patched = await firemoo.patchDocument('collection-id', 'document-id', {
        age: 32
    });
} catch (error) {
    console.error('Error:', error);
}`)}

                ${createMethodCard('firemoo.deleteDocument(collectionId, documentId)', 'Menghapus document.', 'async deleteDocument(collectionId: string, documentId: string) → Promise&lt;Object&gt;', [
                    { name: 'collectionId', type: 'string', desc: 'Collection UUID' },
                    { name: 'documentId', type: 'string', desc: 'Document ID' }
                ], 'Promise&lt;Object&gt; - Pesan sukses', `try {
    const result = await firemoo.deleteDocument('collection-id', 'document-id');
    console.log(result.message); // Success message
} catch (error) {
    console.error('Error:', error);
}`)}

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>📌 Perbedaan Update vs Patch:</strong><br>
                    - <code class="bg-gray-100 px-2 py-1 rounded">updateDocument</code> akan mengganti seluruh document dengan data baru<br>
                    - <code class="bg-gray-100 px-2 py-1 rounded">patchDocument</code> hanya akan mengupdate field yang disediakan, field lain tetap tidak berubah
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Alternatif: Menggunakan Object Documents</h3>
                <p class="mb-4">Anda juga dapat menggunakan object <code class="bg-gray-100 px-2 py-1 rounded">firemoo.documents</code> secara langsung:</p>
                <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>// Setara dengan firemoo.getDocuments(id, options)
await firemoo.documents.getAll(collectionId, options);

// Setara dengan firemoo.getDocument(id, docId, options)
await firemoo.documents.get(collectionId, documentId, options);

// Setara dengan firemoo.createDocument(id, data, docId)
await firemoo.documents.create(collectionId, data, documentId);

// Setara dengan firemoo.updateDocument(id, docId, data)
await firemoo.documents.update(collectionId, documentId, data);

// Setara dengan firemoo.patchDocument(id, docId, data)
await firemoo.documents.patch(collectionId, documentId, data);

// Setara dengan firemoo.deleteDocument(id, docId)
await firemoo.documents.delete(collectionId, documentId);</code></pre>
            `
        },
        {
            id: 'websocket',
            title: '6. WebSocket API',
            content: `
                <p class="mb-6">API untuk koneksi real-time melalui WebSocket. Firemoo WebSocket otomatis melakukan reconnect jika koneksi terputus.</p>

                ${createMethodCard('firemoo.websocket()', 'Membuat instance WebSocket dan otomatis connect.', 'websocket() → FiremooWebSocket', [], 'FiremooWebSocket - Instance WebSocket', `// Create and auto-connect WebSocket
const ws = firemoo.websocket();

// Listen to connection events
ws.on('connected', () => {
    console.log('WebSocket connected!');
});

ws.on('disconnected', () => {
    console.log('WebSocket disconnected!');
}`)}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Methods WebSocket</h3>

                ${createMethodCard('ws.connect(options)', 'Connect ke WebSocket server (otomatis dipanggil oleh firemoo.websocket()).', 'async connect(options?: Object) → Promise&lt;void&gt;', [
                    { name: 'options', type: 'Object', desc: 'onConnect (Function), onError (Function), onDisconnect (Function)', optional: true }
                ], 'Promise&lt;void&gt;', `const ws = new FiremooWebSocket();
await ws.connect({
    onConnect: () => console.log('Connected!'),
    onError: (err) => console.error('Error:', err),
    onDisconnect: () => console.log('Disconnected!')
});`)}

                ${createMethodCard('ws.subscribe(channel)', 'Subscribe ke channel tertentu. Secara default, channel \'firestore\' sudah di-subscribe saat connect.', 'subscribe(channel: string) → void', [
                    { name: 'channel', type: 'string', desc: 'Nama channel' }
                ], 'void', `ws.subscribe('notifications');
ws.subscribe('updates');`)}

                ${createMethodCard('ws.unsubscribe(channel)', 'Unsubscribe dari channel.', 'unsubscribe(channel: string) → void', [
                    { name: 'channel', type: 'string', desc: 'Nama channel' }
                ], 'void', `ws.unsubscribe('notifications');`)}

                ${createMethodCard('ws.send(data)', 'Mengirim message melalui WebSocket.', 'send(data: Object) → void', [
                    { name: 'data', type: 'Object', desc: 'Data yang akan dikirim (akan di-stringify otomatis)' }
                ], 'void', `ws.send({
    action: 'custom_action',
    payload: { key: 'value' }
});`)}

                ${createMethodCard('ws.on(event, callback)', 'Menambahkan event listener.', 'on(event: string, callback: Function) → void', [
                    { name: 'event', type: 'string', desc: 'Nama event' },
                    { name: 'callback', type: 'Function', desc: 'Callback function' }
                ], 'void', `ws.on('firestore:event', (data) => {
    console.log('Firestore event:', data);
});

ws.on('message', (data) => {
    console.log('Message received:', data);
});`)}

                ${createMethodCard('ws.off(event, callback)', 'Menghapus event listener.', 'off(event: string, callback?: Function) → void', [
                    { name: 'event', type: 'string', desc: 'Nama event' },
                    { name: 'callback', type: 'Function', desc: 'Callback spesifik untuk dihapus (jika tidak disediakan, semua listener untuk event tersebut akan dihapus)', optional: true }
                ], 'void', `const handler = (data) => console.log(data);

// Remove specific listener
ws.off('firestore:event', handler);

// Remove all listeners for event
ws.off('firestore:event');`)}

                ${createMethodCard('ws.disconnect()', 'Disconnect WebSocket dan disable auto-reconnect.', 'disconnect() → void', [], 'void', `ws.disconnect();`)}

                ${createMethodCard('ws.ping()', 'Mengirim ping ke server.', 'ping() → void', [], 'void', `ws.ping();`)}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Properties WebSocket</h3>
                <div class="overflow-x-auto mb-6">
                    <table class="min-w-full border-collapse border border-gray-300">
                        <thead>
                            <tr class="bg-gray-900 text-white">
                                <th class="border border-gray-300 px-4 py-2 text-left">Property</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Type</th>
                                <th class="border border-gray-300 px-4 py-2 text-left">Deskripsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">isConnected</code></td>
                                <td class="border border-gray-300 px-4 py-2">boolean</td>
                                <td class="border border-gray-300 px-4 py-2">Status koneksi WebSocket</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">reconnectAttempts</code></td>
                                <td class="border border-gray-300 px-4 py-2">number</td>
                                <td class="border border-gray-300 px-4 py-2">Jumlah attempt reconnect saat ini</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">maxReconnectAttempts</code></td>
                                <td class="border border-gray-300 px-4 py-2">number</td>
                                <td class="border border-gray-300 px-4 py-2">Maximum reconnect attempts (default: 5)</td>
                            </tr>
                            <tr class="hover:bg-gray-50">
                                <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">reconnectDelay</code></td>
                                <td class="border border-gray-300 px-4 py-2">number</td>
                                <td class="border border-gray-300 px-4 py-2">Delay antar reconnect dalam ms (default: 1000)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>📌 Auto-Reconnect:</strong> WebSocket akan otomatis mencoba reconnect hingga 5 kali jika koneksi terputus. Delay akan bertambah setiap attempt (1s, 2s, 3s, 4s, 5s).
                </div>
            `
        },
        {
            id: 'events',
            title: '7. Event Reference',
            content: `
                <p class="mb-6">Daftar event yang dapat di-listen melalui WebSocket.</p>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Connection Events</h3>
                ${createEventTable([
                    { event: 'connected', data: '-', desc: 'Dipanggil saat WebSocket berhasil connect' },
                    { event: 'disconnected', data: '-', desc: 'Dipanggil saat WebSocket disconnect' },
                    { event: 'error', data: 'Error object', desc: 'Dipanggil saat terjadi error pada WebSocket' }
                ])}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Firestore Events</h3>
                ${createEventTable([
                    { event: 'firestore:connected', data: 'Message object', desc: 'Dipanggil saat berhasil connect ke Firestore channel' },
                    { event: 'firestore:event', data: 'Event data', desc: 'Dipanggil untuk semua event Firestore (document/collection changes)' },
                    { event: 'document_*', data: 'Event data', desc: 'Event spesifik untuk document changes (contoh: document_created, document_updated, document_deleted)' },
                    { event: 'collection_*', data: 'Event data', desc: 'Event spesifik untuk collection changes (contoh: collection_created, collection_deleted)' }
                ])}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Channel Events</h3>
                ${createEventTable([
                    { event: 'channel:event', data: '{ channel, event, data }', desc: 'Generic event untuk semua channel events' },
                    { event: 'channel:{channel}:{event}', data: 'Event data', desc: 'Event spesifik untuk channel tertentu (contoh: channel:notifications:new)' }
                ])}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">System Events</h3>
                ${createEventTable([
                    { event: 'system:event', data: '{ event, data }', desc: 'Generic event untuk semua system events' },
                    { event: 'system:{event}', data: 'Event data', desc: 'Event spesifik untuk system (contoh: system:ping, system:pong)' }
                ])}

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Generic Events</h3>
                ${createEventTable([
                    { event: 'message', data: 'Message object', desc: 'Default event untuk semua message yang tidak cocok dengan pattern di atas' }
                ])}
            `
        },
        {
            id: 'examples',
            title: '8. Contoh Penggunaan Lengkap',
            content: `
                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Contoh 1: CRUD Operations</h3>
                <div class="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                    <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>// Create Collection
const collection = await firemoo.createCollection('users');
const collectionId = collection.id;

// Create Documents
const user1 = await firemoo.createDocument(collectionId, {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
});

const user2 = await firemoo.createDocument(collectionId, {
    name: 'Jane Doe',
    email: 'jane@example.com',
    age: 28
}, 'custom-user-id'); // Custom ID

// Get All Documents
const allUsers = await firemoo.getDocuments(collectionId);

// Get Single Document
const user = await firemoo.getDocument(collectionId, user1.id);

// Update Document
await firemoo.updateDocument(collectionId, user1.id, {
    name: 'John Updated',
    email: 'john.updated@example.com',
    age: 31
});

// Patch Document (partial update)
await firemoo.patchDocument(collectionId, user1.id, {
    age: 32
});

// Delete Document
await firemoo.deleteDocument(collectionId, user1.id);

// Delete Collection
await firemoo.deleteCollection(collectionId);</code></pre>
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Contoh 2: Real-time Updates dengan WebSocket</h3>
                <div class="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                    <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>// Connect WebSocket
const ws = firemoo.websocket();

// Listen to connection
ws.on('connected', () => {
    console.log('✅ WebSocket connected!');
});

ws.on('disconnected', () => {
    console.log('❌ WebSocket disconnected!');
});

// Listen to Firestore events
ws.on('firestore:event', (event) => {
    console.log('Firestore event:', event.type, event.data);

    switch(event.type) {
        case 'document_created':
            console.log('New document created:', event.data);
            break;
        case 'document_updated':
            console.log('Document updated:', event.data);
            break;
        case 'document_deleted':
            console.log('Document deleted:', event.data);
            break;
    }
});

// Listen to specific document events
ws.on('document_created', (data) => {
    console.log('Document created:', data);
});

// Subscribe to custom channel
ws.subscribe('notifications');

ws.on('channel:notifications:new', (notification) => {
    console.log('New notification:', notification);
});

// Disconnect when done
// ws.disconnect();</code></pre>
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Contoh 3: Pagination</h3>
                <div class="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                    <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>async function loadDocuments(collectionId, page = 1, limit = 10) {
    try {
        const response = await firemoo.getDocuments(collectionId, {
            page: page,
            limit: limit
        });

        console.log('Documents:', response.documents);
        console.log('Total:', response.total);
        console.log('Page:', response.page);
        console.log('Total Pages:', response.totalPages);

        return response;
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// Load first page
await loadDocuments('collection-id', 1, 10);

// Load next page
await loadDocuments('collection-id', 2, 10);</code></pre>
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Contoh 4: Error Handling</h3>
                <div class="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                    <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>async function safeOperation() {
    try {
        const collections = await firemoo.getCollections();
        return collections;
    } catch (error) {
        if (error.message.includes('API key')) {
            console.error('Authentication error:', error.message);
        } else if (error.message.includes('404')) {
            console.error('Resource not found:', error.message);
        } else if (error.message.includes('Network')) {
            console.error('Network error:', error.message);
        } else {
            console.error('Unknown error:', error.message);
        }
        throw error;
    }
}

// Usage
safeOperation()
    .then(collections => {
        console.log('Success:', collections);
    })
    .catch(error => {
        console.error('Operation failed:', error);
    });</code></pre>
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Contoh 5: Nested Collections</h3>
                <div class="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                    <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>// Create parent collection
const usersCollection = await firemoo.createCollection('users');
const userDoc = await firemoo.createDocument(usersCollection.id, {
    name: 'John Doe',
    email: 'john@example.com'
});

// Create nested collection (posts under user)
const postsCollection = await firemoo.createCollection('posts', {
    parent_collection_id: usersCollection.id,
    parent_document_id: userDoc.id
});

// Create post in nested collection
const post = await firemoo.createDocument(postsCollection.id, {
    title: 'My First Post',
    content: 'This is a nested document!',
    created_at: new Date().toISOString()
});</code></pre>
                </div>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Contoh 6: WebSocket dengan Multiple Channels</h3>
                <div class="bg-gray-100 border border-gray-300 p-4 rounded-lg mb-6">
                    <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                    <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>const ws = firemoo.websocket();

// Wait for connection
ws.on('connected', () => {
    // Subscribe to multiple channels
    ws.subscribe('firestore');      // Already subscribed by default
    ws.subscribe('notifications');
    ws.subscribe('chat');
    ws.subscribe('updates');

    console.log('Subscribed to all channels');
});

// Handle firestore events
ws.on('firestore:event', (event) => {
    console.log('Firestore:', event);
});

// Handle notifications
ws.on('channel:notifications:new', (notification) => {
    console.log('New notification:', notification);
    // Show notification to user
});

ws.on('channel:notifications:read', (data) => {
    console.log('Notification read:', data);
});

// Handle chat messages
ws.on('channel:chat:message', (message) => {
    console.log('New message:', message);
    // Display in chat UI
});

// Handle updates
ws.on('channel:updates:available', (update) => {
    console.log('Update available:', update);
    // Show update notification
});

// Send custom message
ws.send({
    action: 'chat:send',
    message: 'Hello from client!',
    channel: 'chat'
});</code></pre>
                </div>
            `
        },
        {
            id: 'additional',
            title: '9. Informasi Tambahan',
            content: `
                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Version & Metadata</h3>
                <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>console.log(firemoo.version);      // "1.0.0"
console.log(firemoo.name);          // "firemoo"
console.log(firemoo.description);   // "Firemoo is a real-time database for your web applications."
console.log(firemoo.author);        // "Pimphand"
console.log(firemoo.license);       // "MIT"</code></pre>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">Headers HTTP Request</h3>
                <p class="mb-4">Semua request API otomatis mengirim headers berikut:</p>
                <ul class="list-disc list-inside space-y-2 mb-6">
                    <li><code class="bg-gray-100 px-2 py-1 rounded">Content-Type: application/json</code></li>
                    <li><code class="bg-gray-100 px-2 py-1 rounded">X-API-Key: YOUR_API_KEY</code></li>
                    <li><code class="bg-gray-100 px-2 py-1 rounded">X-Website-Url: YOUR_WEBSITE_URL</code></li>
                </ul>

                <h3 class="text-2xl font-bold text-gray-700 mt-8 mb-4">WebSocket URL Format</h3>
                <p class="mb-4">WebSocket URL otomatis di-generate dari base URL:</p>
                <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mb-6"><code>// HTTP base URL: https://api-firemoo.dmpt.my.id
// WebSocket URL: ws://localhost:9090/websocket?api_key=...&website_url=...

// HTTPS base URL: https://api.example.com
// WebSocket URL: wss://api.example.com/websocket?api_key=...&website_url=...</code></pre>

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>⚠️ Catatan Keamanan:</strong>
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li>Jangan expose API Key di client-side jika memungkinkan (gunakan environment variables atau backend proxy)</li>
                        <li>Gunakan HTTPS/WSS di production</li>
                        <li>Validasi data di server-side</li>
                        <li>Implement rate limiting di server</li>
                    </ul>
                </div>

                <div class="bg-gray-100 border-l-4 border-gray-500 p-4 mb-6 rounded">
                    <strong>✅ Best Practices:</strong>
                    <ul class="list-disc list-inside mt-2 space-y-1">
                        <li>Selalu handle error dengan try-catch</li>
                        <li>Gunakan pagination untuk large datasets</li>
                        <li>Clean up WebSocket listeners saat tidak digunakan</li>
                        <li>Disconnect WebSocket saat user logout atau page unload</li>
                        <li>Gunakan <code class="bg-gray-100 px-2 py-1 rounded">patchDocument</code> untuk partial updates (lebih efisien)</li>
                    </ul>
                </div>
            `
        }
    ]
};

// Helper function to create method card
function createMethodCard(name, description, signature, params, returns, example) {
    let paramsHtml = '';
    if (params && params.length > 0) {
        paramsHtml = params.map(p => `
            <div class="mb-2 pl-4">
                <span class="font-bold text-gray-900">${p.name}</span>
                (<span class="text-gray-600 italic">${p.type}</span>${p.optional ? ', optional' : ''})
                - ${p.desc}
            </div>
        `).join('');
    }

    return `
        <div class="bg-gray-50 border-l-4 border-gray-900 p-6 rounded-lg mb-6">
            <div class="text-xl font-bold text-gray-900 mb-2">${name}</div>
            <p class="mb-4">${description}</p>
            <div class="bg-gray-900 text-gray-100 p-4 rounded mb-4 overflow-x-auto">
                <code>${signature}</code>
            </div>
            ${paramsHtml ? `<div class="mb-4">${paramsHtml}</div>` : ''}
            <div class="mb-4 pl-4">
                <strong>Returns:</strong> <span class="text-gray-600 italic">${returns}</span>
            </div>
            <div class="bg-gray-100 border border-gray-300 p-4 rounded">
                <div class="font-bold text-gray-800 mb-2">Contoh:</div>
                <pre class="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto"><code>${example}</code></pre>
            </div>
        </div>
    `;
}

// Helper function to create event table
function createEventTable(events) {
    const rows = events.map(e => `
        <tr class="hover:bg-gray-50">
            <td class="border border-gray-300 px-4 py-2"><code class="bg-gray-100 px-2 py-1 rounded">${e.event}</code></td>
            <td class="border border-gray-300 px-4 py-2">${e.data}</td>
            <td class="border border-gray-300 px-4 py-2">${e.desc}</td>
        </tr>
    `).join('');

    return `
        <div class="overflow-x-auto mb-6">
            <table class="min-w-full border-collapse border border-gray-300">
                <thead>
                    <tr class="bg-gray-900 text-white">
                        <th class="border border-gray-300 px-4 py-2 text-left">Event</th>
                        <th class="border border-gray-300 px-4 py-2 text-left">Data</th>
                        <th class="border border-gray-300 px-4 py-2 text-left">Deskripsi</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}


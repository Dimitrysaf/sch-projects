<script setup>
    import { ref, onMounted, computed } from 'vue';
    
    // 🚨 ΔΙΟΡΘΩΣΗ CORS/PROXY:
    // Αλλάζουμε από 'http://localhost:3000/api/fs' (πλήρες URL που προκαλεί CORS)
    // σε σχετική διαδρομή '/api/fs'. Ο Vite proxy (ή ο cloud proxy) θα το χειριστεί.
    const API_BASE_URL = '/api/fs'; 
    
    const currentPath = ref(''); // Η τρέχουσα διαδρομή μέσα στο projects/
    const files = ref([]);       // Η λίστα των αρχείων/φακέλων στην τρέχουσα διαδρομή
    const loading = ref(false);
    const error = ref(null);
    
    const editingFile = ref(null); // Αρχείο που επεξεργάζεται (πλήρες αντικείμενο)
    const editorContent = ref(''); // Περιεχόμενο του αρχείου στον editor
    const editorStatus = ref('');  // Μήνυμα κατάστασης Editor
    
    // ----------------------------------------------------
    // FETCH & NAVIGATION
    // ----------------------------------------------------
    
    // Λαμβάνει τη λίστα αρχείων για την τρέχουσα διαδρομή
    async function fetchFiles(path = '') {
        loading.value = true;
        error.value = null;
        currentPath.value = path;
        
        try {
            // Το URL τώρα είναι π.χ. "/api/fs/list?path="
            const response = await fetch(`${API_BASE_URL}/list?path=${path}`); 
            if (!response.ok) {
                // Προσπάθησε να διαβάσει το JSON σφάλμα από το backend
                const errorText = await response.text(); 
                throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
            }
            files.value = await response.json();
        } catch (e) {
            error.value = `Δεν είναι δυνατή η φόρτωση της λίστας: ${e.message}`;
            files.value = [];
        } finally {
            loading.value = false;
        }
    }
    
    // Χειρίζεται το κλικ σε ένα στοιχείο της λίστας
    function handleItemClick(file) {
        if (file.isDirectory) {
            // Μετάβαση σε υποφάκελο
            fetchFiles(file.path);
        } else if (!file.isLaunchable) {
            // Άνοιγμα αρχείου για επεξεργασία (όχι HTML)
            openEditor(file);
        }
        // Τα launchable (.html) θα ανοίξουν μέσω του <a> tag
    }
    
    // Μετάβαση στον πάνω φάκελο (..)
    const parentPath = computed(() => {
        // Αν η διαδρομή είναι κενή, είμαστε στη ρίζα
        if (!currentPath.value) return null; 
        // Βρίσκουμε τον προηγούμενο φάκελο
        return currentPath.value.split('/').slice(0, -1).join('/');
    });
    
    // ----------------------------------------------------
    // CRUD ACTIONS
    // ----------------------------------------------------
    
    // 1. ΔΙΑΓΡΑΦΗ
    async function deleteItem(file) {
        if (!confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε το: ${file.name}?`)) return;
    
        try {
            const response = await fetch(`${API_BASE_URL}/delete`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: file.path })
            });
    
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Delete failed.');
            }
    
            // Αναμόρφωση της λίστας μετά τη διαγραφή
            fetchFiles(currentPath.value); 
        } catch (e) {
            error.value = `Σφάλμα διαγραφής: ${e.message}`;
        }
    }
    
    // 2. ΕΠΕΞΕΡΓΑΣΙΑ (Άνοιγμα Editor)
    async function openEditor(file) {
        editingFile.value = file;
        editorStatus.value = `Φόρτωση ${file.name}...`;
    
        try {
            const response = await fetch(`${API_BASE_URL}/content?path=${file.path}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch content.`);
            }
            const data = await response.json();
            editorContent.value = data.content;
            editorStatus.value = `Editing ${file.name}`;
        } catch (e) {
            editorStatus.value = `Σφάλμα φόρτωσης περιεχομένου: ${e.message}`;
            editorContent.value = '';
        }
    }
    
    // 3. ΑΠΟΘΗΚΕΥΣΗ (UPDATE)
    async function saveContent() {
        editorStatus.value = `Αποθήκευση ${editingFile.value.name}...`;
        try {
            const response = await fetch(`${API_BASE_URL}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    path: editingFile.value.path, 
                    content: editorContent.value 
                })
            });
    
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Save failed.');
            }
    
            editorStatus.value = `Επιτυχής αποθήκευση!`;
        } catch (e) {
            editorStatus.value = `Σφάλμα αποθήκευσης: ${e.message}`;
        }
    }
    
    // 4. ΔΗΜΙΟΥΡΓΙΑ ΝΕΟΥ (Create)
    async function createNew(type) { // type: 'file' ή 'folder'
        const newName = prompt(`Εισάγετε όνομα για το νέο ${type}:`);
        if (!newName) return;
    
        try {
            const response = await fetch(`${API_BASE_URL}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    parentPath: currentPath.value,
                    newName: newName,
                    isDirectory: type === 'folder',
                    content: type === 'file' ? '' : undefined
                })
            });
    
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Creation failed.');
            }
    
            // Αναμόρφωση της λίστας
            fetchFiles(currentPath.value); 
        } catch (e) {
            error.value = `Σφάλμα δημιουργίας: ${e.message}`;
        }
    }
    
    // ----------------------------------------------------
    // INITIALIZATION
    // ----------------------------------------------------
    onMounted(() => {
        fetchFiles(''); // Ξεκινάμε από τη ρίζα του /projects/
    });
    </script>
    
    <template>
      <div id="file-manager-app">
        <h1>🗃️ Simple File Manager - /projects/</h1>
    
        <div class="controls-bar">
          <button @click="fetchFiles(parentPath)" :disabled="!parentPath || loading">
            ⬆️ Πίσω ({{ parentPath || 'Ρίζα' }})
          </button>
          <span class="path-display">Τρέχουσα διαδρομή: <strong>{{ currentPath || '/' }}</strong></span>
          
          <button @click="createNew('folder')" :disabled="loading">➕ Φάκελος</button>
          <button @click="createNew('file')" :disabled="loading">➕ Αρχείο</button>
        </div>
    
        <hr/>
    
        <div v-if="editingFile" class="editor-pane">
            <h2>Επεξεργασία: {{ editingFile.name }}</h2>
            <textarea v-model="editorContent" class="editor-textarea"></textarea>
            <div class="editor-controls">
                <button @click="saveContent()">💾 Αποθήκευση</button>
                <button @click="editingFile = null">❌ Κλείσιμο</button>
                <span class="editor-status">{{ editorStatus }}</span>
            </div>
            <hr/>
        </div>
    
        <div v-if="loading" class="status-message">Φόρτωση...</div>
        <div v-else-if="error" class="status-message error">🛑 {{ error }}</div>
        <ul v-else class="file-list">
          <li v-for="file in files" :key="file.path" :class="['file-item', { 'is-dir': file.isDirectory }]">
            
            <div class="file-info">
                <span class="icon">{{ file.isDirectory ? '📁' : (file.isLaunchable ? '🌐' : '📄') }}</span>
                
                <a v-if="file.isLaunchable" :href="`/projects/${file.path}`" target="_blank" class="file-link launchable">
                    {{ file.name }}
                </a>
                <span v-else class="file-link" @click="handleItemClick(file)">
                    {{ file.name }}
                </span>
                
                <span class="size">{{ file.isFile ? (file.size / 1024).toFixed(2) + ' KB' : '' }}</span>
            </div>
    
            <div class="actions">
                <button v-if="file.isFile && !file.isLaunchable" @click="openEditor(file)" title="Επεξεργασία">✏️</button>
                <button @click="deleteItem(file)" title="Διαγραφή" class="delete-btn">🗑️</button>
            </div>
          </li>
        </ul>
      </div>
    </template>
    
    <style>
    /* -------------------- Global Styles -------------------- */
    #file-manager-app {
      font-family: Avenir, Helvetica, Arial, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    .controls-bar {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 20px;
    }
    .path-display {
      flex-grow: 1;
      text-align: left;
      padding-left: 15px;
      color: #35495e;
    }
    
    /* -------------------- File List -------------------- */
    .file-list {
      list-style: none;
      padding: 0;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
    }
    .file-item:last-child { border-bottom: none; }
    .file-item:hover { background-color: #f7f7f7; }
    
    .file-info {
        display: flex;
        align-items: center;
        flex-grow: 1;
    }
    .icon {
        font-size: 1.2em;
        margin-right: 10px;
    }
    .file-link {
        font-weight: bold;
        text-decoration: none;
        color: #2c3e50;
        cursor: pointer;
        margin-right: 20px;
    }
    .launchable {
        color: #42b983; /* Vue Green for launchable files */
    }
    .is-dir {
        background-color: #f0f8ff;
    }
    
    /* -------------------- Editor -------------------- */
    .editor-pane {
        border: 2px solid #35495e;
        padding: 20px;
        margin-bottom: 20px;
        border-radius: 8px;
    }
    .editor-textarea {
        width: 100%;
        min-height: 300px;
        margin: 10px 0;
        font-family: monospace;
        padding: 10px;
        box-sizing: border-box;
    }
    .editor-controls {
        display: flex;
        gap: 10px;
        align-items: center;
    }
    .editor-status {
        color: #1e88e5;
        font-style: italic;
        margin-left: 10px;
    }
    </style>
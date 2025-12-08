<script setup>
    import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
    
    // ΔΙΟΡΘΩΣΗ CORS: Χρησιμοποιούμε σχετική διαδρομή
    const API_BASE_URL = '/api/fs'; 
    
    // ----------------------------------------------------
    // ΔΗΛΩΣΕΙΣ ΜΕΤΑΒΛΗΤΩΝ (Refs) - ΠΡΕΠΕΙ ΝΑ ΕΙΝΑΙ ΠΡΩΤΕΣ
    // ----------------------------------------------------
    const currentPath = ref('');
    const files = ref([]);      
    const loading = ref(false);
    const error = ref(null);
    
    const editingFile = ref(null); 
    const editorContent = ref(''); 
    const editorStatus = ref('');  
    const hasUnsavedChanges = ref(false); 
    
    // ----------------------------------------------------
    // WATCHERS
    // ----------------------------------------------------
    
    // Παρακολουθεί την αλλαγή του editorContent για μη αποθηκευμένες αλλαγές
    watch(editorContent, (newContent, oldContent) => {
        // Ελέγχουμε αν υπάρχει αρχείο προς επεξεργασία και αν η τιμή άλλαξε
        if (editingFile.value && oldContent !== undefined && oldContent !== editorContent.value) {
            hasUnsavedChanges.value = true;
        }
    });

    // ----------------------------------------------------
    // FETCH & NAVIGATION
    // ----------------------------------------------------
    
    async function fetchFiles(path = '') {
        loading.value = true;
        error.value = null;
        currentPath.value = path;
        
        try {
            const response = await fetch(`${API_BASE_URL}/list?path=${path}`); 
            if (!response.ok) {
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
    
    function handleItemClick(file) {
        if (file.isDirectory) {
            fetchFiles(file.path);
        } else {
            // Άνοιγμα editor για όλα τα αρχεία που δεν είναι φάκελοι
            openEditor(file);
        }
    }

    const parentPath = computed(() => {
        if (!currentPath.value) return ''; 
        
        const parts = currentPath.value.split('/');
        const parentParts = parts.slice(0, -1);
        
        return parentParts.join('/');
    });

    // ----------------------------------------------------
    // CRUD & EDITOR FUNCTIONS
    // ----------------------------------------------------
    
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
    
            fetchFiles(currentPath.value); 
        } catch (e) {
            error.value = `Σφάλμα διαγραφής: ${e.message}`;
        }
    }
    
    async function openEditor(file) {
        if (file.isDirectory) {
            fetchFiles(file.path);
            return;
        }

        // Έλεγχος αν έχουμε ήδη ανοιχτό αρχείο με αλλαγές πριν ανοίξουμε νέο
        if (editingFile.value && hasUnsavedChanges.value) {
            if (!confirm(`Παρακαλώ αποθηκεύστε τις αλλαγές στο ${editingFile.value.name} πρώτα.`)) {
                return;
            }
        }

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
            
            // Μόλις φορτωθεί το περιεχόμενο, το θέτουμε σε false
            hasUnsavedChanges.value = false; 

        } catch (e) {
            editorStatus.value = `Σφάλμα φόρτωσης περιεχομένου: ${e.message}`;
            editorContent.value = '';
        }
    }
    
    async function saveContent() {
        if (loading.value) return; 

        loading.value = true;
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
            // Θέτουμε σε false μετά την επιτυχή αποθήκευση
            hasUnsavedChanges.value = false; 
        } catch (e) {
            editorStatus.value = `Σφάλμα αποθήκευσης: ${e.message}`;
        } finally {
            loading.value = false;
        }
    }
    
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
    
            fetchFiles(currentPath.value); 
        } catch (e) {
            error.value = `Σφάλμα δημιουργίας: ${e.message}`;
        }
    }

    function closeEditor() {
        if (hasUnsavedChanges.value) {
            if (!confirm('Έχετε μη αποθηκευμένες αλλαγές. Είστε σίγουροι ότι θέλετε να κλείσετε;')) {
                return; // Ακύρωση κλεισίματος
            }
        }
        editingFile.value = null;
        editorContent.value = '';
        editorStatus.value = '';
        hasUnsavedChanges.value = false;
    }

    function handleKeyDown(event) {
        // Ελέγχουμε αν είμαστε στον editor και αν πατήθηκε Ctrl+S (ή Cmd+S)
        if (editingFile.value && (event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault(); 
            saveContent();
        }
    }
    
    // ----------------------------------------------------
    // INITIALIZATION & CLEANUP
    // ----------------------------------------------------
    onMounted(() => {
        fetchFiles(''); 
        window.addEventListener('keydown', handleKeyDown);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('keydown', handleKeyDown);
    });
</script>
    
<template>
    <div id="file-manager-app">
        
        <div v-if="editingFile" class="editor-full-screen">
            <div class="editor-pane">
                <div class="editor-header">
                    <h2>Επεξεργασία: {{ editingFile.name }} 
                        <span v-if="hasUnsavedChanges" class="unsaved-indicator">*</span>
                    </h2>
                    <div class="editor-controls">
                        <span class="editor-status">{{ editorStatus }}</span>
                        <button @click="saveContent()" class="control-btn save-btn" :disabled="loading">
                            <i class="material-icons">save</i> Αποθήκευση (Ctrl+S)
                        </button>
                        <button @click="closeEditor()" class="control-btn close-btn" :disabled="loading">
                            <i class="material-icons">close</i> Κλείσιμο
                        </button>
                    </div>
                </div>
                
                <textarea v-model="editorContent" class="editor-textarea"></textarea>
                
            </div>
        </div>

        <div v-else>
            <h1><i class="material-icons">folder_open</i> File Manager</h1>

            <div class="controls-bar">
                <button @click="fetchFiles(parentPath)" :disabled="currentPath === '' || loading" class="control-btn nav-btn">
                    <i class="material-icons">arrow_upward</i> Πίσω ({{ parentPath || '/' }})
                </button>
                <span class="path-display">Τρέχουσα διαδρομή: <strong>{{ currentPath || '/' }}</strong></span>
                
                <button @click="createNew('folder')" :disabled="loading" class="control-btn create-btn">
                    <i class="material-icons">create_new_folder</i> Νέος Φάκελος
                </button>
                <button @click="createNew('file')" :disabled="loading" class="control-btn create-btn">
                    <i class="material-icons">note_add</i> Νέο Αρχείο
                </button>
            </div>

            <hr/>

            <div v-if="loading" class="status-message">Φόρτωση...</div>
            <div v-else-if="error" class="status-message error"><i class="material-icons">error</i> {{ error }}</div>
            <ul v-else class="file-list">
                <li v-for="file in files" :key="file.path" :class="['file-item', { 'is-dir': file.isDirectory, 'is-launchable': file.isLaunchable }]">
                    
                    <div class="file-info">
                        <span class="icon">
                            <i class="material-icons">
                                {{ file.isDirectory ? 'folder' : (file.isLaunchable ? 'web' : 'insert_drive_file') }}
                            </i>
                        </span>
                        
                        <a v-if="file.isLaunchable" :href="`/projects/${file.path}`" target="_blank" class="file-link launchable">
                            {{ file.name }}
                        </a>
                        <span v-else class="file-link" @click="handleItemClick(file)">
                            {{ file.name }}
                        </span>
                        
                        <span class="size">{{ file.isFile ? (file.size / 1024).toFixed(2) + ' KB' : '' }}</span>
                    </div>

                    <div class="actions">
                        <button v-if="file.isFile" @click="openEditor(file)" title="Επεξεργασία" class="action-btn edit-btn">
                            <i class="material-icons">edit</i>
                        </button>
                        <button @click="deleteItem(file)" title="Διαγραφή" class="action-btn delete-btn">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</template>

<style>
    /* -------------------- Global & Layout -------------------- */
    /* ΠΡΟΣΟΧΗ: Χρειάζεται να εισάγεις το Material Icons font στο index.html σου! */
    /* π.χ. <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"> */

    .material-icons {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;  
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
    }

    #file-manager-app {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
      /* Flat Design */
      border-radius: 0px; 
      box-shadow: none;
    }
    
    h1 {
        color: #343a40;
        border-bottom: 2px solid #e9ecef;
        padding-bottom: 10px;
        margin-top: 0;
        display: flex; 
        align-items: center;
        gap: 10px;
    }

    .controls-bar {
      display: flex;
      gap: 10px;
      align-items: center;
      margin-bottom: 20px;
      padding: 10px;
      background-color: #ffffff;
      /* Flat Design */
      border-radius: 0px; 
      box-shadow: none;
    }
    .path-display {
      flex-grow: 1;
      text-align: left;
      padding-left: 15px;
      color: #6c757d;
      font-size: 0.9em;
    }
    .path-display strong {
        color: #007bff;
        font-weight: 600;
    }
    
    /* -------------------- Buttons (Control & Action) -------------------- */
    .control-btn, .action-btn {
        padding: 8px 15px;
        border: none;
        /* Flat Design */
        border-radius: 0px; 
        cursor: pointer;
        transition: background-color 0.2s, opacity 0.2s;
        font-weight: 500;
        white-space: nowrap;
        display: inline-flex; 
        align-items: center;
        gap: 5px;
    }

    /* Primary Control Buttons */
    .control-btn {
        background-color: #007bff;
        color: white;
    }
    .control-btn:hover:not(:disabled) {
        background-color: #0056b3;
    }
    .control-btn:disabled {
        background-color: #ced4da;
        cursor: not-allowed;
        color: #6c757d;
    }
    .control-btn i.material-icons {
        font-size: 18px; 
    }

    /* Action Buttons (List actions) */
    .action-btn {
        padding: 5px 8px;
        background: none;
        color: #6c757d;
        font-size: 1.1em;
    }
    .action-btn i.material-icons {
        font-size: 20px;
    }
    .action-btn:hover {
        background-color: #e9ecef;
        color: #343a40;
    }
    .delete-btn {
        color: #dc3545;
    }
    .delete-btn:hover {
        background-color: #f8d7da;
    }

    .save-btn {
        background-color: #28a745;
        color: white;
    }
    .save-btn:hover {
        background-color: #1e7e34;
    }
    .close-btn {
        background-color: #6c757d;
        color: white;
    }
    .close-btn:hover {
        background-color: #5a6268;
    }
    
    /* -------------------- File List -------------------- */
    .file-list {
      list-style: none;
      padding: 0;
      border: 1px solid #dee2e6;
      /* Flat Design */
      border-radius: 0px;
      background-color: #ffffff;
    }
    .file-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
      border-bottom: 1px solid #f8f9fa;
    }
    .file-item:last-child { border-bottom: none; }
    .file-item:hover { background-color: #e9f5ff; } 
    
    .file-info {
        display: flex;
        align-items: center;
        flex-grow: 1;
    }
    .icon {
        font-size: 1.4em;
        margin-right: 15px;
        width: 25px; 
        text-align: center;
        color: #6c757d;
    }
    .is-dir .icon {
        color: #007bff; 
    }
    .is-launchable .icon {
        color: #17a2b8; 
    }

    .file-link {
        font-weight: 500;
        text-decoration: none;
        color: #212529;
        cursor: pointer;
        margin-right: 20px;
        flex-grow: 1;
    }
    .is-dir .file-link {
        color: #007bff; 
        font-weight: 600;
    }
    .launchable {
        color: #17a2b8; 
    }

    .size {
        font-size: 0.85em;
        color: #6c757d;
        min-width: 70px;
        text-align: right;
    }
    
    .actions {
        display: flex;
        gap: 5px;
    }

    /* -------------------- EDITOR FULL SCREEN STYLES -------------------- */
    .editor-full-screen {
        /* Εξασφαλίζει ότι ο editor καταλαμβάνει όλο το διαθέσιμο viewport */
        position: fixed; /* Χρησιμοποιούμε fixed για να καλύψει όλο το viewport */
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1000; /* Για να είναι πάνω από όλα */
        background-color: #f8f9fa; 
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
    }

    .editor-pane {
        border: 1px solid #007bff;
        padding: 20px;
        /* Flat Design */
        border-radius: 0px;
        background-color: #ffffff;
        box-shadow: none;
        flex-grow: 1; 
        display: flex;
        flex-direction: column;
        margin: 20px; /* Αφήνουμε λίγο περιθώριο */
    }

    .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid #e9ecef;
        margin-bottom: 10px;
    }

    .unsaved-indicator {
        color: #dc3545;
        font-size: 1.5em;
        font-weight: 700;
        margin-left: 5px;
    }

    .editor-textarea {
        width: 100%;
        flex-grow: 1; 
        min-height: 200px; 
        margin: 10px 0;
        font-family: 'Consolas', 'Courier New', monospace;
        padding: 15px;
        box-sizing: border-box;
        border: 1px solid #ced4da;
        /* Flat Design */
        border-radius: 0px;
        resize: none; 
        font-size: 0.9em;
    }

    .editor-controls {
        display: flex;
        gap: 10px;
        align-items: center;
        padding-top: 10px;
    }
    .editor-status {
        color: #1e88e5;
        font-style: italic;
        font-size: 0.9em;
        flex-grow: 1;
        text-align: right;
    }
    
    /* -------------------- Statuses -------------------- */
    .status-message {
        padding: 10px;
        /* Flat Design */
        border-radius: 0px; 
        margin-top: 10px;
        border: 1px solid #ffe0e0;
        color: #cc0000;
        font-weight: 500;
    }
    .status-message.error {
        background-color: #f8d7da;
        border-color: #f5c6cb;
        color: #721c24;
    }
    .status-message.error i.material-icons {
        font-size: 1.2em;
        margin-right: 5px;
        vertical-align: middle;
    }
</style>
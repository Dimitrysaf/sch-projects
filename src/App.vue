<script setup>
  import { ref, onMounted } from 'vue';
  
  // Καθορίζουμε τη διεύθυνση του Node.js API endpoint. 
  // Υποθέτουμε ότι το Node.js τρέχει στο port 3000.
  const API_URL = 'http://localhost:3000/api/folders'; 
  
  // Reactive variables για την αποθήκευση της κατάστασης (state)
  const projects = ref([]);
  const loading = ref(true);
  const error = ref(null);
  
  // Ασύγχρονη συνάρτηση για τη λήψη δεδομένων από το Node.js
  async function fetchProjects() {
      try {
          const response = await fetch(API_URL); 
          
          if (!response.ok) {
              // Ρίχνουμε σφάλμα αν η απάντηση δεν είναι 200 OK
              throw new Error(`HTTP Error! Status: ${response.status} - Could not connect to API.`);
          }
          
          // Τα δεδομένα έρχονται ήδη ταξινομημένα από το backend
          projects.value = await response.json();
  
      } catch (e) {
          error.value = e.message;
          console.error("Error fetching projects:", e);
      } finally {
          loading.value = false;
      }
  }
  
  // Καλείται η συνάρτηση μόλις το component έχει "μονταριστεί" (mounted) στο DOM
  onMounted(fetchProjects);
  </script>
  
  <template>
    <div id="app-container">
      <h1>📚 Project Selector (Vue 3 / Node.js API)</h1>
      
      <div v-if="loading" class="status-message loading">
        Φόρτωση έργων από τον Node.js Server...
      </div>
      
      <div v-else-if="error" class="status-message error">
        ⚠️ Σφάλμα φόρτωσης: {{ error }}. Βεβαιωθείτε ότι ο Node.js Server τρέχει στο port 3000.
      </div>
      
      <div v-else-if="projects.length === 0" class="status-message info">
        Δεν βρέθηκαν έργα στον φάκελο 'projects'.
      </div>
  
      <ul v-else class="project-list">
        <li v-for="project in projects" :key="project.path" class="project-item">
          <span class="date-display">{{ project.dateDisplay }}</span>
          <a :href="project.path" target="_blank" class="project-link">
            {{ project.name }} 
          </a>
        </li>
      </ul>
      
      <p class="note">Τα projects είναι ταξινομημένα από το πιο πρόσφατο στο παλιότερο, βάσει του ονόματος του φακέλου.</p>
  
    </div>
  </template>
  
  <style>
  #app-container {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-align: center;
    color: #2c3e50;
    margin-top: 60px;
  }
  
  .status-message {
      padding: 15px;
      border-radius: 5px;
      margin: 20px auto;
      width: fit-content;
      font-weight: bold;
  }
  .loading { background-color: #e0f7fa; color: #00838f; }
  .error { background-color: #ffebee; color: #c62828; }
  .info { background-color: #fff8e1; color: #ff8f00; }
  
  .project-list {
    list-style: none;
    padding: 0;
    max-width: 600px;
    margin: 20px auto;
  }
  
  .project-item {
    display: flex;
    align-items: center;
    background-color: #f8f8f8;
    border-left: 5px solid #42b983; /* Vue green */
    margin-bottom: 10px;
    padding: 10px 15px;
    border-radius: 4px;
    text-align: left;
  }
  
  .date-display {
      font-weight: bold;
      color: #42b983;
      margin-right: 15px;
      min-width: 80px;
  }
  
  .project-link {
      text-decoration: none;
      color: #2c3e50;
      font-size: 1.1em;
      flex-grow: 1; /* Παίρνει τον υπόλοιπο χώρο */
  }
  
  .project-link:hover {
      text-decoration: underline;
      color: #35495e;
  }
  .note {
      font-size: 0.8em;
      color: #6c757d;
  }
  </style>
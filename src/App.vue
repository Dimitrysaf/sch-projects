<script setup>
import { ref, onMounted } from 'vue';

// API endpoint to fetch the list of HTML files from the /projects directory
const API_URL = 'http://localhost:3000/api/projects';

// Reactive variables
const projects = ref([]);
const loading = ref(true);
const error = ref(null);

// Async function to fetch data from the Node.js server
async function fetchProjects() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status} - Could not connect to API.`);
    }

    // The backend returns an array of filenames, e.g., ["project1.html", "project2.html"]
    projects.value = await response.json();

  } catch (e) {
    error.value = e.message;
    console.error("Error fetching projects:", e);
  } finally {
    loading.value = false;
  }
}

// Fetch the projects when the component is mounted
onMounted(fetchProjects);
</script>

<template>
  <div id="app-container">
    <h1>📚 Project Showcase</h1>

    <div v-if="loading" class="status-message loading">
      Loading projects from the Node.js Server...
    </div>

    <div v-else-if="error" class="status-message error">
      ⚠️ Error loading projects: {{ error }}. Make sure the Node.js Server is running on port 3000.
    </div>

    <div v-else-if="projects.length === 0" class="status-message info">
      No projects found in the 'projects' folder.
    </div>

    <ul v-else class="project-list">
      <!-- Loop through the array of project filenames -->
      <li v-for="projectFile in projects" :key="projectFile" class="project-item">
        <!-- Create a link to the HTML file -->
        <a :href="'/projects/' + projectFile" target="_blank" class="project-link">
          {{ projectFile }}
        </a>
      </li>
    </ul>

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
  background-color: #f8f8f8;
  border-left: 5px solid #42b983; /* Vue green */
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 4px;
  text-align: left;
}

.project-link {
    text-decoration: none;
    color: #2c3e50;
    font-size: 1.2em;
    font-weight: 500;
}

.project-link:hover {
    text-decoration: underline;
    color: #35495e;
}
</style>
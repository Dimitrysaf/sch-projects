import { createApp } from 'vue';
import App from './App.vue';

// Δημιουργία της εφαρμογής Vue
const app = createApp(App);

// "Μοντάρισμα" της εφαρμογής στο HTML στοιχείο με id="app"
app.mount('#app');
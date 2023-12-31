import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue';
import 'semantic-ui-css/semantic.min.css'
import App from './App.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: () => import('./components/HomePage.vue')
        },
        {
            path: '/viewer',
            component: () => import('./components/PdfViewer.vue')
        },
        {
            path: '/play',
            component: () => import('./components/AudioPlay.vue')
        },
        {
            path: '/:catchAll(.*)', // Catch-all route
            redirect: '/' // Redirect to '/'
        }
    ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')

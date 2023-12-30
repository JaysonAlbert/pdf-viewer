import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue';
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
            path: '/:catchAll(.*)', // Catch-all route
            redirect: '/' // Redirect to '/'
        }
    ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')

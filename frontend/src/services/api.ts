import axios from 'axios';

// Vite uses VITE_ prefix for env variables
export const API_URL = import.meta.env.VITE_API_URL || ''; 

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor: Handle trailing slash and Auth Token
api.interceptors.request.use((config) => {
    // 1. Fix the Trailing Slash (Prevents 405 Method Not Allowed)
    // We append a '/' if the URL doesn't have one and doesn't contain query params
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url += '/';
    }

    // 2. Add Token to every request automatically
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor: Handle 401 (Unauthorized) errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Only redirect if we aren't already on the login page (prevents infinite loops)
        if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_data');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
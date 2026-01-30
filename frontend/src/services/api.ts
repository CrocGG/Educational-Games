import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || ''; 

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    if (config.url && !config.url.endsWith('/') && !config.url.includes('?')) {
        config.url += '/';
    }

    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
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
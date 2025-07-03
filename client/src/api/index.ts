import axios from 'axios';
import SessionManager from '../auth/session';
import config from '../config';

console.log('🔧 API Client initializing...');
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🌐 Config:', config);
console.log('📍 Base URL:', config.API_BASE_URL);

const apiClient = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to add the session token
apiClient.interceptors.request.use((config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    console.log('📍 Full URL:', (config.baseURL || '') + (config.url || ''));
    
    const sessionManager = SessionManager.getInstance();
    const token = sessionManager.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
});

// Handle SSL certificate issues in development
apiClient.interceptors.response.use(
    (response) => {
        console.log('✅ API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
        console.log('📊 Response data:', response.data);
        return response;
    },
    (error) => {
        console.error('❌ API Error:', error.config?.method?.toUpperCase(), error.config?.url);
        console.error('📍 Full URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            console.warn('SSL certificate issue in development mode:', error.message);
        }
        return Promise.reject(error);
    }
);

// Thirrjet Api për vërtetimin e përdoruesit
export const registerUser = async (userData: {username: string, password: string}) => {
    console.log('📤 Registering user:', userData.username);
    const response = await apiClient.post('/register', userData);
    console.log('✅ Registration response:', response.data);
    return response.data;
};

export const loginUser = async (credentials: {username: string, password: string}) => {
    console.log('📤 Logging in user:', credentials.username);
    const response = await apiClient.post('/login', credentials);
    console.log('✅ Login response:', response.data);
    return response.data;
};

// Thirrjet Api për mesazhet
export const sendMessage = async (messageData: {message: string, recipientId?: string}) => {
    const response = await apiClient.post('/message', messageData);
    return response.data;
};

export const fetchMessages = async () => {
    const response = await apiClient.get('/messages');
    return response.data;
};

export const fetchConversation = async (recipientId: string) => {
    const response = await apiClient.get(`/messages/${recipientId}`);
    return response.data;
};

export const fetchUsers = async () => {
    const response = await apiClient.get('/users');
    return response.data;
};

// Security and debugging APIs
export const fetchSecurityInfo = async () => {
    const response = await apiClient.get('/security/info');
    return response.data;
};

export const fetchSystemStatus = async () => {
    const response = await apiClient.get('/system/status');
    return response.data;
};

// Delete message APIs
export const deleteMessage = async (messageId: string) => {
    const response = await apiClient.delete(`/message/${messageId}`);
    return response.data;
};

export const deleteConversation = async (recipientId: string) => {
    const response = await apiClient.delete(`/conversation/${recipientId}`);
    return response.data;
};

export const deleteAllMessages = async () => {
    const response = await apiClient.delete('/messages/all');
    return response.data;
};

// Delete for everyone APIs
export const deleteMessageForEveryone = async (messageId: string) => {
    const response = await apiClient.delete(`/message/${messageId}/everyone`);
    return response.data;
};

export const deleteConversationForEveryone = async (recipientId: string) => {
    const response = await apiClient.delete(`/conversation/${recipientId}/everyone`);
    return response.data;
};

// Registration status API
export const fetchRegistrationStatus = async () => {
    console.log('📤 Fetching registration status...');
    const response = await apiClient.get('/registration-status');
    console.log('✅ Registration status response:', response.data);
    return response.data;
};


import axios from 'axios';
import SessionManager from '../auth/session';
import config from '../config';

const apiClient = axios.create({
    baseURL: config.API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to add the session token
apiClient.interceptors.request.use((config) => {
    const sessionManager = SessionManager.getInstance();
    const token = sessionManager.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Handle SSL certificate issues in development
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
            console.warn('SSL certificate issue in development mode:', error.message);
        }
        return Promise.reject(error);
    }
);

// Thirrjet Api për vërtetimin e përdoruesit
export const registerUser = async (userData: {username: string, password: string}) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
};

export const loginUser = async (credentials: {username: string, password: string}) => {
    const response = await apiClient.post('/login', credentials);
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


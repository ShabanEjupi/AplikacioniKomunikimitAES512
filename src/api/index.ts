import config from '../config';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    username: string;
    userId: string;
  };
  token?: string;
  message?: string;
}

export interface RegistrationStatus {
  registrationEnabled: boolean;
  hasDefaultUsers: boolean;
  availableUsers?: string[];
}

export interface SystemStatus {
  status: string;
  uptime: string;
  version: string;
  environment: string;
  security: {
    encryption: string;
    hashing: string;
    tls: string;
    status: string;
  };
  performance: {
    responseTime: string;
    availability: string;
  };
  timestamp: string;
}

export interface User {
  username: string;
  userId: string;
  online?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  encrypted?: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount?: number;
}

const API_BASE = config.API_BASE_URL;

// Authentication functions
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('🔐 Attempting login with API base:', API_BASE);
    console.log('🔐 Full URL:', `${API_BASE}/login`);
    
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('🔐 Response status:', response.status);
    console.log('🔐 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔐 Login failed response:', errorText);
      throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔐 Login response data:', data);
    
    // Store auth info
    if (data.success && data.user) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
    }
    
    return data;
  } catch (error: any) {
    console.error('🔐 Login error:', error);
    throw error;
  }
};

export const registerUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('📝 Attempting registration...');
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const fetchRegistrationStatus = async (): Promise<RegistrationStatus> => {
  try {
    console.log('🔍 Fetching registration status...');
    const response = await fetch(`${API_BASE}/registration-status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch registration status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('Registration status error:', error);
    throw error;
  }
};

export const fetchSystemStatus = async (): Promise<SystemStatus> => {
  try {
    console.log('⚙️ Fetching system status...');
    const response = await fetch(`${API_BASE}/system-status`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch system status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error('System status error:', error);
    throw error;
  }
};

// User management functions
export const fetchUsers = async (): Promise<User[]> => {
  try {
    console.log('👥 Fetching users from:', `${API_BASE}/users`);
    const response = await fetch(`${API_BASE}/users`);

    console.log('👥 Users response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('👥 Users failed response:', errorText);
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('👥 Users response data:', data);
    
    // Handle both formats: direct array or { users: array }
    const users = Array.isArray(data) ? data : data.users || [];
    console.log('👥 Processed users:', users);
    
    return users;
  } catch (error: any) {
    console.error('👥 Fetch users error:', error);
    throw error;
  }
};

// Messaging functions
export const fetchMessages = async (conversationId?: string): Promise<Message[]> => {
  try {
    console.log('💬 Fetching messages...');
    const url = conversationId 
      ? `${API_BASE}/messages?conversationId=${conversationId}`
      : `${API_BASE}/messages`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Fetch messages error:', error);
    throw error;
  }
};

export const sendMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
  try {
    console.log('📤 Sending message...');
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Send message error:', error);
    throw error;
  }
};

export const fetchConversations = async (): Promise<Conversation[]> => {
  try {
    console.log('💬 Fetching conversations...');
    const response = await fetch(`${API_BASE}/conversation`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Fetch conversations error:', error);
    throw error;
  }
};

// Utility functions
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('currentUser');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

export const logout = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
};

// Aliases for better compatibility
export const getRegistrationStatus = fetchRegistrationStatus;
export const getSystemStatus = fetchSystemStatus;

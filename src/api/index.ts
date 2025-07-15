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
  type?: 'text' | 'file' | 'image' | 'video' | 'audio';
  fileData?: {
    fileId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    downloadUrl: string;
    thumbnail?: string;
  };
  editedAt?: string | null;
  reactions?: Array<{
    userId: string;
    emoji: string;
    timestamp: string;
  }>;
  replyTo?: {
    messageId: string;
    content: string;
    senderId: string;
  } | null;
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

// Messaging functions with smart polling
let lastMessageTimestamp = '';
let lastSessionId = '';

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

    const data = await response.json();
    
    // Handle new response format
    const messages = Array.isArray(data) ? data : data.messages || [];
    
    // Update session tracking
    if (data.sessionId) {
      if (lastSessionId && lastSessionId !== data.sessionId) {
        console.log('🔄 New session detected, clearing cache');
        lastMessageTimestamp = '';
      }
      lastSessionId = data.sessionId;
    }
    
    return messages;
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

// File upload functions
export const uploadFile = async (file: File, senderId: string): Promise<any> => {
  try {
    console.log('📎 Uploading file...');
    
    // Convert file to base64
    const fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch(`${API_BASE}/file-storage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData,
        senderId,
        encryptionKey: 'user-specific-key'
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Upload file error:', error);
    throw error;
  }
};

export const sendFileMessage = async (fileData: any, senderId: string, recipientId: string): Promise<Message> => {
  try {
    console.log('📎 Sending file message...');
    const response = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        senderId,
        recipientId,
        content: `📎 ${fileData.fileName}`,
        encrypted: true,
        fileData
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send file message: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Send file message error:', error);
    throw error;
  }
};

// Message action functions
export const editMessage = async (messageId: string, content: string, userId: string): Promise<Message> => {
  try {
    console.log('✏️ Editing message:', { messageId, content, userId });
    const response = await fetch(`${API_BASE}/message-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        messageId,
        action: 'edit',
        userId,
        content
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('✏️ Edit error response:', errorText);
      throw new Error(`Failed to edit message: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('✏️ Edit success:', result);
    return result;
  } catch (error: any) {
    console.error('Edit message error:', error);
    throw error;
  }
};

export const deleteMessage = async (messageId: string, userId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting message:', { messageId, userId });
    const response = await fetch(`${API_BASE}/message-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        messageId,
        action: 'delete',
        userId
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🗑️ Delete error response:', errorText);
      throw new Error(`Failed to delete message: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('🗑️ Delete success:', result);
  } catch (error: any) {
    console.error('Delete message error:', error);
    throw error;
  }
};

export const reactToMessage = async (messageId: string, emoji: string, userId: string): Promise<Message> => {
  try {
    console.log('🔄 Reacting to message:', { messageId, emoji, userId });
    console.log('🔄 API URL:', `${API_BASE}/message-actions`);
    
    const response = await fetch(`${API_BASE}/message-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        messageId,
        action: 'react',
        userId,
        emoji
      }),
    });

    console.log('🔄 Response status:', response.status);
    console.log('🔄 Response headers:', response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔄 Error response:', errorText);
      throw new Error(`Failed to react to message: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('🔄 Success response:', result);
    return result;
  } catch (error: any) {
    console.error('React to message error:', error);
    throw error;
  }
};

export const replyToMessage = async (messageId: string, replyContent: string, userId: string): Promise<Message> => {
  try {
    const response = await fetch(`${API_BASE}/message-actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        messageId,
        action: 'reply',
        userId,
        replyContent
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to reply to message: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Reply to message error:', error);
    throw error;
  }
};

// Smart polling with change detection
export const hasNewMessages = async (lastKnownTimestamp?: string): Promise<boolean> => {
  try {
    const messages = await fetchMessages();
    if (messages.length === 0) return false;
    
    const latestTimestamp = messages[messages.length - 1].timestamp;
    return !lastKnownTimestamp || latestTimestamp > lastKnownTimestamp;
  } catch (error) {
    console.error('Check new messages error:', error);
    return false;
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
  // Clear localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  
  // Clear SessionManager
  try {
    const SessionManager = require('../auth/session').default;
    SessionManager.clearSession();
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// Notification functions
export const sendNotification = async (recipientId: string, type: string, data: any): Promise<void> => {
  try {
    await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        recipientId,
        type,
        ...data
      }),
    });
  } catch (error) {
    console.error('Send notification error:', error);
  }
};

export const getNotifications = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE}/notifications?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get notifications: ${response.status}`);
    }

    const data = await response.json();
    return data.notifications || [];
  } catch (error: any) {
    console.error('Get notifications error:', error);
    return [];
  }
};

// Aliases for better compatibility
export const getRegistrationStatus = fetchRegistrationStatus;
export const getSystemStatus = fetchSystemStatus;

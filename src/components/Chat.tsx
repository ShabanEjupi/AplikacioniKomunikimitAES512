import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUsers, 
  fetchMessages, 
  sendMessage, 
  getCurrentUser, 
  logout,
  User,
  Message 
} from '../api/index';
import CallControls from './CallControls_Enhanced';
import '../styles/global.css';

const Chat: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiHealth, setApiHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleCallStart = (type: 'voice' | 'video') => {
    console.log(`Starting ${type} call with ${selectedUser?.username}`);
    // You can add additional call logic here
  };

  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setApiHealth('healthy');
      } else {
        setApiHealth('unhealthy');
      }
    } catch (error) {
      console.error('API health check failed:', error);
      setApiHealth('unhealthy');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await fetchUsers();
      // Filter out current user from the list
      const otherUsers = fetchedUsers.filter(user => 
        user.username !== currentUser?.username && 
        user.userId !== currentUser?.userId
      );
      setUsers(otherUsers);
      setError('');
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError('Failed to load users: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.username, currentUser?.userId]);

  const loadMessages = useCallback(async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      setIsLoading(true);
      const fetchedMessages = await fetchMessages();
      // Filter messages for the selected conversation
      const conversationMessages = fetchedMessages.filter(msg => 
        (msg.senderId === currentUser.userId && msg.recipientId === selectedUser.userId) ||
        (msg.senderId === selectedUser.userId && msg.recipientId === currentUser.userId)
      );
      setMessages(conversationMessages);
      setError('');
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      setError('Failed to load messages: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser, currentUser]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);
    checkApiHealth();
    loadUsers();
  }, [navigate, loadUsers, checkApiHealth]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
    }
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add auto-refresh for messages every 3 seconds
  useEffect(() => {
    if (selectedUser && currentUser) {
      // Start polling
      pollIntervalRef.current = setInterval(() => {
        loadMessages();
      }, 3000);

      return () => {
        // Cleanup polling when user changes or component unmounts
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [selectedUser, currentUser, loadMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !selectedUser || !currentUser) return;

    try {
      setIsLoading(true);
      const messageData = {
        senderId: currentUser.userId,
        recipientId: selectedUser.userId,
        content: newMessage.trim(),
        encrypted: true
      };

      const sentMessage = await sendMessage(messageData);
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
      setError('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageClass = (message: Message) => {
    return message.senderId === currentUser?.userId ? 'message-sent' : 'message-received';
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h1>🔐 Crypto 512 Chat</h1>
          {currentUser && (
            <span className="current-user">Logged in as: {currentUser.username}</span>
          )}
          {apiHealth === 'unhealthy' && (
            <span className="api-status-warning">⚠️ API Connection Issues</span>
          )}
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>

      <div className="chat-layout">
        {/* Users Sidebar */}
        <div className="users-sidebar">
          <div className="users-header">
            <h3>🧑‍🤝‍🧑 Contacts ({users.length})</h3>
            <button onClick={loadUsers} disabled={isLoading} className="refresh-btn">
              🔄
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
              <button onClick={loadUsers} className="retry-btn">
                Retry
              </button>
            </div>
          )}

          <div className="users-list">
            {isLoading && users.length === 0 ? (
              <div className="loading">Loading contacts...</div>
            ) : users.length === 0 ? (
              <div className="no-users">
                <p>No contacts available</p>
                <p>Make sure other users are registered</p>
                <button onClick={loadUsers} className="retry-btn">
                  Refresh
                </button>
              </div>
            ) : (
              users.map(user => (
                <div
                  key={user.userId}
                  className={`user-item ${selectedUser?.userId === user.userId ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="user-avatar">👤</div>
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="user-status">
                      {user.online ? '🟢 Online' : '⚪ Offline'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="chat-area-header">
                <div className="selected-user-info">
                  <div className="user-avatar">👤</div>
                  <div>
                    <h4>{selectedUser.username}</h4>
                    <span className="encryption-status">🔒 AES-512 Encrypted</span>
                  </div>
                </div>
                <div className="chat-header-controls">
                  <CallControls
                    selectedUser={selectedUser}
                    currentUser={currentUser}
                    onCallStart={handleCallStart}
                  />
                  <button onClick={loadMessages} disabled={isLoading} className="refresh-btn">
                    🔄
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="messages-container">
                {messages.length === 0 ? (
                  <div className="no-messages">
                    <p>💬 No messages yet</p>
                    <p>Start a secure conversation with {selectedUser.username}</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <div key={message.id} className={`message ${getMessageClass(message)}`}>
                      <div className="message-content">
                        {message.content}
                        {message.encrypted && <span className="encryption-indicator">🔒</span>}
                      </div>
                      <div className="message-time">
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="message-input-container">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Send an encrypted message to ${selectedUser.username}...`}
                    disabled={isLoading}
                    className="message-input"
                  />
                  <button 
                    type="submit" 
                    disabled={!newMessage.trim() || isLoading}
                    className="send-btn"
                  >
                    {isLoading ? '⏳' : '📤'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="no-chat-selected">
              <h3>💬 Select a contact to start chatting</h3>
              <p>Choose someone from your contacts list to begin a secure conversation</p>
              <div className="features-list">
                <p>🔒 End-to-end AES-512 encryption</p>
                <p>🛡️ ASH-512 hash integrity verification</p>
                <p>🔐 Military-grade security</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;

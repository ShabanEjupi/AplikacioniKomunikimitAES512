import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchUsers, 
  fetchMessages, 
  sendMessage, 
  getCurrentUser, 
  logout,
  uploadFile,
  sendFileMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
  replyToMessage,
  hasNewMessages,
  User,
  Message 
} from '../api/index';
import CallControls from './CallControls';
import FileAttachment from './FileAttachment';
import '../styles/global.css';

const ChatNew: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [apiHealth, setApiHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showFileAttachment, setShowFileAttachment] = useState(false);
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const handleCallStart = (type: 'voice' | 'video') => {
    console.log(`Starting ${type} call with ${selectedUser?.username}`);
  };

  const checkApiHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      setApiHealth(response.ok ? 'healthy' : 'unhealthy');
    } catch (error) {
      console.error('API health check failed:', error);
      setApiHealth('unhealthy');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current.get(messageId);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('message-highlight');
      setTimeout(() => messageElement.classList.remove('message-highlight'), 2000);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const fetchedUsers = await fetchUsers();
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

  const loadMessages = useCallback(async (forceRefresh = false) => {
    if (!selectedUser || !currentUser) return;
    
    try {
      // Only show loading on manual refresh
      if (forceRefresh) setIsLoading(true);
      
      const fetchedMessages = await fetchMessages();
      const conversationMessages = fetchedMessages.filter(msg => 
        (msg.senderId === currentUser.userId && msg.recipientId === selectedUser.userId) ||
        (msg.senderId === selectedUser.userId && msg.recipientId === currentUser.userId)
      );
      
      // Update last message timestamp for smart polling
      if (conversationMessages.length > 0) {
        const latest = conversationMessages[conversationMessages.length - 1];
        setLastMessageTimestamp(latest.timestamp);
      }
      
      setMessages(conversationMessages);
      setError('');
    } catch (err: any) {
      console.error('Failed to load messages:', err);
      if (forceRefresh) setError('Failed to load messages: ' + err.message);
    } finally {
      if (forceRefresh) setIsLoading(false);
    }
  }, [selectedUser, currentUser]);

  // Smart polling that only fetches if there are new messages
  const smartPoll = useCallback(async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      const hasNew = await hasNewMessages(lastMessageTimestamp);
      if (hasNew) {
        await loadMessages(false); // Silent refresh
      }
    } catch (error) {
      console.error('Smart poll error:', error);
    }
  }, [selectedUser, currentUser, lastMessageTimestamp, loadMessages]);

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
      loadMessages(true);
    }
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reduced polling frequency with smart detection
  useEffect(() => {
    if (selectedUser && currentUser) {
      pollIntervalRef.current = setInterval(smartPoll, 5000); // Reduced to 5 seconds

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [selectedUser, currentUser, smartPoll]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFiles) || !selectedUser || !currentUser) return;

    try {
      setIsUploading(true);

      if (selectedFiles && selectedFiles.length > 0) {
        // Handle file upload
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileData = await uploadFile(file, currentUser.userId);
          const sentMessage = await sendFileMessage(fileData, currentUser.userId, selectedUser.userId);
          setMessages(prev => [...prev, sentMessage]);
        }
        setSelectedFiles(null);
        setShowFileAttachment(false);
      } else {
        // Handle text message
        const messageData = {
          senderId: currentUser.userId,
          recipientId: selectedUser.userId,
          content: newMessage.trim(),
          encrypted: true
        };

        const sentMessage = await sendMessage(messageData);
        setMessages(prev => [...prev, sentMessage]);
      }

      setNewMessage('');
      setReplyingTo(null);
      setError('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message: ' + err.message);
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    if (!currentUser) return;
    
    try {
      const updatedMessage = await editMessage(messageId, content, currentUser.userId);
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
      setEditingMessage(null);
    } catch (err: any) {
      console.error('Failed to edit message:', err);
      setError('Failed to edit message: ' + err.message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;
    
    try {
      await deleteMessage(messageId, currentUser.userId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      setError('Failed to delete message: ' + err.message);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    
    try {
      const updatedMessage = await reactToMessage(messageId, emoji, currentUser.userId);
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
    } catch (err: any) {
      console.error('Failed to react to message:', err);
      setError('Failed to react to message: ' + err.message);
    }
  };

  const handleReply = async (originalMessage: Message, replyContent: string) => {
    if (!currentUser) return;
    
    try {
      const replyMessage = await replyToMessage(originalMessage.id, replyContent, currentUser.userId);
      setMessages(prev => [...prev, replyMessage]);
      setReplyingTo(null);
    } catch (err: any) {
      console.error('Failed to reply to message:', err);
      setError('Failed to reply to message: ' + err.message);
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

  const renderMessage = (message: Message) => {
    const isOwn = message.senderId === currentUser?.userId;
    const isEditing = editingMessage?.id === message.id;
    
    return (
      <div 
        key={message.id} 
        className={`message ${getMessageClass(message)}`}
        ref={(el) => el && messageRefs.current.set(message.id, el)}
      >
        {message.replyTo && (
          <div className="message-reply-context" onClick={() => scrollToMessage(message.replyTo!.messageId)}>
            <span className="reply-indicator">↳ Replying to:</span>
            <span className="reply-content">{message.replyTo.content}</span>
          </div>
        )}
        
        <div className="message-content">
          {message.type === 'file' && message.fileData ? (
            <div className="file-message">
              <div className="file-info">
                <span className="file-icon">📎</span>
                <div>
                  <div className="file-name">{message.fileData.fileName}</div>
                  <div className="file-size">{(message.fileData.fileSize / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              {message.fileData.thumbnail && (
                <img src={`data:image/jpeg;base64,${message.fileData.thumbnail}`} alt="Preview" className="file-thumbnail" />
              )}
              <a href={message.fileData.downloadUrl} download className="download-btn">Download</a>
            </div>
          ) : isEditing ? (
            <div className="edit-form">
              <input
                type="text"
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleEditMessage(message.id, editingMessage.content);
                  }
                }}
                autoFocus
              />
              <button onClick={() => handleEditMessage(message.id, editingMessage.content)}>Save</button>
              <button onClick={() => setEditingMessage(null)}>Cancel</button>
            </div>
          ) : (
            <>
              {message.content}
              {message.encrypted && <span className="encryption-indicator">🔒</span>}
              {message.editedAt && <span className="edited-indicator">(edited)</span>}
            </>
          )}
        </div>

        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, index) => (
              <span key={index} className="reaction" title={`${reaction.userId} reacted with ${reaction.emoji}`}>
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}

        <div className="message-footer">
          <div className="message-time">
            {formatTime(message.timestamp)}
          </div>
          
          <div className="message-actions">
            <button onClick={() => handleReaction(message.id, '👍')} title="React">👍</button>
            <button onClick={() => handleReaction(message.id, '❤️')} title="React">❤️</button>
            <button onClick={() => setReplyingTo(message)} title="Reply">↩️</button>
            
            {isOwn && (
              <>
                <button 
                  onClick={() => setEditingMessage({ id: message.id, content: message.content })} 
                  title="Edit"
                >
                  ✏️
                </button>
                <button 
                  onClick={() => handleDeleteMessage(message.id)} 
                  title="Delete"
                  className="delete-btn"
                >
                  🗑️
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h1>🔐 Crypto 512 Chat Enhanced</h1>
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
            <button onClick={() => loadUsers()} disabled={isLoading} className="refresh-btn">
              🔄
            </button>
          </div>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
              <button onClick={() => loadUsers()} className="retry-btn">
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
                <button onClick={() => loadUsers()} className="retry-btn">
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
                  <button 
                    onClick={() => setShowFileAttachment(!showFileAttachment)} 
                    className={`file-toggle-btn ${showFileAttachment ? 'active' : ''}`}
                  >
                    📎
                  </button>
                  <button onClick={() => loadMessages(true)} disabled={isLoading} className="refresh-btn">
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
                  messages.map(renderMessage)
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Context */}
              {replyingTo && (
                <div className="reply-context">
                  <span>Replying to: {replyingTo.content}</span>
                  <button onClick={() => setReplyingTo(null)}>❌</button>
                </div>
              )}

              {/* File Attachment */}
              {showFileAttachment && (
                <FileAttachment
                  onFileSelect={setSelectedFiles}
                  onSend={() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent)}
                  selectedFiles={selectedFiles}
                  isUploading={isUploading}
                />
              )}

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
                    disabled={(!newMessage.trim() && !selectedFiles) || isLoading}
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
                <p>📎 Secure file sharing</p>
                <p>🎥 Photo/Video messaging</p>
                <p>💬 Message reactions & replies</p>
                <p>✏️ Edit & delete messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatNew;

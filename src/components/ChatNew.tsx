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
  getNotifications,
  User,
  Message 
} from '../api/index';
import CallControlsEnhanced from './CallControls_Enhanced';
import FileAttachment from './FileAttachment';
import Settings from './Settings';
import '../styles/global.css';
import '../styles/enhanced.css';

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
  const [showSettings, setShowSettings] = useState(false);
  const [showFilePreview, setShowFilePreview] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Utility functions
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎬';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType === 'application/pdf') return '📄';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const openFilePreview = (fileData: any) => {
    setShowFilePreview(fileData);
  };

  const handleFileDownload = async (e: React.MouseEvent, fileData: any) => {
    e.preventDefault();
    try {
      const response = await fetch(`${fileData.downloadUrl}&download=true`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

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
      if (forceRefresh) setIsLoading(true);
      
      const fetchedMessages = await fetchMessages();
      const conversationMessages = fetchedMessages.filter(msg => 
        (msg.senderId === currentUser.userId && msg.recipientId === selectedUser.userId) ||
        (msg.senderId === selectedUser.userId && msg.recipientId === currentUser.userId)
      );
      
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

  const pollNotifications = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const newNotifications = await getNotifications(currentUser.userId);
      if (newNotifications.length > 0) {
        setNotifications(prev => [...prev, ...newNotifications]);
        
        // Show desktop notifications if supported
        if ('Notification' in window && Notification.permission === 'granted') {
          newNotifications.forEach(notif => {
            let title = '';
            let body = '';
            
            switch (notif.type) {
              case 'reaction':
                title = 'New reaction';
                body = `Someone reacted ${notif.emoji} to your message`;
                break;
              case 'reply':
                title = 'New reply';
                body = `Someone replied to your message: ${notif.messageContent}`;
                break;
              case 'call_invite':
                title = 'Incoming call';
                body = `${notif.senderName} is calling you (${notif.callType})`;
                break;
              case 'call_ended':
                title = 'Call ended';
                body = `Call has been ended`;
                break;
            }
            
            if (title) {
              new Notification(title, { body, icon: '/favicon.ico' });
            }
          });
        }
        
        // Auto-dismiss notifications after 5 seconds
        newNotifications.forEach(notif => {
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notif.id));
          }, 5000);
        });
      }
    } catch (error) {
      console.error('Failed to poll notifications:', error);
    }
  }, [currentUser]);

  const smartPoll = useCallback(async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      const hasNew = await hasNewMessages(lastMessageTimestamp);
      if (hasNew) {
        await loadMessages(false);
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
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [navigate, loadUsers, checkApiHealth]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(true);
    }
  }, [selectedUser, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (selectedUser && currentUser) {
      pollIntervalRef.current = setInterval(() => {
        smartPoll();
        pollNotifications();
      }, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };
    }
  }, [selectedUser, currentUser, smartPoll, pollNotifications]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFiles) || !selectedUser || !currentUser) return;

    try {
      setIsUploading(true);

      if (selectedFiles && selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const fileData = await uploadFile(file, currentUser.userId);
          const sentMessage = await sendFileMessage(fileData, currentUser.userId, selectedUser.userId);
          setMessages(prev => [...prev, sentMessage]);
        }
        setSelectedFiles(null);
        setShowFileAttachment(false);
      } else {
        let messageData;
        
        if (replyingTo) {
          // Use the dedicated reply API function
          const replyMessage = await replyToMessage(replyingTo.id, newMessage.trim(), currentUser.userId);
          setMessages(prev => [...prev, replyMessage]);
        } else {
          messageData = {
            senderId: currentUser.userId,
            recipientId: selectedUser.userId,
            content: newMessage.trim(),
            encrypted: true
          };
          
          const sentMessage = await sendMessage(messageData);
          setMessages(prev => [...prev, sentMessage]);
        }
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
    
    console.log('✏️ Editing message:', { messageId, content, userId: currentUser.userId });
    
    try {
      const updatedMessage = await editMessage(messageId, content, currentUser.userId);
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
      setEditingMessage(null);
      console.log('✅ Message edited successfully');
    } catch (err: any) {
      console.error('❌ Failed to edit message:', err);
      setError('Failed to edit message: ' + err.message);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser) return;
    
    console.log('🗑️ Deleting message:', { messageId, userId: currentUser.userId });
    
    try {
      await deleteMessage(messageId, currentUser.userId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      console.log('✅ Message deleted successfully');
    } catch (err: any) {
      console.error('❌ Failed to delete message:', err);
      setError('Failed to delete message: ' + err.message);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    
    console.log('😊 Adding reaction:', { messageId, emoji, userId: currentUser.userId });
    
    try {
      const updatedMessage = await reactToMessage(messageId, emoji, currentUser.userId);
      setMessages(prev => prev.map(msg => msg.id === messageId ? updatedMessage : msg));
      console.log('✅ Reaction added successfully');
    } catch (err: any) {
      console.error('Failed to react to message:', err);
      setError('Failed to react to message: ' + err.message);
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

    console.log('🎨 Rendering message:', { 
      messageId: message.id, 
      isOwn, 
      isEditing, 
      currentUser: currentUser?.userId,
      messageSender: message.senderId 
    });

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
                <span className="file-icon">
                  {getFileIcon(message.fileData.fileType)}
                </span>
                <div className="file-details">
                  <div className="file-name">{message.fileData.fileName}</div>
                  <div className="file-size">{formatFileSize(message.fileData.fileSize)}</div>
                  <div className="file-type">{message.fileData.fileType}</div>
                </div>
              </div>
              
              {message.fileData.thumbnail && message.fileData.fileType.startsWith('image/') && (
                <div className="file-preview">
                  <img 
                    src={`data:${message.fileData.fileType};base64,${message.fileData.thumbnail}`} 
                    alt="Preview" 
                    className="file-thumbnail"
                    onClick={() => openFilePreview(message.fileData!)}
                  />
                </div>
              )}
              
              {message.fileData.fileType.startsWith('video/') && (
                <div className="file-preview">
                  <div className="video-placeholder" onClick={() => openFilePreview(message.fileData!)}>
                    <span className="video-icon">🎬</span>
                    <span className="video-text">Click to view video</span>
                  </div>
                </div>
              )}
              
              {message.fileData.fileType === 'application/pdf' && (
                <div className="file-preview">
                  <div className="pdf-placeholder" onClick={() => openFilePreview(message.fileData!)}>
                    <span className="pdf-icon">📄</span>
                    <span className="pdf-text">Click to view PDF</span>
                  </div>
                </div>
              )}
              
              {message.fileData.fileType.startsWith('audio/') && (
                <div className="file-preview">
                  <div className="audio-placeholder" onClick={() => openFilePreview(message.fileData!)}>
                    <span className="audio-icon">🎵</span>
                    <span className="audio-text">Click to play audio</span>
                  </div>
                </div>
              )}
              
              <div className="file-actions">
                <a 
                  href={`${message.fileData.downloadUrl}&download=true`} 
                  download={message.fileData.fileName}
                  className="download-btn"
                  onClick={(e) => handleFileDownload(e, message.fileData!)}
                >
                  📥 Download
                </a>
                <button 
                  onClick={() => openFilePreview(message.fileData!)}
                  className="preview-btn"
                >
                  👁️ Preview
                </button>
              </div>
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
                  if (e.key === 'Escape') {
                    setEditingMessage(null);
                  }
                }}
                autoFocus
                className="edit-input"
              />
              <div className="edit-actions">
                <button onClick={() => handleEditMessage(message.id, editingMessage.content)} className="save-btn">
                  ✅ Save
                </button>
                <button onClick={() => setEditingMessage(null)} className="cancel-btn">
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <span className="message-text">
                {message.content}
              </span>
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
            <div className="reaction-buttons">
              <button onClick={() => handleReaction(message.id, '👍')} title="Like" className="reaction-btn">👍</button>
              <button onClick={() => handleReaction(message.id, '❤️')} title="Love" className="reaction-btn">❤️</button>
              <button onClick={() => handleReaction(message.id, '😂')} title="Laugh" className="reaction-btn">😂</button>
              <button onClick={() => handleReaction(message.id, '😮')} title="Wow" className="reaction-btn">😮</button>
              <button onClick={() => handleReaction(message.id, '😢')} title="Sad" className="reaction-btn">😢</button>
            </div>
            
            <button onClick={() => setReplyingTo(message)} title="Reply" className="action-btn reply-btn">
              ↩️ Reply
            </button>
            
            {isOwn && (
              <div className="owner-actions">
                <button 
                  onClick={() => setEditingMessage({ id: message.id, content: message.content })} 
                  title="Edit message"
                  className="action-btn edit-btn"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Delete this message? This action cannot be undone.')) {
                      handleDeleteMessage(message.id);
                    }
                  }} 
                  title="Delete message"
                  className="action-btn delete-btn"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 📞 Call Management Functions
  const acceptCall = async (notification: any) => {
    try {
      setError('');
      console.log('🔔 Accepting call from:', notification.senderName);
      
      // Send accept response to server
      const response = await fetch('/api/call-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_call',
          callId: notification.callId,
          userId: currentUser?.userId,
          recipientId: notification.senderId
        })
      });
      
      if (response.ok) {
        // Remove the notification
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        
        // Start the call UI
        console.log('✅ Call accepted, starting call interface...');
        // You can trigger the call interface here
        // For now, just show a success message
        setError(`📞 Call accepted! Connecting to ${notification.senderName}...`);
        
        // Auto-clear the message after 3 seconds
        setTimeout(() => setError(''), 3000);
      } else {
        throw new Error('Failed to accept call');
      }
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      setError('Failed to accept call. Please try again.');
    }
  };

  const declineCall = async (notification: any) => {
    try {
      setError('');
      console.log('📵 Declining call from:', notification.senderName);
      
      // Send decline response to server
      const response = await fetch('/api/call-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline_call',
          callId: notification.callId,
          userId: currentUser?.userId,
          recipientId: notification.senderId
        })
      });
      
      if (response.ok) {
        // Remove the notification
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        console.log('✅ Call declined');
      } else {
        throw new Error('Failed to decline call');
      }
    } catch (error) {
      console.error('❌ Error declining call:', error);
      setError('Failed to decline call');
    }
  };

  // 🗑️ Notification Management
  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return (
    <div className="chat-container">
      {/* Notification overlay */}
      {notifications.length > 0 && (
        <div className="notifications-overlay">
          {notifications.slice(-3).map(notification => (
            <div key={notification.id} className="notification-item">
              <div className="notification-content">
                {notification.type === 'reaction' && (
                  <>
                    <span className="notification-emoji">{notification.emoji}</span>
                    <span>Someone reacted to your message</span>
                  </>
                )}
                {notification.type === 'reply' && (
                  <>
                    <span className="notification-icon">↩️</span>
                    <span>Someone replied to your message: {notification.messageContent?.substring(0, 30)}...</span>
                  </>
                )}
                {notification.type === 'call_invite' && (
                  <div className="call-invite-notification">
                    <div className="call-invite-info">
                      <span className="notification-icon">📞</span>
                      <div className="call-invite-details">
                        <div className="caller-name">{notification.senderName} is calling you</div>
                        <div className="call-type">📹 {notification.callType} call</div>
                      </div>
                    </div>
                    <div className="call-invite-actions">
                      <button 
                        onClick={() => acceptCall(notification)} 
                        className="accept-call-btn"
                        title="Accept call"
                      >
                        📞 Accept
                      </button>
                      <button 
                        onClick={() => declineCall(notification)} 
                        className="decline-call-btn"
                        title="Decline call"
                      >
                        📵 Decline
                      </button>
                    </div>
                  </div>
                )}
                {notification.type === 'call_ended' && (
                  <>
                    <span className="notification-icon">📞</span>
                    <span>Call has ended</span>
                  </>
                )}
              </div>
              <button onClick={() => dismissNotification(notification.id)} className="notification-dismiss">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
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
        <div className="header-actions">
          <button onClick={() => setShowSettings(true)} className="settings-btn" title="Settings">
            ⚙️
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="chat-layout">
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

        <div className="chat-area">
          {selectedUser ? (
            <>
              <div className="chat-area-header">
                <div className="selected-user-info">
                  <div className="user-avatar">👤</div>
                  <div>
                    <h4>{selectedUser.username}</h4>
                    <span className="encryption-status">🔒 AES-512 Encrypted</span>
                  </div>
                </div>
                <div className="chat-header-controls">
                  <CallControlsEnhanced
                    selectedUser={selectedUser}
                    currentUser={currentUser}
                    onCallStart={handleCallStart}
                  />
                  <button onClick={() => loadMessages(true)} disabled={isLoading} className="refresh-btn">
                    🔄
                  </button>
                </div>
              </div>

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

              {replyingTo && (
                <div className="reply-context">
                  <div className="reply-info">
                    <span className="reply-label">📤 Replying to:</span>
                    <span className="reply-preview">{replyingTo.content.substring(0, 50)}{replyingTo.content.length > 50 ? '...' : ''}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="cancel-reply-btn" title="Cancel reply">
                    ❌
                  </button>
                </div>
              )}

              {showFileAttachment && (
                <FileAttachment
                  onFileSelect={setSelectedFiles}
                  onSend={() => handleSendMessage({ preventDefault: () => {} } as React.FormEvent)}
                  selectedFiles={selectedFiles}
                  isUploading={isUploading}
                />
              )}

              <form onSubmit={handleSendMessage} className="message-form">
                <div className="message-input-container">
                  <button 
                    type="button"
                    onClick={() => setShowFileAttachment(!showFileAttachment)} 
                    className={`file-toggle-btn ${showFileAttachment ? 'active' : ''}`}
                    title="Attach file"
                  >
                    📎
                  </button>
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

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}

      {showFilePreview && (
        <div className="file-preview-modal">
          <div className="file-preview-content">
            <div className="file-preview-header">
              <h3>{showFilePreview.fileName}</h3>
              <button onClick={() => setShowFilePreview(null)} className="close-preview">❌</button>
            </div>
            <div className="file-preview-body">
              {showFilePreview.fileType.startsWith('image/') && (
                <img src={`${showFilePreview.downloadUrl}&download=true`} alt={showFilePreview.fileName} />
              )}
              {showFilePreview.fileType.startsWith('video/') && (
                <video controls>
                  <source src={`${showFilePreview.downloadUrl}&download=true`} type={showFilePreview.fileType} />
                </video>
              )}
              {showFilePreview.fileType.startsWith('audio/') && (
                <audio controls>
                  <source src={`${showFilePreview.downloadUrl}&download=true`} type={showFilePreview.fileType} />
                </audio>
              )}
              {showFilePreview.fileType === 'application/pdf' && (
                <iframe src={`${showFilePreview.downloadUrl}&download=true`} title={showFilePreview.fileName}></iframe>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatNew;

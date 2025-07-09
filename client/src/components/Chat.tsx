import React, { useState, useEffect } from 'react';
import { getMessages, sendMessage } from '../api';

interface Message {
  id: string;
  content: string;
  timestamp: string;
  senderId: string;
  recipientId: string;
}

interface ChatProps {
  currentUser: string | null;
  onLogout: () => void;
}

const Chat: React.FC<ChatProps> = ({ currentUser, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
    // Set up polling to refresh messages every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      await sendMessage({
        message: newMessage,
        senderId: currentUser,
        recipientId: 'all'
      });
      
      setNewMessage('');
      // Refresh messages after sending
      await fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>🔐 Crypto 512 Chat</h1>
        <div className="user-info">
          <span>Welcome, {currentUser}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${
                message.senderId === currentUser ? 'own-message' : 'other-message'
              }`}
            >
              <div className="message-header">
                <span className="sender">{message.senderId}</span>
                <span className="timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="message-form">
        <div className="input-group">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="message-input"
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className="send-button"
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;

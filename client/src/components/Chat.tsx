import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
    sendMessage, 
    fetchMessages, 
    fetchUsers, 
    fetchSecurityInfo, 
    fetchSystemStatus,
    fetchConversation,
    deleteMessage,
    deleteConversation,
    deleteAllMessages,
    deleteMessageForEveryone,
    deleteConversationForEveryone
} from '../api';
import SessionManager from '../auth/session';
import UserSwitcher from './UserSwitcher';
import FileUpload from './FileUpload';
import EmojiPickerComponent, { QuickEmojiBar } from './EmojiPicker';
import config from '../config';
import '../styles/global.css';

interface Message {
    id: string;
    content: string;
    timestamp: string;
    senderId: string;
    recipientId: string;
}

interface User {
    username: string;
}

interface SecurityInfo {
    currentUser: string;
    encryptionStatus: string;
    keyManagement: string;
    hashFunction: string;
    sessionSecurity: string;
    tlsStatus: string;
    messageCount: number;
    securityLevel: string;
    algorithms: {
        symmetric: string;
        asymmetric: string;
        hash: string;
        signature: string;
    };
}

const Chat: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showDebugPanel, setShowDebugPanel] = useState(false);
    const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
    const [systemStatus, setSystemStatus] = useState<any>(null);
    const [realtimeLog, setRealtimeLog] = useState<string[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, messageId: string, isOwn: boolean} | null>(null);
    
    // New state for enhanced features
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentCall, setCurrentCall] = useState<any>(null);
    const [incomingCall, setIncomingCall] = useState<any>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();
    const sessionManager = SessionManager.getInstance();

    useEffect(() => {
        // Try to refresh token from storage first
        sessionManager.refreshTokenFromStorage();
        
        const token = sessionManager.getToken();
        console.log('🔍 Checking authentication...', token ? 'Token found' : 'No token');
        
        if (!token) {
            console.log('❌ No authentication token found, redirecting to login');
            navigate('/login');
            return;
        }
        
        console.log('✅ Authentication token found, initializing chat...');
        
        // Initialize Socket.IO connection to HTTPS server
        const socketConnection = io(config.WS_URL, {
            auth: {
                token: token
            },
            transports: ['websocket', 'polling'],
            rejectUnauthorized: false // For development with self-signed certificates
        });

        setSocket(socketConnection);
        
        socketConnection.on('connect', () => {
            addToRealtimeLog('🔌 Connected');
            console.log('✅ Socket.IO connected successfully');
            
            // Authenticate the socket with user info
            if (currentUser) {
                socketConnection.emit('authenticate', {
                    userId: currentUser,
                    username: currentUser
                });
                console.log('👤 Socket authenticated with user:', currentUser);
            }
        });

        socketConnection.on('disconnect', () => {
            addToRealtimeLog('🔌 Disconnected');
            console.log('⚠️ Socket.IO disconnected');
        });

        socketConnection.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error);
            addToRealtimeLog('❌ Connection failed');
        });
        
        initializeChat();
        
        // Only refresh data every 10 minutes, not every minute to avoid interference
        const interval = setInterval(refreshData, 600000); // 10 minutes
        
        return () => {
            clearInterval(interval);
            socketConnection.disconnect();
        };
    }, [navigate]);

    // Separate useEffect for Socket.IO event listeners that depend on currentUser and selectedUser
    useEffect(() => {
        if (!socket) return;

        // Listen for new messages
        const handleNewMessage = (newMessage: Message) => {
            console.log('📨 Real-time message received:', newMessage);
            
            // Check if this message is relevant to the current conversation
            const isRelevantToCurrentConversation = selectedUser && (
                (newMessage.senderId === currentUser && newMessage.recipientId === selectedUser) ||
                (newMessage.senderId === selectedUser && newMessage.recipientId === currentUser)
            );
            
            // Only update messages if it's relevant to current conversation
            if (isRelevantToCurrentConversation) {
                setMessages(prevMessages => {
                    // Check if message already exists to avoid duplicates
                    const exists = prevMessages.some(msg => msg.id === newMessage.id);
                    if (exists) {
                        console.log('⚠️ Duplicate message ignored:', newMessage.id);
                        return prevMessages;
                    }
                    
                    console.log('✅ Adding message to current conversation');
                    const updatedMessages = [...prevMessages, newMessage].sort((a, b) => 
                        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );
                    
                    addToRealtimeLog(`📨 Message from ${newMessage.senderId}`);
                    
                    // Auto-scroll to bottom immediately
                    setTimeout(() => {
                        if (messagesEndRef.current) {
                            const container = messagesEndRef.current.parentElement;
                            if (container) {
                                container.scrollTop = container.scrollHeight;
                            }
                        }
                    }, 50);
                    
                    return updatedMessages;
                });
            } else {
                console.log('ℹ️ Message not relevant to current conversation, skipping update');
            }
        };

        // Listen for message deletions
        const handleMessageDeleted = (data: { messageId: string; deletedBy: string }) => {
            addToRealtimeLog(`🗑️ Message deleted by ${data.deletedBy}`);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== data.messageId));
        };

        // Listen for message deletions for everyone
        const handleMessageDeletedEveryone = (data: { messageId: string; deletedBy: string }) => {
            addToRealtimeLog(`🗑️ Message deleted for everyone by ${data.deletedBy}`);
            setMessages(prevMessages => prevMessages.filter(msg => msg.id !== data.messageId));
        };

        // Listen for conversation deletions
        const handleConversationDeleted = (data: { user1: string; user2: string; deletedBy: string }) => {
            addToRealtimeLog(`🗑️ Conversation deleted by ${data.deletedBy}`);
            if ((data.user1 === currentUser && data.user2 === selectedUser) ||
                (data.user1 === selectedUser && data.user2 === currentUser)) {
                setMessages([]);
            }
        };

        // Listen for conversation deletions for everyone
        const handleConversationDeletedEveryone = (data: { user1: string; user2: string; deletedBy: string }) => {
            addToRealtimeLog(`🗑️ Conversation deleted for everyone by ${data.deletedBy}`);
            if ((data.user1 === currentUser && data.user2 === selectedUser) ||
                (data.user1 === selectedUser && data.user2 === currentUser)) {
                setMessages([]);
            }
        };

        // Listen for user messages deletions
        const handleUserMessagesDeleted = (data: { userId: string; deletedBy: string }) => {
            addToRealtimeLog(`🗑️ All messages deleted by ${data.deletedBy}`);
            if (data.userId === currentUser || data.userId === selectedUser) {
                setMessages([]);
            }
        };

        // Attach event listeners
        socket.on('new_message', handleNewMessage);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('message_deleted_everyone', handleMessageDeletedEveryone);
        socket.on('conversation_deleted', handleConversationDeleted);
        socket.on('conversation_deleted_everyone', handleConversationDeletedEveryone);
        socket.on('user_messages_deleted', handleUserMessagesDeleted);
        
        // File sharing events
        socket.on('file_shared', (data: any) => {
            addToRealtimeLog(`📎 File shared: ${data.fileName}`);
            // Show notification if it's for the current conversation
            if (data.recipientId === currentUser || data.recipientId === selectedUser) {
                // Trigger a conversation reload to show the new file message
                setTimeout(() => {
                    if (selectedUser) {
                        loadConversation();
                    }
                }, 1000);
            }
        });
        
        // Video call events
        socket.on('incoming_call', (data: any) => {
            console.log('📞 Incoming call:', data);
            setIncomingCall(data);
            addToRealtimeLog(`📞 Incoming ${data.type} call from ${data.callerName}`);
        });
        
        socket.on('call_accepted', async (data: any) => {
            console.log('✅ Call accepted:', data);
            addToRealtimeLog('✅ Call accepted - starting video connection');
            
            try {
                await initializeWebRTC();
                setCurrentCall({
                    type: 'video',
                    status: 'ongoing',
                    peer: data.calleeId
                });
            } catch (error) {
                console.error('Failed to initialize WebRTC after call accepted:', error);
                addToRealtimeLog('❌ Failed to initialize video connection');
            }
        });
        
        socket.on('call_rejected', (data: any) => {
            console.log('❌ Call rejected:', data);
            addToRealtimeLog('❌ Call rejected');
            setCurrentCall(null);
        });
        
        socket.on('call_ended', (data: any) => {
            console.log('📞 Call ended:', data);
            addToRealtimeLog('📞 Call ended');
            setCurrentCall(null);
            setIncomingCall(null);
            cleanupCall();
        });
        
        // WebRTC signaling events
        socket.on('webrtc_offer', handleWebRTCOffer);
        socket.on('webrtc_answer', handleWebRTCAnswer);
        socket.on('webrtc_ice_candidate', handleWebRTCIceCandidate);
        
        // Emoji reactions
        socket.on('emoji_reaction', (data: any) => {
            addToRealtimeLog(`😀 ${data.fromUser} reacted with ${data.emoji}`);
        });

        // Cleanup function
        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('message_deleted_everyone', handleMessageDeletedEveryone);
            socket.off('conversation_deleted', handleConversationDeleted);
            socket.off('conversation_deleted_everyone', handleConversationDeletedEveryone);
            socket.off('user_messages_deleted', handleUserMessagesDeleted);
            socket.off('file_shared');
            socket.off('incoming_call');
            socket.off('call_accepted');
            socket.off('call_rejected');
            socket.off('call_ended');
            socket.off('webrtc_offer');
            socket.off('webrtc_answer');
            socket.off('webrtc_ice_candidate');
            socket.off('emoji_reaction');
        };
    }, [socket, currentUser, selectedUser]);

    useEffect(() => {
        // Scroll to bottom when messages change, but only if there are messages
        if (messages.length > 0) {
            // Use a more reliable scroll method
            setTimeout(() => {
                if (messagesEndRef.current) {
                    const messagesContainer = messagesEndRef.current.parentElement;
                    if (messagesContainer) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }
            }, 100);
        }
    }, [messages]);

    useEffect(() => {
        if (selectedUser && currentUser) {
            loadConversation();
        }
    }, [selectedUser, currentUser]);

    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null);
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const handleMessageRightClick = (e: React.MouseEvent, messageId: string, isOwn: boolean) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            messageId,
            isOwn
        });
    };

    const initializeChat = async () => {
        try {
            await Promise.all([
                loadUsers(),
                loadSecurityInfo(),
                loadSystemStatus()
            ]);
            addToRealtimeLog('🚀 Chat initialized');
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            setError('Failed to initialize chat interface');
        }
    };

    const refreshData = async () => {
        try {
            // Only refresh security info occasionally, don't touch messages or users
            await loadSecurityInfo();
            console.log('🔄 Background data refresh completed');
        } catch (error) {
            console.error('Failed to refresh data:', error);
            // Don't show error to user for background refresh failures
        }
    };

    const loadUsers = async () => {
        try {
            console.log('🔄 Loading users...');
            console.log('🔧 API Base URL:', config.API_BASE_URL);
            console.log('🔑 Current token:', sessionManager.getToken() ? 'Present' : 'Missing');
            
            const response = await fetchUsers();
            console.log('📊 Raw users response:', response);
            
            if (response && Array.isArray(response)) {
                // New format: array of user objects with userId and username
                setUsers(response.map((user: any) => ({
                    username: user.username,
                    userId: user.userId
                })));
                console.log('✅ Users processed:', response);
            } else if (response && response.users) {
                // Legacy format: users property with array of usernames
                setUsers(response.users.map((username: string) => ({ username })));
                console.log('✅ Users processed (legacy format):', response.users);
            } else {
                console.warn('⚠️ Unexpected response format:', response);
                addToRealtimeLog('⚠️ Users response format unexpected');
            }
            
            // Get current user from security info
            const secInfo = await fetchSecurityInfo();
            setCurrentUser(secInfo.currentUser);
            addToRealtimeLog(`👤 User: ${secInfo.currentUser}`);
            console.log('✅ Users loaded successfully:', Array.isArray(response) ? response : response.users);
        } catch (error) {
            console.error('Failed to load users:', error);
            console.error('Error details:', {
                message: (error as any)?.message,
                status: (error as any)?.response?.status,
                statusText: (error as any)?.response?.statusText,
                data: (error as any)?.response?.data,
                config: (error as any)?.config
            });
            addToRealtimeLog('❌ Failed to load users');
            
            // Only redirect to login if it's specifically an authentication error
            if ((error as any)?.response?.status === 401) {
                console.log('❌ Authentication failed, redirecting to login');
                sessionManager.invalidateSession(sessionManager.getSessionToken() || '');
                navigate('/login');
            }
            // For other errors, just log them but don't redirect
        }
    };

    const loadConversation = async () => {
        if (!selectedUser) return;
        
        try {
            addToRealtimeLog(`🔄 Loading conversation with ${selectedUser}...`);
            const conversationMessages = await fetchConversation(selectedUser);
            const messageArray = Array.isArray(conversationMessages) ? conversationMessages : [];
            
            // Sort messages by timestamp to ensure proper order
            const sortedMessages = messageArray.sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            
            // Set messages for this specific conversation
            setMessages(sortedMessages);
            addToRealtimeLog(`📥 Loaded ${sortedMessages.length} messages`);
            
            // Scroll to bottom after loading messages - with slightly longer delay
            setTimeout(() => {
                if (messagesEndRef.current) {
                    const container = messagesEndRef.current.parentElement;
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                }
            }, 300);
            
        } catch (error) {
            console.error('Failed to load conversation:', error);
            addToRealtimeLog('❌ Failed to load conversation');
            setMessages([]);
        }
    };

    const loadSecurityInfo = async () => {
        try {
            const info = await fetchSecurityInfo();
            setSecurityInfo(info);
        } catch (error) {
            console.error('Failed to load security info:', error);
        }
    };

    const loadSystemStatus = async () => {
        try {
            const status = await fetchSystemStatus();
            setSystemStatus(status);
        } catch (error) {
            console.error('Failed to load system status:', error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !selectedUser || isLoading) return;

        setIsLoading(true);
        const messageToSend = message.trim();
        setMessage(''); // Clear input immediately for better UX

        try {
            addToRealtimeLog(`🔐 Sending message...`);
            
            const result = await sendMessage({ 
                message: messageToSend, 
                recipientId: selectedUser 
            });
            
            addToRealtimeLog(`✅ Message sent to ${selectedUser}`);
            
            // Don't manually add the message here - let Socket.IO handle it
            // This prevents duplication and ensures proper real-time sync
            
        } catch (error) {
            console.error('Failed to send message:', error);
            setError('Failed to send message');
            addToRealtimeLog(`❌ Send failed`);
            
            // Restore the message in input if sending failed
            setMessage(messageToSend);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        sessionManager.invalidateSession(sessionManager.getSessionToken() || '');
        navigate('/login');
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            addToRealtimeLog(`🗑️ Deleting message ${messageId}...`);
            await deleteMessage(messageId);
            addToRealtimeLog(`✅ Message deleted successfully`);
        } catch (error) {
            console.error('Failed to delete message:', error);
            setError('Failed to delete message');
            addToRealtimeLog(`❌ Message deletion failed: ${error}`);
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedUser) return;
        
        const confirmed = window.confirm(`Are you sure you want to delete the entire conversation with ${selectedUser}? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            addToRealtimeLog(`🗑️ Deleting conversation with ${selectedUser}...`);
            await deleteConversation(selectedUser);
            addToRealtimeLog(`✅ Conversation deleted successfully`);
            setMessages([]);
        } catch (error) {
            console.error('Failed to delete conversation:', error);
            setError('Failed to delete conversation');
            addToRealtimeLog(`❌ Conversation deletion failed: ${error}`);
        }
    };

    const handleDeleteAllMessages = async () => {
        const confirmed = window.confirm('Are you sure you want to delete ALL your messages? This will delete every message you\'ve sent or received. This action cannot be undone.');
        if (!confirmed) return;

        try {
            addToRealtimeLog(`🗑️ Deleting all messages for current user...`);
            await deleteAllMessages();
            addToRealtimeLog(`✅ All messages deleted successfully`);
            setMessages([]);
        } catch (error) {
            console.error('Failed to delete all messages:', error);
            setError('Failed to delete all messages');
            addToRealtimeLog(`❌ All messages deletion failed: ${error}`);
        }
    };

    const handleDeleteMessageForEveryone = async (messageId: string) => {
        const confirmed = window.confirm('Are you sure you want to delete this message for everyone? This action cannot be undone and will remove the message from all users.');
        if (!confirmed) return;

        try {
            addToRealtimeLog(`🗑️ Deleting message ${messageId} for everyone...`);
            await deleteMessageForEveryone(messageId);
            addToRealtimeLog(`✅ Message deleted for everyone successfully`);
        } catch (error) {
            console.error('Failed to delete message for everyone:', error);
            setError('Failed to delete message for everyone');
            addToRealtimeLog(`❌ Message deletion for everyone failed: ${error}`);
        }
    };

    const handleDeleteConversationForEveryone = async () => {
        if (!selectedUser) return;
        
        const confirmed = window.confirm(`Are you sure you want to delete the entire conversation with ${selectedUser} for EVERYONE? This will remove all messages from this conversation for all users and cannot be undone.`);
        if (!confirmed) return;

        try {
            addToRealtimeLog(`🗑️ Deleting conversation with ${selectedUser} for everyone...`);
            await deleteConversationForEveryone(selectedUser);
            addToRealtimeLog(`✅ Conversation deleted for everyone successfully`);
            setMessages([]);
        } catch (error) {
            console.error('Failed to delete conversation for everyone:', error);
            setError('Failed to delete conversation for everyone');
            addToRealtimeLog(`❌ Conversation deletion for everyone failed: ${error}`);
        }
    };

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior: 'smooth',
                block: 'end',
                inline: 'nearest'
            });
        }
    };

    const addToRealtimeLog = (logEntry: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setRealtimeLog(prev => {
            const newLog = `[${timestamp}] ${logEntry}`;
            const updatedLog = [...prev, newLog];
            // Keep last 20 entries to show more history and avoid duplicates
            const uniqueLog = updatedLog.filter((entry, index, arr) => 
                arr.findIndex(e => e.split('] ')[1] === entry.split('] ')[1]) === index
            );
            return uniqueLog.slice(-20);
        });
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('sq-AL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const isOwnMessage = (senderId: string) => senderId === currentUser;

    // WebRTC functions for video calling
    const cleanupCall = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (remoteStream) {
            remoteStream.getTracks().forEach(track => track.stop());
            setRemoteStream(null);
        }
        if (peerConnection) {
            peerConnection.close();
            setPeerConnection(null);
        }
    };

    const initializeWebRTC = async () => {
        try {
            // Use different constraints for same-PC testing
            const constraints = {
                video: {
                    width: { max: 640 },
                    height: { max: 480 },
                    frameRate: { max: 15 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            setLocalStream(stream);
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                localVideoRef.current.muted = true; // Mute local video to prevent echo
            }

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            pc.onicecandidate = (event) => {
                if (event.candidate && socket && selectedUser) {
                    console.log('🧊 Sending ICE candidate');
                    socket.emit('webrtc_ice_candidate', {
                        targetUserId: selectedUser,
                        candidate: event.candidate
                    });
                }
            };

            pc.ontrack = (event) => {
                console.log('📹 Remote track received');
                const [remoteStream] = event.streams;
                setRemoteStream(remoteStream);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = remoteStream;
                }
            };

            pc.onconnectionstatechange = () => {
                console.log('🔗 Connection state:', pc.connectionState);
                if (pc.connectionState === 'connected') {
                    addToRealtimeLog('✅ Video call connected');
                } else if (pc.connectionState === 'failed') {
                    addToRealtimeLog('❌ Video call connection failed');
                }
            };

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            setPeerConnection(pc);
            return pc;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            addToRealtimeLog('❌ Failed to access camera/microphone');
            throw error;
        }
    };

    const handleWebRTCOffer = async (data: any) => {
        try {
            console.log('📨 Received WebRTC offer from:', data.fromUserId);
            const pc = await initializeWebRTC();
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            if (socket) {
                console.log('📤 Sending WebRTC answer to:', data.fromUserId);
                socket.emit('webrtc_answer', {
                    targetUserId: data.fromUserId,
                    answer
                });
            }
            
            addToRealtimeLog('📨 WebRTC offer processed');
        } catch (error) {
            console.error('Error handling WebRTC offer:', error);
            addToRealtimeLog('❌ Failed to process WebRTC offer');
        }
    };

    const handleWebRTCAnswer = async (data: any) => {
        try {
            console.log('📨 Received WebRTC answer from:', data.fromUserId);
            if (peerConnection) {
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
                addToRealtimeLog('📨 WebRTC answer processed');
            }
        } catch (error) {
            console.error('Error handling WebRTC answer:', error);
            addToRealtimeLog('❌ Failed to process WebRTC answer');
        }
    };

    const handleWebRTCIceCandidate = async (data: any) => {
        try {
            console.log('🧊 Received ICE candidate from:', data.fromUserId);
            if (peerConnection && peerConnection.remoteDescription) {
                await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                console.log('🧊 ICE candidate added successfully');
            } else {
                console.log('⏳ Queuing ICE candidate until remote description is set');
                // You might want to queue candidates if remote description isn't set yet
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
            addToRealtimeLog('❌ Failed to process ICE candidate');
        }
    };

    const startVideoCall = async () => {
        if (!selectedUser || !socket) return;

        try {
            console.log('🚀 Starting video call with:', selectedUser);
            addToRealtimeLog(`📞 Starting video call with ${selectedUser}`);
            
            const pc = await initializeWebRTC();
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log('📤 Sending call initiation and WebRTC offer');
            socket.emit('call_initiate', {
                calleeId: selectedUser,
                type: 'video'
            });

            socket.emit('webrtc_offer', {
                targetUserId: selectedUser,
                offer
            });

            setCurrentCall({
                type: 'video',
                status: 'calling',
                peer: selectedUser
            });
            
            addToRealtimeLog('📤 Video call offer sent');
        } catch (error) {
            console.error('Error starting video call:', error);
            addToRealtimeLog('❌ Failed to start video call');
        }
    };

    const acceptCall = async () => {
        if (!incomingCall || !socket) return;

        try {
            console.log('✅ Accepting call from:', incomingCall.callerId);
            addToRealtimeLog(`✅ Accepting call from ${incomingCall.callerName}`);

            // First, initialize WebRTC for the callee
            await initializeWebRTC();

            // Send acceptance to server
            socket.emit('call_accept', {
                callerId: incomingCall.callerId,
                callId: incomingCall.callId
            });

            setCurrentCall({
                type: incomingCall.type,
                status: 'ongoing',
                peer: incomingCall.callerId
            });
            setIncomingCall(null);
            
            addToRealtimeLog('📞 Call accepted - ready for WebRTC connection');
        } catch (error) {
            console.error('Error accepting call:', error);
            addToRealtimeLog('❌ Failed to accept call');
        }
    };

    const rejectCall = () => {
        if (!incomingCall || !socket) return;

        console.log('❌ Rejecting call from:', incomingCall.callerId);
        addToRealtimeLog(`❌ Rejecting call from ${incomingCall.callerName}`);

        socket.emit('call_reject', {
            callerId: incomingCall.callerId
        });

        setIncomingCall(null);
    };

    const endCall = () => {
        if (!currentCall || !socket) return;

        console.log('📞 Ending call with:', currentCall.peer);
        addToRealtimeLog('📞 Ending call');

        socket.emit('call_end', {
            otherUserId: currentCall.peer
        });

        setCurrentCall(null);
        cleanupCall();
    };

    // File upload handler
    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = sessionManager.getToken();
            const response = await fetch(`${config.API_BASE_URL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                
                // Extract file ID from result - use the actual file ID or filename
                const fileId = result.file.id || result.file.fileName || 'unknown';
                const downloadUrl = `${config.API_BASE_URL}/files/${fileId}`;
                
                // Send a message with file info including download link
                const fileMessage = `📎 Shared file: ${file.name}\n🔗 Download: ${downloadUrl}`;
                await sendMessage({
                    message: fileMessage,
                    recipientId: selectedUser
                });

                // Emit file shared event
                if (socket) {
                    socket.emit('file_shared', {
                        fileName: file.name,
                        fileUrl: downloadUrl,
                        fileId: fileId,
                        fileType: file.type,
                        recipientId: selectedUser,
                        senderId: currentUser
                    });
                }

                addToRealtimeLog(`📎 File uploaded: ${file.name}`);
                setShowFileUpload(false);
                
                // Reload conversation to show the new file message
                setTimeout(() => {
                    if (selectedUser) {
                        loadConversation();
                    }
                }, 500);
            } else {
                const error = await response.text();
                throw new Error(`Upload failed: ${error}`);
            }
        } catch (error) {
            console.error('File upload error:', error);
            addToRealtimeLog(`❌ File upload failed: ${error}`);
        } finally {
            setIsUploading(false);
        }
    };

    // Emoji handler
    const handleEmojiSelect = (emoji: string) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const sendEmojiReaction = (emoji: string) => {
        if (socket) {
            socket.emit('emoji_reaction', {
                emoji,
                recipientId: selectedUser,
                messageId: null // For general reactions
            });
        }
    };

    // Handle page refresh and prevent accidental logout
    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // Save current state before page unload
            const token = sessionManager.getToken();
            if (token) {
                localStorage.setItem('session_token', token);
                localStorage.setItem('current_user', currentUser);
                localStorage.setItem('selected_user', selectedUser);
                console.log('💾 Session state saved before page unload');
            }
        };

        // Restore state on component mount if available
        const restoreState = () => {
            const savedUser = localStorage.getItem('current_user');
            const savedSelectedUser = localStorage.getItem('selected_user');
            
            if (savedUser && savedUser !== currentUser) {
                setCurrentUser(savedUser);
                console.log('🔄 Restored current user:', savedUser);
            }
            if (savedSelectedUser && savedSelectedUser !== selectedUser) {
                setSelectedUser(savedSelectedUser);
                console.log('🔄 Restored selected user:', savedSelectedUser);
            }
        };

        // Only restore state once on mount
        if (!currentUser) {
            restoreState();
        }

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser, selectedUser, sessionManager]);

    // Authenticate socket when currentUser becomes available
    useEffect(() => {
        if (socket && currentUser && socket.connected) {
            socket.emit('authenticate', {
                userId: currentUser,
                username: currentUser
            });
            console.log('👤 Socket authenticated with user:', currentUser);
        }
    }, [socket, currentUser]);

    return (
        <div style={{ 
            height: '100vh', 
            display: 'flex', 
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            background: '#f0f2f5'
        }}>
            {/* Sidebar */}
            <div style={{ 
                width: '350px', 
                background: '#ffffff', 
                borderRight: '1px solid #e4e6ea',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{ 
                    padding: '20px', 
                    borderBottom: '1px solid #e4e6ea',
                    background: '#00bfa5'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px'
                    }}>
                        <h2 style={{ 
                            margin: 0, 
                            color: 'white', 
                            fontSize: '20px',
                            fontWeight: '600'
                        }}>💬 Secure Chat</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowDebugPanel(!showDebugPanel)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                                title="Toggle Debug Panel for Professor Demo"
                            >
                                🔍 Debug
                            </button>
                            <button
                                onClick={handleLogout}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '20px',
                                    padding: '8px 12px',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                    <div style={{ 
                        color: 'rgba(255,255,255,0.8)', 
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>👤</span>
                        <span>Logged in as: <strong>{currentUser}</strong></span>
                    </div>
                </div>

                {/* Security Status */}
                <div style={{ 
                    padding: '15px 20px', 
                    background: '#e8f5e8',
                    borderBottom: '1px solid #e4e6ea'
                }}>
                    <div style={{ fontSize: '12px', color: '#2e7d32', fontWeight: '500' }}>
                        🔒 Security Status: Active
                    </div>
                    <div style={{ fontSize: '11px', color: '#4caf50', marginTop: '4px' }}>
                        End-to-end encryption enabled • AES-512
                    </div>
                </div>

                {/* Users List */}
                <div style={{ 
                    padding: '20px', 
                    flex: 1, 
                    overflowY: 'auto' 
                }}>
                    <h3 style={{ 
                        margin: '0 0 15px 0', 
                        fontSize: '16px', 
                        color: '#333',
                        fontWeight: '600'
                    }}>Select User to Chat</h3>
                    
                    {users.filter(user => user.username !== currentUser).length === 0 ? (
                        <div style={{
                            padding: '20px',
                            textAlign: 'center',
                            background: '#f8f9fa',
                            borderRadius: '12px',
                            border: '1px solid #e4e6ea'
                        }}>
                            <div style={{ 
                                fontSize: '48px', 
                                marginBottom: '10px' 
                            }}>👥</div>
                            <h4 style={{ 
                                margin: '0 0 10px 0', 
                                color: '#333' 
                            }}>No Users Available</h4>
                            <p style={{ 
                                margin: '0 0 15px 0', 
                                color: '#666', 
                                fontSize: '14px' 
                            }}>
                                {!currentUser ? 
                                    'Please login to see available users and start chatting.' :
                                    'No other users are currently available for chat.'
                                }
                            </p>
                            <div style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                justifyContent: 'center',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    onClick={loadUsers}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#2196f3',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                >
                                    🔄 Refresh Users
                                </button>
                                {!currentUser && (
                                    <button
                                        onClick={() => window.location.href = '/'}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#4caf50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        🔑 Login
                                    </button>
                                )}
                            </div>
                            <div style={{
                                marginTop: '15px',
                                padding: '10px',
                                background: '#e3f2fd',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#1976d2'
                            }}>
                                💡 Tip: Try these test accounts:
                                <br />
                                <strong>testuser</strong> / testpass123
                                <br />
                                <strong>alice</strong> / alice123
                                <br />
                                <strong>bob</strong> / bob123
                            </div>
                        </div>
                    ) : (
                        users.filter(user => user.username !== currentUser).map(user => (
                            <div
                                key={user.username}
                                onClick={() => setSelectedUser(user.username)}
                                style={{
                                    padding: '15px',
                                    marginBottom: '8px',
                                    background: selectedUser === user.username ? '#e3f2fd' : '#f8f9fa',
                                    border: `1px solid ${selectedUser === user.username ? '#2196f3' : '#e4e6ea'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: selectedUser === user.username ? '#2196f3' : '#00bfa5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '16px'
                                }}>
                                    {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ 
                                        fontWeight: '600', 
                                        fontSize: '14px',
                                        color: '#333'
                                    }}>
                                        {user.username}
                                    </div>
                                    <div style={{ 
                                        fontSize: '12px', 
                                        color: '#666',
                                        marginTop: '2px'
                                    }}>
                                        {selectedUser === user.username ? '🟢 Selected' : '⚪ Available'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column',
                background: '#ffffff'
            }}>
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div style={{ 
                            padding: '20px', 
                            borderBottom: '1px solid #e4e6ea',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: '#00bfa5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '20px'
                            }}>
                                {selectedUser.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#333'
                                }}>
                                    {selectedUser}
                                </h3>
                                <div style={{ 
                                    fontSize: '13px', 
                                    color: '#666',
                                    marginTop: '2px'
                                }}>
                                    🔒 Encrypted conversation • {messages.length} messages
                                </div>
                            </div>
                            
                            {/* Conversation Actions */}
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleDeleteConversation}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#ff5722',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Delete conversation for me only"
                                >
                                    🗑️ Delete for Me
                                </button>
                                <button
                                    onClick={handleDeleteConversationForEveryone}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#d32f2f',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                    title="Delete conversation for everyone"
                                >
                                    🗑️ Delete for Everyone
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div style={{ 
                            flex: 1, 
                            padding: '20px', 
                            overflowY: 'auto',
                            background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            minHeight: 0, // Important for proper flex behavior
                            maxHeight: '100%', // Prevent container from growing
                            scrollBehavior: 'smooth'
                        }}>
                            {messages.length === 0 ? (
                                <div style={{ 
                                    textAlign: 'center', 
                                    color: '#666',
                                    marginTop: '50px',
                                    fontSize: '16px'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
                                    <div>No messages yet</div>
                                    <div style={{ fontSize: '14px', marginTop: '8px', color: '#999' }}>
                                        Start a secure conversation with {selectedUser}
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isOwn = isOwnMessage(msg.senderId);
                                    const showTime = index === 0 || 
                                        new Date(msg.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutes
                                    
                                    return (
                                        <div key={msg.id}>
                                            {showTime && (
                                                <div style={{ 
                                                    textAlign: 'center', 
                                                    fontSize: '12px', 
                                                    color: '#999',
                                                    margin: '15px 0 10px'
                                                }}>
                                                    {new Date(msg.timestamp).toLocaleDateString('sq-AL')} • {formatTime(msg.timestamp)}
                                                </div>
                                            )}
                                            <div style={{ 
                                                display: 'flex', 
                                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                                                marginBottom: '8px'
                                            }}>
                                                <div 
                                                    style={{
                                                        maxWidth: '70%',
                                                        padding: '12px 16px',
                                                        borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                        background: isOwn ? '#00bfa5' : '#f1f3f4',
                                                        color: isOwn ? 'white' : '#333',
                                                        fontSize: '14px',
                                                        lineHeight: '1.4',
                                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                                        wordBreak: 'break-word',
                                                        cursor: 'pointer',
                                                        userSelect: 'none'
                                                    }}
                                                    onContextMenu={(e) => handleMessageRightClick(e, msg.id, isOwn)}
                                                >
                                                    {msg.content.includes('📎 Shared file:') ? (
                                                        <div>
                                                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                                📎 File Shared
                                                            </div>
                                                            <div style={{ fontSize: '13px' }}>
                                                                {msg.content.split('\n')[0].replace('📎 Shared file: ', '')}
                                                            </div>
                                                            {msg.content.includes('🔗 Download:') && (
                                                                <a 
                                                                    href={msg.content.split('🔗 Download: ')[1]} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    style={{ 
                                                                        color: isOwn ? '#b2dfdb' : '#00796b',
                                                                        textDecoration: 'underline',
                                                                        fontSize: '12px',
                                                                        display: 'block',
                                                                        marginTop: '6px'
                                                                    }}
                                                                >
                                                                    💾 Download File
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>{msg.content}</div>
                                                    )}
                                                    <div style={{ 
                                                        fontSize: '11px', 
                                                        marginTop: '6px',
                                                        opacity: 0.8,
                                                        textAlign: 'right'
                                                    }}>
                                                        {formatTime(msg.timestamp)}
                                                        {isOwn && <span style={{ marginLeft: '4px' }}>✓✓</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div style={{ 
                            padding: '20px', 
                            borderTop: '1px solid #e4e6ea',
                            background: '#ffffff'
                        }}>
                            {/* Quick action buttons */}
                            <div style={{ 
                                display: 'flex', 
                                gap: '8px', 
                                marginBottom: '12px',
                                flexWrap: 'wrap'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setShowFileUpload(true)}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#e3f2fd',
                                        color: '#1976d2',
                                        border: '1px solid #bbdefb',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    📎 Attach File
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    style={{
                                        padding: '8px 12px',
                                        background: '#fff3e0',
                                        color: '#f57c00',
                                        border: '1px solid #ffcc02',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    😀 Emoji
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={startVideoCall}
                                    disabled={!selectedUser}
                                    style={{
                                        padding: '8px 12px',
                                        background: selectedUser ? '#e8f5e8' : '#f5f5f5',
                                        color: selectedUser ? '#388e3c' : '#9e9e9e',
                                        border: `1px solid ${selectedUser ? '#c8e6c9' : '#e0e0e0'}`,
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        cursor: selectedUser ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    📹 Video Call
                                </button>
                            </div>
                            
                            {/* Quick emoji bar */}
                            <QuickEmojiBar onEmojiSelect={handleEmojiSelect} />
                            
                            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder={`Type a message to ${selectedUser}...`}
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '14px 20px',
                                        border: '1px solid #e4e6ea',
                                        borderRadius: '25px',
                                        fontSize: '14px',
                                        outline: 'none',
                                        background: '#f8f9fa',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = '#00bfa5';
                                        e.target.style.background = '#ffffff';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = '#e4e6ea';
                                        e.target.style.background = '#f8f9fa';
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!message.trim() || isLoading}
                                    style={{
                                        padding: '14px 24px',
                                        background: (!message.trim() || isLoading) ? '#ccc' : '#00bfa5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '25px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: (!message.trim() || isLoading) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    {isLoading ? '🔄' : '📤'} Send
                                </button>
                            </form>
                            
                            {error && (
                                <div style={{ 
                                    marginTop: '10px', 
                                    padding: '12px', 
                                    background: '#ffebee', 
                                    border: '1px solid #ffcdd2',
                                    borderRadius: '8px',
                                    color: '#c62828',
                                    fontSize: '14px'
                                }}>
                                    {error}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ 
                        flex: 1, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexDirection: 'column',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '24px' }}>💬</div>
                        <h2 style={{ 
                            fontSize: '24px', 
                            color: '#333',
                            marginBottom: '12px',
                            fontWeight: '600'
                        }}>
                            Welcome to Secure Chat
                        </h2>
                        <p style={{ 
                            fontSize: '16px', 
                            color: '#666',
                            textAlign: 'center',
                            maxWidth: '400px',
                            lineHeight: '1.5'
                        }}>
                            Select a user from the sidebar to start a secure, end-to-end encrypted conversation.
                        </p>
                        <div style={{ 
                            marginTop: '32px',
                            padding: '16px 24px',
                            background: '#e8f5e8',
                            borderRadius: '12px',
                            fontSize: '14px',
                            color: '#2e7d32',
                            fontWeight: '500'
                        }}>
                            🔒 All messages are protected with AES-512 encryption
                        </div>
                    </div>
                )}
            </div>

            {/* Debug Panel for Professor Demo */}
            {showDebugPanel && (
                <div style={{ 
                    width: '400px', 
                    background: '#1a1a1a',
                    color: '#00ff00',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'Monaco, Consolas, monospace',
                    fontSize: '12px',
                    borderLeft: '1px solid #333'
                }}>
                    <div style={{ 
                        padding: '15px', 
                        borderBottom: '1px solid #333',
                        background: '#2a2a2a'
                    }}>
                        <h3 style={{ 
                            margin: 0, 
                            color: '#00ff00',
                            fontSize: '14px',
                            fontWeight: 'bold'
                        }}>
                            🎓 Professor Demo - System Monitor
                        </h3>
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                            Live cryptographic operations & security monitoring
                        </div>
                    </div>

                    {/* Security Information */}
                    <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
                        <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '8px' }}>
                            🔐 SECURITY STATUS
                        </div>
                        {securityInfo && (
                            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                <div>Current User: <span style={{ color: '#00ffff' }}>{securityInfo.currentUser}</span></div>
                                <div>Encryption: <span style={{ color: '#00ffff' }}>{securityInfo.encryptionStatus}</span></div>
                                <div>Hash Function: <span style={{ color: '#00ffff' }}>{securityInfo.hashFunction}</span></div>
                                <div>Session Security: <span style={{ color: '#00ffff' }}>{securityInfo.sessionSecurity}</span></div>
                                <div>TLS Status: <span style={{ color: '#00ffff' }}>{securityInfo.tlsStatus}</span></div>
                                <div>Security Level: <span style={{ color: '#00ffff' }}>{securityInfo.securityLevel}</span></div>
                                <div style={{ marginTop: '8px', color: '#ffff00' }}>ALGORITHMS:</div>
                                <div>• Symmetric: <span style={{ color: '#00ffff' }}>{securityInfo.algorithms?.symmetric}</span></div>
                                <div>• Asymmetric: <span style={{ color: '#00ffff' }}>{securityInfo.algorithms?.asymmetric}</span></div>
                                <div>• Hash: <span style={{ color: '#00ffff' }}>{securityInfo.algorithms?.hash}</span></div>
                                <div>• Signature: <span style={{ color: '#00ffff' }}>{securityInfo.algorithms?.signature}</span></div>
                            </div>
                        )}
                    </div>

                    {/* System Status */}
                    <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
                        <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '8px' }}>
                            📊 SYSTEM METRICS
                        </div>
                        {systemStatus && (
                            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
                                <div>Uptime: <span style={{ color: '#00ffff' }}>{Math.floor(systemStatus.uptime / 60)}m {Math.floor(systemStatus.uptime % 60)}s</span></div>
                                <div>Memory: <span style={{ color: '#00ffff' }}>{Math.round(systemStatus.memoryUsage?.heapUsed / 1024 / 1024)}MB</span></div>
                                <div>Total Users: <span style={{ color: '#00ffff' }}>{systemStatus.totalUsers}</span></div>
                                <div>Total Messages: <span style={{ color: '#00ffff' }}>{systemStatus.totalMessages}</span></div>
                                <div>Node Version: <span style={{ color: '#00ffff' }}>{systemStatus.nodeVersion}</span></div>
                            </div>
                        )}
                    </div>

                    {/* Real-time Operations Log */}
                    <div style={{ flex: 1, padding: '15px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '8px' }}>
                            ⚡ REAL-TIME OPERATIONS
                        </div>
                        <div style={{ 
                            flex: 1, 
                            overflowY: 'auto', 
                            fontSize: '10px',
                            lineHeight: '1.3',
                            background: '#0a0a0a',
                            padding: '8px',
                            borderRadius: '4px'
                        }}>
                            {realtimeLog.map((log, index) => (
                                <div key={index} style={{ 
                                    marginBottom: '3px',
                                    color: log.includes('❌') ? '#ff4444' : 
                                          log.includes('✅') ? '#44ff44' : 
                                          log.includes('🔐') ? '#ffff44' : 
                                          log.includes('🔑') ? '#44ffff' : '#00ff00'
                                }}>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={{ padding: '15px', borderTop: '1px solid #333' }}>
                        <div style={{ color: '#ffff00', fontWeight: 'bold', marginBottom: '8px' }}>
                            🎮 DEMO CONTROLS
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => addToRealtimeLog('🔄 Manual security scan initiated')}
                                style={{
                                    padding: '4px 8px',
                                    background: '#333',
                                    color: '#00ff00',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Security Scan
                            </button>
                            <button
                                onClick={() => setRealtimeLog([])}
                                style={{
                                    padding: '4px 8px',
                                    background: '#333',
                                    color: '#00ff00',
                                    border: '1px solid #555',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Clear Log
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Switcher for Multi-Tab Demo */}
            <UserSwitcher onUserChanged={() => window.location.reload()} />
            
            {/* Context Menu for Message Actions */}
            {contextMenu && (
                <div
                    style={{
                        position: 'fixed',
                        top: contextMenu.y,
                        left: contextMenu.x,
                        background: 'white',
                        border: '1px solid #e4e6ea',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        zIndex: 1000,
                        minWidth: '200px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.isOwn && (
                        <div
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f0f0f0',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                            onClick={() => {
                                handleDeleteMessage(contextMenu.messageId);
                                setContextMenu(null);
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                            🗑️ Delete for Me
                        </div>
                    )}
                    <div
                        style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#d32f2f'
                        }}
                        onClick={() => {
                            handleDeleteMessageForEveryone(contextMenu.messageId);
                            setContextMenu(null);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#ffebee'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                        🗑️ Delete for Everyone
                    </div>
                </div>
            )}
            
            {/* File Upload Modal */}
            {showFileUpload && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h3>Upload File</h3>
                        <FileUpload 
                            onFileUpload={handleFileUpload}
                            isUploading={isUploading}
                        />
                        <button 
                            onClick={() => setShowFileUpload(false)}
                            style={{
                                marginTop: '10px',
                                padding: '8px 16px',
                                background: '#f5f5f5',
                                border: '1px solid #ddd',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            
            {/* Emoji Picker */}
            <EmojiPickerComponent 
                isOpen={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onEmojiSelect={handleEmojiSelect}
            />
            
            {/* Incoming Call Modal */}
            {incomingCall && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        width: '90%'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>
                            {incomingCall.type === 'video' ? '📹' : '📞'}
                        </div>
                        <h2 style={{ marginBottom: '10px' }}>Incoming {incomingCall.type} call</h2>
                        <p style={{ marginBottom: '30px', color: '#666' }}>
                            from {incomingCall.callerName}
                        </p>
                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button
                                onClick={acceptCall}
                                style={{
                                    padding: '15px 30px',
                                    background: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '30px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ✅ Accept
                            </button>
                            <button
                                onClick={rejectCall}
                                style={{
                                    padding: '15px 30px',
                                    background: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '30px',
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                ❌ Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Video Call Interface */}
            {currentCall && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'black',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{
                        flex: 1,
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '10px',
                        padding: '20px'
                    }}>
                        {/* Remote video */}
                        <div style={{ background: '#333', borderRadius: '12px', overflow: 'hidden' }}>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                color: 'white',
                                background: 'rgba(0,0,0,0.5)',
                                padding: '5px 10px',
                                borderRadius: '15px'
                            }}>
                                {currentCall.peer}
                            </div>
                        </div>
                        
                        {/* Local video */}
                        <div style={{ background: '#333', borderRadius: '12px', overflow: 'hidden' }}>
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '10px',
                                left: '10px',
                                color: 'white',
                                background: 'rgba(0,0,0,0.5)',
                                padding: '5px 10px',
                                borderRadius: '15px'
                            }}>
                                You
                            </div>
                        </div>
                    </div>
                    
                    {/* Call controls */}
                    <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.8)'
                    }}>
                        <button
                            onClick={endCall}
                            style={{
                                padding: '15px 30px',
                                background: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            📞 End Call
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;

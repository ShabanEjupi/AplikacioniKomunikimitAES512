import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

export interface CallParticipant {
  userId: string;
  username: string;
  socketId: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSharingScreen: boolean;
}

export interface Call {
  id: string;
  type: 'audio' | 'video' | 'screen-share';
  initiator: CallParticipant;
  participants: CallParticipant[];
  startTime: Date;
  endTime?: Date;
  isGroup: boolean;
  groupId?: string;
  status: 'ringing' | 'ongoing' | 'ended' | 'declined';
}

export class WebRTCService {
  private io: SocketIOServer;
  private activeCalls: Map<string, Call> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupWebRTCEvents();
  }

  private setupWebRTCEvents() {
    this.io.on('connection', (socket) => {
      console.log('WebRTC: User connected:', socket.id);

      // User joins WebRTC room
      socket.on('webrtc:join', (data: { userId: string; username: string }) => {
        console.log('WebRTC: User joined:', data.userId);
        this.userSockets.set(data.userId, socket.id);
        this.socketUsers.set(socket.id, data.userId);
        socket.join(`user:${data.userId}`);
      });

      // Initiate call
      socket.on('webrtc:initiate-call', (data: {
        calleeId: string;
        type: 'audio' | 'video';
        isGroup?: boolean;
        groupId?: string;
      }) => {
        const callerId = this.socketUsers.get(socket.id);
        if (!callerId) return;

        const call = this.initiateCall(callerId, data.calleeId, data.type, data.isGroup, data.groupId);
        if (call) {
          // Notify callee
          const calleeSocketId = this.userSockets.get(data.calleeId);
          if (calleeSocketId) {
            this.io.to(calleeSocketId).emit('webrtc:incoming-call', {
              callId: call.id,
              caller: call.initiator,
              type: call.type,
              isGroup: call.isGroup,
              groupId: call.groupId
            });
          }
        }
      });

      // Answer call
      socket.on('webrtc:answer-call', (data: { callId: string; accept: boolean }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) return;

        const call = this.activeCalls.get(data.callId);
        if (!call) return;

        if (data.accept) {
          call.status = 'ongoing';
          call.participants.push({
            userId,
            username: userId, // Should be fetched from user service
            socketId: socket.id,
            isAudioEnabled: true,
            isVideoEnabled: call.type === 'video',
            isSharingScreen: false
          });

          // Notify all participants
          this.notifyCallParticipants(call.id, 'webrtc:call-accepted', {
            callId: call.id,
            participant: call.participants[call.participants.length - 1]
          });
        } else {
          call.status = 'declined';
          // Notify initiator
          const initiatorSocketId = this.userSockets.get(call.initiator.userId);
          if (initiatorSocketId) {
            this.io.to(initiatorSocketId).emit('webrtc:call-declined', {
              callId: call.id,
              declinedBy: userId
            });
          }
        }
      });

      // End call
      socket.on('webrtc:end-call', (data: { callId: string }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) return;

        this.endCall(data.callId, userId);
      });

      // WebRTC signaling
      socket.on('webrtc:offer', (data: { callId: string; offer: any; targetUserId: string }) => {
        const targetSocketId = this.userSockets.get(data.targetUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:offer', {
            callId: data.callId,
            offer: data.offer,
            fromUserId: this.socketUsers.get(socket.id)
          });
        }
      });

      socket.on('webrtc:answer', (data: { callId: string; answer: any; targetUserId: string }) => {
        const targetSocketId = this.userSockets.get(data.targetUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:answer', {
            callId: data.callId,
            answer: data.answer,
            fromUserId: this.socketUsers.get(socket.id)
          });
        }
      });

      socket.on('webrtc:ice-candidate', (data: { callId: string; candidate: any; targetUserId: string }) => {
        const targetSocketId = this.userSockets.get(data.targetUserId);
        if (targetSocketId) {
          this.io.to(targetSocketId).emit('webrtc:ice-candidate', {
            callId: data.callId,
            candidate: data.candidate,
            fromUserId: this.socketUsers.get(socket.id)
          });
        }
      });

      // Toggle audio/video
      socket.on('webrtc:toggle-audio', (data: { callId: string; enabled: boolean }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) return;

        this.toggleParticipantAudio(data.callId, userId, data.enabled);
      });

      socket.on('webrtc:toggle-video', (data: { callId: string; enabled: boolean }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) return;

        this.toggleParticipantVideo(data.callId, userId, data.enabled);
      });

      // Screen sharing
      socket.on('webrtc:start-screen-share', (data: { callId: string }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) return;

        this.startScreenShare(data.callId, userId);
      });

      socket.on('webrtc:stop-screen-share', (data: { callId: string }) => {
        const userId = this.socketUsers.get(socket.id);
        if (!userId) return;

        this.stopScreenShare(data.callId, userId);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          console.log('WebRTC: User disconnected:', userId);
          this.handleUserDisconnection(userId);
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
        }
      });
    });
  }

  private initiateCall(callerId: string, calleeId: string, type: 'audio' | 'video', isGroup: boolean = false, groupId?: string): Call | null {
    const call: Call = {
      id: uuidv4(),
      type,
      initiator: {
        userId: callerId,
        username: callerId, // Should be fetched from user service
        socketId: this.userSockets.get(callerId) || '',
        isAudioEnabled: true,
        isVideoEnabled: type === 'video',
        isSharingScreen: false
      },
      participants: [],
      startTime: new Date(),
      isGroup,
      groupId,
      status: 'ringing'
    };

    this.activeCalls.set(call.id, call);
    return call;
  }

  private endCall(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    call.status = 'ended';
    call.endTime = new Date();

    // Notify all participants
    this.notifyCallParticipants(callId, 'webrtc:call-ended', {
      callId,
      endedBy: userId
    });

    // Remove call from active calls
    this.activeCalls.delete(callId);
  }

  private toggleParticipantAudio(callId: string, userId: string, enabled: boolean) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId) || 
                       (call.initiator.userId === userId ? call.initiator : null);
    
    if (participant) {
      participant.isAudioEnabled = enabled;
      
      // Notify other participants
      this.notifyCallParticipants(callId, 'webrtc:participant-audio-toggled', {
        callId,
        userId,
        enabled
      }, userId);
    }
  }

  private toggleParticipantVideo(callId: string, userId: string, enabled: boolean) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId) || 
                       (call.initiator.userId === userId ? call.initiator : null);
    
    if (participant) {
      participant.isVideoEnabled = enabled;
      
      // Notify other participants
      this.notifyCallParticipants(callId, 'webrtc:participant-video-toggled', {
        callId,
        userId,
        enabled
      }, userId);
    }
  }

  private startScreenShare(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId) || 
                       (call.initiator.userId === userId ? call.initiator : null);
    
    if (participant) {
      participant.isSharingScreen = true;
      
      // Notify other participants
      this.notifyCallParticipants(callId, 'webrtc:screen-share-started', {
        callId,
        userId
      }, userId);
    }
  }

  private stopScreenShare(callId: string, userId: string) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const participant = call.participants.find(p => p.userId === userId) || 
                       (call.initiator.userId === userId ? call.initiator : null);
    
    if (participant) {
      participant.isSharingScreen = false;
      
      // Notify other participants
      this.notifyCallParticipants(callId, 'webrtc:screen-share-stopped', {
        callId,
        userId
      }, userId);
    }
  }

  private notifyCallParticipants(callId: string, event: string, data: any, excludeUserId?: string) {
    const call = this.activeCalls.get(callId);
    if (!call) return;

    const allParticipants = [call.initiator, ...call.participants];
    
    allParticipants.forEach(participant => {
      if (excludeUserId && participant.userId === excludeUserId) return;
      
      const socketId = this.userSockets.get(participant.userId);
      if (socketId) {
        this.io.to(socketId).emit(event, data);
      }
    });
  }

  private handleUserDisconnection(userId: string) {
    // Find and end any active calls for this user
    for (const [callId, call] of this.activeCalls) {
      if (call.initiator.userId === userId || call.participants.some(p => p.userId === userId)) {
        this.endCall(callId, userId);
      }
    }
  }

  // Public methods
  public getActiveCall(callId: string): Call | undefined {
    return this.activeCalls.get(callId);
  }

  public getActiveCalls(): Call[] {
    return Array.from(this.activeCalls.values());
  }

  public getUserActiveCalls(userId: string): Call[] {
    return Array.from(this.activeCalls.values()).filter(call => 
      call.initiator.userId === userId || call.participants.some(p => p.userId === userId)
    );
  }
}

let webRTCServiceInstance: WebRTCService | null = null;

export function getWebRTCService(io: SocketIOServer): WebRTCService {
  if (!webRTCServiceInstance) {
    webRTCServiceInstance = new WebRTCService(io);
  }
  return webRTCServiceInstance;
}

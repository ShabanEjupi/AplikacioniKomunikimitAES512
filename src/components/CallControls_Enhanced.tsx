import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CallControlsProps {
  selectedUser: { username: string; userId: string } | null;
  currentUser: { username: string; userId: string } | null;
  onCallStart: (type: 'voice' | 'video') => void;
}

interface CallState {
  isActive: boolean;
  type: 'voice' | 'video' | null;
  duration: number;
  isMuted: boolean;
  isVideoOff: boolean;
  isIncoming: boolean;
  caller?: string;
  callId?: string;
  isConnecting: boolean;
  isScreenSharing: boolean;
}

const CallControlsEnhanced: React.FC<CallControlsProps> = ({
  selectedUser,
  currentUser,
  onCallStart
}) => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    type: null,
    duration: 0,
    isMuted: false,
    isVideoOff: false,
    isIncoming: false,
    isConnecting: false,
    isScreenSharing: false
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const callCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // End call
  const endCall = useCallback(async () => {
    // End call on server if we have a callId
    if (callState.callId) {
      try {
        await fetch('/api/call-management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'end_call',
            callId: callState.callId
          })
        });
      } catch (error) {
        console.error('Error ending call on server:', error);
      }
    }

    // Clear call checking interval
    if (callCheckInterval.current) {
      clearInterval(callCheckInterval.current);
      callCheckInterval.current = null;
    }

    // Stop all media tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clear videos
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Stop timer
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    setCallState({
      isActive: false,
      type: null,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isIncoming: false,
      isConnecting: false,
      isScreenSharing: false
    });

    setIncomingCall(null);
    setError('');
  }, [localStream, remoteStream, callState.callId]);

  // Check for incoming calls every 2 seconds
  useEffect(() => {
    if (!currentUser || callState.isActive) return;

    const checkIncomingCalls = async () => {
      try {
        const response = await fetch('/api/call-management', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check_incoming_calls',
            userId: currentUser.userId
          })
        });

        if (response.ok) {
          const { incomingCall: incoming } = await response.json();
          if (incoming && !callState.isActive) {
            setIncomingCall(incoming);
          }
        }
      } catch (error) {
        console.error('Error checking incoming calls:', error);
      }
    };

    callCheckInterval.current = setInterval(checkIncomingCalls, 2000);

    return () => {
      if (callCheckInterval.current) {
        clearInterval(callCheckInterval.current);
        callCheckInterval.current = null;
      }
    };
  }, [currentUser, callState.isActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peerConnection.current) return;

    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    };

    peerConnection.current = new RTCPeerConnection(rtcConfig);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer via signaling server
        console.log('ICE candidate:', event.candidate);
      }
    };

    peerConnection.current.ontrack = (event) => {
      console.log('Received remote stream');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.current.onconnectionstatechange = () => {
      const state = peerConnection.current?.connectionState;
      console.log('Connection state:', state);
      
      if (state === 'connected') {
        setCallState(prev => ({ ...prev, isConnecting: false }));
      } else if (state === 'disconnected' || state === 'failed') {
        endCall();
      }
    };
  }, [endCall]);

  // Get user media
  const getUserMedia = async (type: 'voice' | 'video') => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err: any) {
      console.error('Failed to get user media:', err);
      setError(`Camera/microphone access denied: ${err.message}`);
      throw err;
    }
  };

  // Start call
  const startCall = async (type: 'voice' | 'video') => {
    if (!selectedUser || !currentUser) return;

    try {
      setError('');
      const callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setCallState(prev => ({ 
        ...prev, 
        isActive: true, 
        type, 
        isConnecting: true,
        callId
      }));

      // Store call in server for the recipient to see
      const callData = {
        callId,
        callerId: currentUser.userId,
        callerName: currentUser.username,
        recipientId: selectedUser.userId,
        type,
        status: 'ringing',
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };

      const storeResponse = await fetch('/api/call-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'store_call',
          callData
        })
      });

      if (!storeResponse.ok) {
        throw new Error('Failed to initiate call');
      }

      initializePeerConnection();
      const stream = await getUserMedia(type);

      // Add stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);

      // Start duration timer
      startDurationTimer();

      onCallStart(type);
      console.log(`${type} call started with ${selectedUser.username}`);

      // Auto-end call after 30 seconds if not answered
      setTimeout(() => {
        if (callState.isConnecting) {
          endCall();
          setError('Call not answered');
        }
      }, 30000);

    } catch (err: any) {
      console.error('Failed to start call:', err);
      setError(`Failed to start call: ${err.message}`);
      endCall();
    }
  };

  // Answer call
  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      setError('');
      setCallState(prev => ({ 
        ...prev, 
        isActive: true, 
        type: incomingCall.type,
        isIncoming: true,
        callId: incomingCall.callId
      }));

      // Accept the call on the server
      const acceptResponse = await fetch('/api/call-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_call',
          callId: incomingCall.callId,
          userId: currentUser?.userId
        })
      });

      if (!acceptResponse.ok) {
        throw new Error('Failed to accept call');
      }

      initializePeerConnection();
      const stream = await getUserMedia(incomingCall.type);

      // Add stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, stream);
      });

      // Create answer
      const answer = await peerConnection.current!.createAnswer();
      await peerConnection.current!.setLocalDescription(answer);

      setIncomingCall(null);
      startDurationTimer();
    } catch (err: any) {
      console.error('Failed to answer call:', err);
      setError(`Failed to answer call: ${err.message}`);
      endCall();
    }
  };

  // Decline call
  const declineCall = async () => {
    if (!incomingCall) return;

    try {
      await fetch('/api/call-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end_call',
          callId: incomingCall.callId
        })
      });
    } catch (error) {
      console.error('Error declining call:', error);
    }

    setIncomingCall(null);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({ ...prev, isMuted: !audioTrack.enabled }));
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({ ...prev, isVideoOff: !videoTrack.enabled }));
      }
    }
  };

  // Screen sharing
  const toggleScreenShare = async () => {
    try {
      if (callState.isScreenSharing) {
        // Stop screen sharing, return to camera
        const stream = await getUserMedia(callState.type || 'video');
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallState(prev => ({ ...prev, isScreenSharing: false }));
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setCallState(prev => ({ ...prev, isScreenSharing: true }));

        // Handle screen share end
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }
    } catch (err: any) {
      console.error('Screen share error:', err);
      setError(`Screen sharing failed: ${err.message}`);
    }
  };

  // Duration timer
  const startDurationTimer = () => {
    durationInterval.current = setInterval(() => {
      setCallState(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!selectedUser) return null;

  return (
    <div className="call-controls-enhanced">
      {/* Incoming call notification */}
      {incomingCall && (
        <div className="incoming-call-modal">
          <div className="incoming-call-content">
            <h3>📞 Incoming {incomingCall.type} call</h3>
            <p>From: {incomingCall.callerName}</p>
            <div className="incoming-call-actions">
              <button onClick={answerCall} className="answer-btn">
                📞 Answer
              </button>
              <button onClick={declineCall} className="decline-btn">
                📵 Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active call interface */}
      {callState.isActive && (
        <div className="active-call-modal">
          <div className="call-header">
            <span>{callState.type} call with {selectedUser.username}</span>
            <span className="call-duration">{formatDuration(callState.duration)}</span>
            {callState.isConnecting && <span className="connecting-indicator">Connecting...</span>}
          </div>

          {callState.type === 'video' && (
            <div className="video-container">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="remote-video"
              />
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="local-video"
              />
            </div>
          )}

          <div className="call-controls">
            <button 
              onClick={toggleMute}
              className={`control-btn ${callState.isMuted ? 'muted' : ''}`}
              title={callState.isMuted ? 'Unmute' : 'Mute'}
            >
              {callState.isMuted ? '🔇' : '🎙️'}
            </button>

            {callState.type === 'video' && (
              <>
                <button 
                  onClick={toggleVideo}
                  className={`control-btn ${callState.isVideoOff ? 'video-off' : ''}`}
                  title={callState.isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                >
                  {callState.isVideoOff ? '📹' : '📷'}
                </button>

                <button 
                  onClick={toggleScreenShare}
                  className={`control-btn ${callState.isScreenSharing ? 'sharing' : ''}`}
                  title={callState.isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                  🖥️
                </button>
              </>
            )}

            <button onClick={endCall} className="end-call-btn">
              📞 End Call
            </button>
          </div>

          {error && (
            <div className="call-error">
              ⚠️ {error}
            </div>
          )}
        </div>
      )}

      {/* Call initiation buttons */}
      {!callState.isActive && !incomingCall && (
        <div className="call-initiation">
          <button 
            onClick={() => startCall('voice')} 
            className="voice-call-btn"
            title="Voice call"
          >
            📞
          </button>
          <button 
            onClick={() => startCall('video')} 
            className="video-call-btn"
            title="Video call"
          >
            📹
          </button>
        </div>
      )}
    </div>
  );
};

export default CallControlsEnhanced;

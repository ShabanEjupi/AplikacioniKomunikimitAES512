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
}

interface CallData {
  callId: string;
  callerId: string;
  callerName: string;
  recipientId: string;
  recipientName: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended';
  startTime: string;
}

const CallControls: React.FC<CallControlsProps> = ({
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
    isConnecting: false
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callStatusCheckRef = useRef<NodeJS.Timeout | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Store active call in global memory for cross-user communication
  const storeCall = async (callData: CallData) => {
    try {
      await fetch('/api/call-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'store_call',
          callData
        }),
      });
    } catch (error) {
      console.error('Failed to store call:', error);
    }
  };

  const checkForIncomingCalls = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch('/api/call-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_incoming_calls',
          userId: currentUser.userId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.incomingCall && !callState.isActive) {
          setIncomingCall(data.incomingCall);
        }
      }
    } catch (error) {
      console.error('Failed to check for incoming calls:', error);
    }
  }, [currentUser, callState.isActive]);

  // Check call status during active call
  const endCall = useCallback(async () => {
    console.log('🔚 Ending call...');
    
    // Stop media streams properly
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`🎤 Stopping ${track.kind} track`);
        track.stop();
      });
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        console.log(`📺 Stopping remote ${track.kind} track`);
        track.stop();
      });
      setRemoteStream(null);
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close WebRTC connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Clear call status check interval
    if (callStatusCheckRef.current) {
      clearInterval(callStatusCheckRef.current);
      callStatusCheckRef.current = null;
    }

    // End call on server
    if (callState.callId) {
      await endCallOnServer(callState.callId);
    }

    setCallState({
      isActive: false,
      type: null,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isIncoming: false,
      isConnecting: false
    });
    
    console.log('✅ Call ended successfully');
  }, [localStream, remoteStream, callState.callId]);

  const checkCallStatus = useCallback(async () => {
    if (!callState.isActive || !callState.callId) return;
    
    try {
      const response = await fetch('/api/call-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'check_call_status',
          callId: callState.callId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ended') {
          // Call was ended by other party
          endCall();
          alert('Call ended by the other party');
        } else if (data.call && data.call.connectedAt && !callState.isConnecting) {
          // Sync duration based on connection time
          const connectedTime = new Date(data.call.connectedAt).getTime();
          const currentTime = Date.now();
          const actualDuration = Math.floor((currentTime - connectedTime) / 1000);
          
          setCallState(prev => ({
            ...prev,
            duration: actualDuration
          }));
        }
      }
    } catch (error) {
      console.error('Failed to check call status:', error);
    }
  }, [callState.isActive, callState.callId, callState.isConnecting, endCall]);

  // Setup WebRTC connection
  const setupWebRTC = useCallback(async (stream: MediaStream, isInitiator: boolean = false) => {
    try {
      console.log('🔗 Setting up WebRTC connection...');
      
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });

      peerConnection.current = pc;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        console.log(`➕ Adding ${track.kind} track to peer connection`);
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        console.log('📡 Received remote track:', event.track.kind);
        const [remoteStream] = event.streams;
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('📺 Set remote video source');
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated:', event.candidate.type);
          // In a real implementation, send candidate to other peer via signaling server
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ WebRTC connected successfully');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          console.log('❌ WebRTC connection lost');
        }
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('🧊 ICE connection state:', pc.iceConnectionState);
      };

      if (isInitiator) {
        // Create offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callState.type === 'video'
        });
        await pc.setLocalDescription(offer);
        console.log('📞 Created offer:', offer.type);
        // In a real implementation, send offer to other peer via signaling server
      }

      return pc;
    } catch (error) {
      console.error('❌ Failed to setup WebRTC:', error);
      return null;
    }
  }, [callState.type]);

  const endCallOnServer = async (callId: string) => {
    try {
      await fetch('/api/call-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'end_call',
          callId
        }),
      });
    } catch (error) {
      console.error('Failed to end call on server:', error);
    }
  };

  // Check for incoming calls every 2 seconds
  useEffect(() => {
    if (currentUser && !callState.isActive) {
      callCheckIntervalRef.current = setInterval(checkForIncomingCalls, 2000);
      return () => {
        if (callCheckIntervalRef.current) {
          clearInterval(callCheckIntervalRef.current);
        }
      };
    }
  }, [currentUser, callState.isActive, checkForIncomingCalls]);

  // Check call status during active calls every 3 seconds
  useEffect(() => {
    if (callState.isActive && callState.callId) {
      callStatusCheckRef.current = setInterval(checkCallStatus, 3000);
      return () => {
        if (callStatusCheckRef.current) {
          clearInterval(callStatusCheckRef.current);
        }
      };
    }
  }, [callState.isActive, callState.callId, checkCallStatus]);

  const startCall = async (type: 'voice' | 'video') => {
    if (!selectedUser || !currentUser) {
      alert('Please select a user to call');
      return;
    }

    try {
      setCallState(prev => ({ ...prev, isConnecting: true }));

      // Create call data
      const callData: CallData = {
        callId: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        callerId: currentUser.userId,
        callerName: currentUser.username,
        recipientId: selectedUser.userId,
        recipientName: selectedUser.username,
        type,
        status: 'ringing',
        startTime: new Date().toISOString()
      };

      // Store call for the recipient to see
      await storeCall(callData);

      // Get user media with improved constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: type === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false
      };

      console.log('🎥 Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Prevent audio feedback
      }

      // Setup WebRTC for actual audio/video communication
      await setupWebRTC(stream, true);

      setCallState({
        isActive: true,
        type,
        duration: 0,
        isMuted: false,
        isVideoOff: type === 'voice',
        isIncoming: false,
        callId: callData.callId,
        isConnecting: true
      });

      onCallStart(type);

      // Start checking for call acceptance
      const checkAcceptance = setInterval(async () => {
        try {
          const response = await fetch('/api/call-management', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'check_call_status',
              callId: callData.callId
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.status === 'connected') {
              clearInterval(checkAcceptance);
              setCallState(prev => ({ ...prev, isConnecting: false }));
              
              // Start duration counter synchronized with server time
              const startTime = Date.now();
              durationIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setCallState(prev => ({
                  ...prev,
                  duration: elapsed
                }));
              }, 1000);

              alert(`Call connected with ${selectedUser.username}!`);
            } else if (data.status === 'ended') {
              clearInterval(checkAcceptance);
              endCall();
              alert('Call was declined or ended');
            }
          }
        } catch (error) {
          console.error('Error checking call status:', error);
        }
      }, 1000);

      // Auto-end call after 30 seconds if not answered
      setTimeout(() => {
        clearInterval(checkAcceptance);
        if (callState.isConnecting) {
          endCall();
          alert('Call timeout - no answer');
        }
      }, 30000);

    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
      setCallState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;

    try {
      // Update call status to connected
      await fetch('/api/call-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'accept_call',
          callId: incomingCall.callId,
          userId: currentUser.userId
        }),
      });

      // Get user media with improved constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: incomingCall.type === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false
      };

      console.log('🎥 Accepting call with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && incomingCall.type === 'video') {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Prevent audio feedback
      }

      // Setup WebRTC for actual audio/video communication
      await setupWebRTC(stream, false);

      setCallState({
        isActive: true,
        type: incomingCall.type,
        duration: 0,
        isMuted: false,
        isVideoOff: incomingCall.type === 'voice',
        isIncoming: true,
        callId: incomingCall.callId,
        isConnecting: false
      });

      setIncomingCall(null);

      // Start duration counter synchronized with server time
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCallState(prev => ({
          ...prev,
          duration: elapsed
        }));
      }, 1000);

    } catch (error) {
      console.error('Error accepting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;

    await endCallOnServer(incomingCall.callId);
    setIncomingCall(null);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = callState.isMuted;
        setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
      }
    }
  };

  const toggleVideo = () => {
    if (localStream && callState.type === 'video') {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = callState.isVideoOff;
        setCallState(prev => ({ ...prev, isVideoOff: !prev.isVideoOff }));
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!callState.isActive || callState.type !== 'video') return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing and switch back to camera
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
          setScreenStream(null);
        }

        // Get camera stream again
        const constraints = {
          audio: true,
          video: true
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setLocalStream(newStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = newStream;
        }

        // Replace tracks in peer connection
        if (peerConnection.current) {
          const videoTrack = newStream.getVideoTracks()[0];
          const sender = peerConnection.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }

        setIsScreenSharing(false);
      } else {
        // Start screen sharing
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setScreenStream(displayStream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = displayStream;
        }

        // Replace video track in peer connection
        if (peerConnection.current) {
          const videoTrack = displayStream.getVideoTracks()[0];
          const sender = peerConnection.current.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender && videoTrack) {
            await sender.replaceTrack(videoTrack);
          }
        }

        // Handle screen share ending
        displayStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare(); // Switch back to camera
        };

        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
      alert('Screen sharing failed. Please check permissions.');
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (callCheckIntervalRef.current) {
        clearInterval(callCheckIntervalRef.current);
      }
      if (callStatusCheckRef.current) {
        clearInterval(callStatusCheckRef.current);
      }
    };
  }, [localStream, screenStream]);

  // Incoming call notification
  if (incomingCall) {
    return (
      <div className="incoming-call-notification">
        <div className="incoming-call-content">
          <h3>📞 Incoming {incomingCall.type} call</h3>
          <p>From: {incomingCall.callerName}</p>
          <div className="incoming-call-buttons">
            <button onClick={acceptCall} className="accept-call-btn">
              ✅ Accept
            </button>
            <button onClick={declineCall} className="decline-call-btn">
              ❌ Decline
            </button>
          </div>
        </div>

        <style>{`
          .incoming-call-notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 2000;
            text-align: center;
            border: 3px solid #007bff;
          }

          .incoming-call-content h3 {
            margin-bottom: 10px;
            color: #333;
          }

          .incoming-call-content p {
            margin-bottom: 20px;
            color: #666;
            font-size: 16px;
          }

          .incoming-call-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
          }

          .accept-call-btn, .decline-call-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s;
          }

          .accept-call-btn {
            background: #28a745;
            color: white;
          }

          .accept-call-btn:hover {
            background: #218838;
          }

          .decline-call-btn {
            background: #dc3545;
            color: white;
          }

          .decline-call-btn:hover {
            background: #c82333;
          }
        `}</style>
      </div>
    );
  }

  // Active call interface
  if (callState.isActive) {
    return (
      <div className="call-interface">
        <div className="call-header">
          <h3>
            {callState.type === 'video' ? '📹' : '📞'} 
            {callState.isIncoming ? `Call from ${selectedUser?.username}` : selectedUser?.username}
          </h3>
          {callState.isConnecting ? (
            <span className="call-status">Connecting...</span>
          ) : (
            <span className="call-duration">{formatDuration(callState.duration)}</span>
          )}
        </div>

        {callState.type === 'video' && (
          <div className="video-container">
            <video
              ref={remoteVideoRef}
              className="remote-video"
              autoPlay
              playsInline
            />
            <video
              ref={localVideoRef}
              className="local-video"
              autoPlay
              playsInline
              muted
            />
          </div>
        )}

        <div className="call-controls">
          <button
            onClick={toggleMute}
            className={`control-btn ${callState.isMuted ? 'muted' : ''}`}
            title={callState.isMuted ? 'Unmute' : 'Mute'}
          >
            {callState.isMuted ? '🔇' : '🎤'}
          </button>

          {callState.type === 'video' && (
            <>
              <button
                onClick={toggleVideo}
                className={`control-btn ${callState.isVideoOff ? 'video-off' : ''}`}
                title={callState.isVideoOff ? 'Turn on camera' : 'Turn off camera'}
              >
                {callState.isVideoOff ? '📹❌' : '📹'}
              </button>
              
              <button
                onClick={toggleScreenShare}
                className={`control-btn ${isScreenSharing ? 'screen-sharing' : ''}`}
                title={isScreenSharing ? 'Stop screen share' : 'Share screen'}
              >
                {isScreenSharing ? '🖥️✋' : '🖥️'}
              </button>
            </>
          )}

          <button
            onClick={endCall}
            className="control-btn end-call"
            title="End call"
          >
            📞❌
          </button>
        </div>

        <style>{`
          .call-interface {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #1a1a1a;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            color: white;
          }

          .call-header {
            padding: 20px;
            text-align: center;
            background: rgba(0, 0, 0, 0.8);
          }

          .call-header h3 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }

          .call-duration, .call-status {
            font-size: 18px;
            color: #ccc;
          }

          .video-container {
            flex: 1;
            position: relative;
            background: #000;
          }

          .remote-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .local-video {
            position: absolute;
            top: 20px;
            right: 20px;
            width: 200px;
            height: 150px;
            border-radius: 10px;
            border: 2px solid white;
            object-fit: cover;
          }

          .call-controls {
            padding: 30px;
            display: flex;
            justify-content: center;
            gap: 20px;
            background: rgba(0, 0, 0, 0.8);
          }

          .control-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: none;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .control-btn:not(.end-call) {
            background: #4a4a4a;
            color: white;
          }

          .control-btn:not(.end-call):hover {
            background: #5a5a5a;
          }

          .control-btn.muted,
          .control-btn.video-off {
            background: #dc3545;
          }

          .control-btn.screen-sharing {
            background: #28a745;
          }

          .control-btn.end-call {
            background: #dc3545;
            color: white;
          }

          .control-btn.end-call:hover {
            background: #c82333;
          }
        `}</style>
      </div>
    );
  }

  // Call buttons
  return (
    <div className="call-buttons">
      <button
        onClick={() => startCall('voice')}
        disabled={!selectedUser}
        className="call-btn voice-call"
        title="Voice call"
      >
        📞
      </button>
      
      <button
        onClick={() => startCall('video')}
        disabled={!selectedUser}
        className="call-btn video-call"
        title="Video call"
      >
        📹
      </button>

      <style>{`
        .call-buttons {
          display: flex;
          gap: 10px;
        }

        .call-btn {
          background: #28a745;
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }

        .call-btn:hover:not(:disabled) {
          background: #218838;
        }

        .call-btn:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .video-call {
          background: #007bff;
        }

        .video-call:hover:not(:disabled) {
          background: #0056b3;
        }
      `}</style>
    </div>
  );
};

export default CallControls;

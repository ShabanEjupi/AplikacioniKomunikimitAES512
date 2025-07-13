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
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const callCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

      // Get user media
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

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
              
              // Start duration counter
              durationIntervalRef.current = setInterval(() => {
                setCallState(prev => ({
                  ...prev,
                  duration: prev.duration + 1
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
          callId: incomingCall.callId
        }),
      });

      // Get user media
      const constraints = {
        audio: true,
        video: incomingCall.type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && incomingCall.type === 'video') {
        localVideoRef.current.srcObject = stream;
      }

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

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
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

  const endCall = async () => {
    // Stop media streams
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    // Clear duration interval
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [localStream]);

  // Incoming call notification
  if (incomingCall) {
    return (
      <div className="incoming-call">
        <div className="incoming-call-content">
          <h3>📞 Incoming {incomingCall.type} call</h3>
          <p>From: {incomingCall.callerName}</p>
          <div className="incoming-call-buttons">
            <button
              onClick={acceptCall}
              className="accept-btn"
              title="Accept call"
            >
              ✅ Accept
            </button>
            <button
              onClick={declineCall}
              className="decline-btn"
              title="Decline call"
            >
              ❌ Decline
            </button>
          </div>
        </div>

        <style>{`
          .incoming-call {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #2a2a2a;
            border: 2px solid #007bff;
            border-radius: 10px;
            padding: 20px;
            z-index: 1001;
            color: white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          }

          .incoming-call-content {
            text-align: center;
          }

          .incoming-call h3 {
            margin: 0 0 10px 0;
            font-size: 20px;
          }

          .incoming-call p {
            margin: 0 0 20px 0;
            font-size: 16px;
            color: #ccc;
          }

          .incoming-call-buttons {
            display: flex;
            gap: 10px;
            justify-content: center;
          }

          .accept-btn, .decline-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
          }

          .accept-btn {
            background: #28a745;
            color: white;
          }

          .accept-btn:hover {
            background: #218838;
          }

          .decline-btn {
            background: #dc3545;
            color: white;
          }

          .decline-btn:hover {
            background: #c82333;
          }
        `}</style>
      </div>
    );
  }

  if (callState.isActive) {
    return (
      <div className="call-interface">
        <div className="call-header">
          <h3>
            {callState.type === 'video' ? '📹' : '📞'} 
            {selectedUser?.username}
          </h3>
          <span className="call-duration">{formatDuration(callState.duration)}</span>
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
            <button
              onClick={toggleVideo}
              className={`control-btn ${callState.isVideoOff ? 'video-off' : ''}`}
              title={callState.isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {callState.isVideoOff ? '📹❌' : '📹'}
            </button>
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

          .call-duration {
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

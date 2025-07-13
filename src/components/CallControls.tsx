import React, { useState, useRef, useEffect } from 'react';

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
    isIncoming: false
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // WebRTC is complex for real implementation
  // This is a UI mockup showing the interface
  const startCall = async (type: 'voice' | 'video') => {
    if (!selectedUser) {
      alert('Please select a user to call');
      return;
    }

    try {
      // In a real implementation, you would:
      // 1. Get user media (camera/microphone)
      // 2. Create RTCPeerConnection
      // 3. Handle signaling through your backend
      // 4. Exchange offers/answers via WebSocket or polling

      // For now, we'll simulate starting a call
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
        isIncoming: false
      });

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setCallState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);

      onCallStart(type);

      // Simulate call connection after 3 seconds
      setTimeout(() => {
        alert(`${type} call connected with ${selectedUser.username}!`);
      }, 3000);

    } catch (error) {
      console.error('Error starting call:', error);
      alert('Could not access camera/microphone. Please check permissions.');
    }
  };

  const endCall = () => {
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

    setCallState({
      isActive: false,
      type: null,
      duration: 0,
      isMuted: false,
      isVideoOff: false,
      isIncoming: false
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
        localStream.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [localStream]);

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

import React, { useState, useEffect, useRef } from 'react';

interface Call {
  id: string;
  type: 'audio' | 'video';
  participants: {
    userId: string;
    username: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isSharingScreen: boolean;
  }[];
  status: 'ringing' | 'ongoing' | 'ended';
}

interface VideoCallProps {
  call: Call;
  currentUserId: string;
  onEndCall: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({
  call,
  currentUserId,
  onEndCall,
  onToggleAudio,
  onToggleVideo,
  onStartScreenShare,
  onStopScreenShare
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(call.type === 'video');
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    // Start call timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Initialize local media stream
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: call.type === 'video',
          audio: true
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    return () => {
      // Cleanup streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [call.type]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        onToggleAudio();
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        onToggleVideo();
      }
    }
  };

  const handleScreenShare = async () => {
    try {
      if (!isSharingScreen) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        // Replace video track with screen share
        if (localStream) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = localStream.getVideoTracks()[0];
          // In a real implementation, you'd replace the track in the peer connection
        }
        
        setIsSharingScreen(true);
        onStartScreenShare();
        
        // Listen for screen share end
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
          setIsSharingScreen(false);
          onStopScreenShare();
        });
      } else {
        setIsSharingScreen(false);
        onStopScreenShare();
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const currentParticipant = call.participants.find(p => p.userId === currentUserId);
  const otherParticipants = call.participants.filter(p => p.userId !== currentUserId);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">
            {call.type === 'video' ? 'Video Call' : 'Voice Call'}
          </h2>
          <span className="text-sm text-gray-300">
            {formatDuration(callDuration)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            call.status === 'ongoing' ? 'bg-green-600' : 
            call.status === 'ringing' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            {call.status}
          </span>
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {call.type === 'video' ? (
          <div className="h-full grid grid-cols-1 md:grid-cols-2 gap-2 p-2">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {!isVideoEnabled && '(Camera Off)'}
              </div>
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {currentParticipant?.username?.charAt(0).toUpperCase()}
                  </div>
                </div>
              )}
            </div>

            {/* Remote Videos */}
            {otherParticipants.map((participant) => (
              <div key={participant.userId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.username} {!participant.isVideoEnabled && '(Camera Off)'}
                </div>
                {!participant.isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                
                {/* Audio indicator */}
                <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                  participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
                }`} />
              </div>
            ))}
          </div>
        ) : (
          // Audio call view
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Current user */}
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                    {currentParticipant?.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-white font-medium">You</p>
                  <div className={`w-3 h-3 rounded-full mx-auto mt-2 ${
                    isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                </div>

                {/* Other participants */}
                {otherParticipants.map((participant) => (
                  <div key={participant.userId} className="text-center">
                    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                      {participant.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white font-medium">{participant.username}</p>
                    <div className={`w-3 h-3 rounded-full mx-auto mt-2 ${
                      participant.isAudioEnabled ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Audio toggle */}
          <button
            onClick={handleToggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            🎤
          </button>

          {/* Video toggle (only for video calls) */}
          {call.type === 'video' && (
            <button
              onClick={handleToggleVideo}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              📹
            </button>
          )}

          {/* Screen share */}
          {call.type === 'video' && (
            <button
              onClick={handleScreenShare}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isSharingScreen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              🖥️
            </button>
          )}

          {/* End call */}
          <button
            onClick={onEndCall}
            className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
          >
            📞
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

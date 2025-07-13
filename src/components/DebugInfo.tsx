import React from 'react';

interface DebugInfoProps {
  registrationStatus: any;
  systemStatus?: any;
}

const DebugInfo: React.FC<DebugInfoProps> = ({ registrationStatus, systemStatus }) => {
  const debugData = {
    environment: process.env.NODE_ENV || 'development',
    apiBaseUrl: '/api',
    wsUrl: 'wss://cryptocall.netlify.app',
    useHttps: true,
    userAgent: navigator.userAgent,
    location: window.location.href,
    timestamp: new Date().toISOString(),
    registrationStatus,
    registrationStatusSuccess: !!registrationStatus,
    systemStatus,
    systemStatusSuccess: !!systemStatus
  };

  return (
    <div className="debug-info">
      <h4>🔧 Debug Information</h4>
      <pre>{JSON.stringify(debugData, null, 2)}</pre>
    </div>
  );
};

export default DebugInfo;

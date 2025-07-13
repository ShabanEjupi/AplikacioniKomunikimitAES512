import React from 'react';
import { getRegistrationStatus, getSystemStatus } from '../api/index';

const ApiDiagnostics: React.FC = () => {
  const runDiagnostics = async () => {
    console.log('🔍 Running API Diagnostics...');
    try {
      const diagnostics = {
        currentUrl: window.location.href,
        apiBaseUrl: '/api',
        registrationStatus: await getRegistrationStatus(),
        systemStatus: await getSystemStatus(),
      };
      console.log('📊 Diagnostics Results:', diagnostics);
      alert('Diagnostics completed. Check console for details.');
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      alert('Diagnostics failed. Check console for details.');
    }
  };

  return (
    <div className="diagnostics-section">
      <h4>🔍 API Diagnostics</h4>
      <button 
        type="button" 
        className="btn btn-secondary"
        onClick={runDiagnostics}
      >
        Run API Diagnostics
      </button>
      <p className="hint">
        Tip: Open browser dev tools (F12) → Console tab to see detailed logs
      </p>
      <div className="url-info">
        <p><strong>Current URL:</strong> {window.location.href}</p>
        <p><strong>Expected API Base:</strong> /api</p>
      </div>
    </div>
  );
};

export default ApiDiagnostics;

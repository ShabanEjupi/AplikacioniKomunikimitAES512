import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../auth/authentication';
import { 
  getRegistrationStatus, 
  getSystemStatus, 
  RegistrationStatus, 
  SystemStatus 
} from '../api/index';
import '../styles/global.css';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    if (authService.isAuthenticated()) {
      navigate('/chat');
    }
    
    // Load system information
    loadSystemInfo();
  }, [navigate]);

  const loadSystemInfo = async () => {
    try {
      const [regStatus, sysStatus] = await Promise.all([
        getRegistrationStatus(),
        getSystemStatus()
      ]);
      setRegistrationStatus(regStatus);
      setSystemStatus(sysStatus);
    } catch (error) {
      console.error('Failed to load system info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        const response = await authService.login({ username, password });
        if (response.success) {
          setSuccess('Hyrja u krye me sukses!');
          navigate('/chat');
        } else {
          setError(response.message || 'Hyrja dështoi');
        }
      } else {
        const response = await authService.register({ username, password });
        if (response.success) {
          setSuccess('Regjistrimi u krye me sukses! Mund të hyni tani.');
          setIsLogin(true);
          setPassword('');
        } else {
          setError(response.message || 'Regjistrimi dështoi');
        }
      }
    } catch (error: any) {
      setError(error.message || (isLogin ? 'Hyrja dështoi' : 'Regjistrimi dështoi: Nuk u mor përgjigje nga serveri'));
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setUsername('testuser');
    setPassword('testpass123');
  };

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
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🔐 Crypto 512</h1>
          <p>{isLogin ? 'Hyni në llogarinë tuaj' : 'Krijoni një llogari të re'}</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            <div>
              <strong>{isLogin ? 'Hyrja dështoi' : 'Regjistrimi dështoi'}: </strong>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✅</span>
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Emri i përdoruesit</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Shkruani emrin tuaj"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Fjalëkalimi</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Shkruani fjalëkalimin"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
          >
            {isLoading ? '⏳ Duke procesuar...' : (isLogin ? 'Hyni' : 'Regjistrohu')}
          </button>
        </form>

        <div className="login-footer">
          <button 
            type="button" 
            className="btn-link" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
          >
            {isLogin ? 'Nuk keni llogari? Regjistrohuni' : 'Keni llogari? Hyni'}
          </button>
        </div>

        {/* Test Credentials Section */}
        <div className="test-credentials">
          <h3>🔧 Kredencialet për testim</h3>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={fillTestCredentials}
          >
            Plotëso kredencialet e testimit
          </button>
          <div className="credentials-info">
            <p><strong>Emri i përdoruesit:</strong> testuser</p>
            <p><strong>Fjalëkalimi:</strong> testpass123</p>
            {registrationStatus?.availableUsers && (
              <p><strong>Përdorues të disponueshëm:</strong> {registrationStatus.availableUsers.join(', ')}</p>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="debug-section">
          <button 
            type="button" 
            className="btn-link"
            onClick={() => setShowDebug(!showDebug)}
          >
            🔧 {showDebug ? 'Fshih' : 'Shfaq'} Debug Information
          </button>
          
          {showDebug && (
            <div className="debug-info">
              <h4>🔧 Debug Information</h4>
              <pre>{JSON.stringify({
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
              }, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* API Diagnostics */}
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
      </div>
    </div>
  );
};

export default Login;

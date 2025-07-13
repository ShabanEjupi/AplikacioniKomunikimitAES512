import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Chat from './components/Chat';
import ChatNew from './components/ChatNew';
import { getCurrentUser, isAuthenticated } from './api/index';
import SessionManager from './auth/session';
import './styles/global.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check both SessionManager and localStorage for compatibility
        const sessionUser = SessionManager.getCurrentUser();
        const sessionToken = SessionManager.getAuthToken();
        const localUser = getCurrentUser();
        const localAuth = isAuthenticated();
        
        console.log('🔍 Auth Check:', { 
          sessionUser: !!sessionUser, 
          sessionToken: !!sessionToken, 
          localUser: !!localUser, 
          localAuth 
        });
        
        // User is authenticated if they have both user data and token in either system
        const authenticated = !!(((sessionUser && sessionToken) || (localUser && localAuth)));
        setIsAuth(authenticated);
        setAuthChecked(true);
        
        if (!authenticated) {
          console.log('❌ Authentication failed - redirecting to login');
        } else {
          console.log('✅ Authentication successful');
        }
      } catch (error) {
        console.error('🚨 Auth check error:', error);
        setIsAuth(false);
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);
  
  if (!authChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        🔐 Checking authentication...
      </div>
    );
  }
  
  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (for login page)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      try {
        const sessionUser = SessionManager.getCurrentUser();
        const sessionToken = SessionManager.getAuthToken();
        const localUser = getCurrentUser();
        const localAuth = isAuthenticated();
        
        const authenticated = !!(((sessionUser && sessionToken) || (localUser && localAuth)));
        setIsAuth(authenticated);
        setAuthChecked(true);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuth(false);
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, []);
  
  if (!authChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        🔐 Checking authentication...
      </div>
    );
  }
  
  // If user is already authenticated, redirect to chat
  return isAuth ? <Navigate to="/chat" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatNew /></ProtectedRoute>} />
        <Route path="/chat-old" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
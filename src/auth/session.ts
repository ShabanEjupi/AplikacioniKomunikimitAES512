// Session Manager for handling user sessions with tab isolation
interface User {
  username: string;
  userId: string;
}

class SessionManager {
  private static instance: SessionManager;
  private tabId: string;
  
  private constructor() {
    // Generate unique tab ID for session isolation
    this.tabId = this.generateTabId();
    
    // Listen for storage changes to detect conflicts
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Store tab info
    this.storeTabInfo();
  }
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  private generateTabId(): string {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private storeTabInfo(): void {
    const tabInfo = {
      id: this.tabId,
      timestamp: Date.now(),
      url: window.location.href
    };
    sessionStorage.setItem('tabInfo', JSON.stringify(tabInfo));
  }
  
  private handleStorageChange(e: StorageEvent): void {
    if (e.key === 'currentUser' || e.key === 'authToken') {
      // Check if this change conflicts with current session
      const currentUser = this.getCurrentUser();
      if (currentUser && e.newValue) {
        const newUser = JSON.parse(e.newValue);
        if (currentUser.username !== newUser.username) {
          // Another tab logged in with different user
          console.warn('Session conflict detected - another user logged in');
          this.handleSessionConflict();
        }
      }
    }
  }
  
  private handleSessionConflict(): void {
    // Show warning to user about session conflict
    if (window.confirm('Another user has logged in from a different tab. Would you like to continue with that session?')) {
      window.location.reload();
    } else {
      this.clearSession();
      window.location.href = '/login';
    }
  }
  
  getTabId(): string {
    return this.tabId;
  }
  
  setCurrentUser(user: User): void {
    const userData = {
      ...user,
      tabId: this.tabId,
      loginTime: Date.now()
    };
    localStorage.setItem('currentUser', JSON.stringify(userData));
    sessionStorage.setItem('currentUser', JSON.stringify(user));
  }
  
  getCurrentUser(): User | null {
    // Prefer session storage for tab isolation
    let userStr = sessionStorage.getItem('currentUser');
    if (!userStr) {
      userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const userData = JSON.parse(userStr);
        // Check if this session belongs to current tab
        if (userData.tabId && userData.tabId !== this.tabId) {
          // Session belongs to different tab
          return null;
        }
        // Store in session storage for faster access
        sessionStorage.setItem('currentUser', JSON.stringify({
          username: userData.username,
          userId: userData.userId
        }));
      }
    }
    return userStr ? JSON.parse(userStr) : null;
  }
  
  setAuthToken(token: string): void {
    const tokenData = {
      token,
      tabId: this.tabId,
      timestamp: Date.now()
    };
    localStorage.setItem('authToken', JSON.stringify(tokenData));
    sessionStorage.setItem('authToken', token);
  }
  
  getAuthToken(): string | null {
    // Prefer session storage
    let token = sessionStorage.getItem('authToken');
    if (!token) {
      const tokenStr = localStorage.getItem('authToken');
      if (tokenStr) {
        try {
          const tokenData = JSON.parse(tokenStr);
          if (tokenData.tabId && tokenData.tabId !== this.tabId) {
            // Token belongs to different tab
            return null;
          }
          token = tokenData.token || tokenStr;
          if (token) {
            sessionStorage.setItem('authToken', token);
          }
        } catch {
          // Fallback for old token format
          token = tokenStr;
        }
      }
    }
    return token;
  }
  
  isAuthenticated(): boolean {
    return !!this.getAuthToken() && !!this.getCurrentUser();
  }
  
  clearSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('tabInfo');
  }
}

export default SessionManager.getInstance();

// Session Manager for handling user sessions
interface User {
  username: string;
  userId: string;
}

class SessionManager {
  private static instance: SessionManager;
  
  private constructor() {}
  
  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }
  
  setCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  setAuthToken(token: string): void {
    localStorage.setItem('authToken', token);
  }
  
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
  
  isAuthenticated(): boolean {
    return !!this.getAuthToken() && !!this.getCurrentUser();
  }
  
  clearSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
  }
}

export default SessionManager.getInstance();

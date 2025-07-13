import config from '../config/index';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: {
    username: string;
    userId: string;
  };
  token?: string;
  message?: string;
}

export class AuthenticationService {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    this.apiUrl = apiUrl || config.API_BASE_URL;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login with:', { username: credentials.username });
      console.log('🌐 API URL:', `${this.apiUrl}/login`);
      
      const response = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Login failed:', errorText);
        throw new Error(`Login failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Login successful:', data);
      
      // Store token if provided
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }

      return data;
    } catch (error: any) {
      console.error('🚨 Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  async register(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('📝 Attempting registration with:', { username: credentials.username });
      console.log('🌐 API URL:', `${this.apiUrl}/register`);
      
      const response = await fetch(`${this.apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Registration failed:', errorText);
        throw new Error(`Registration failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Registration successful:', data);
      
      return data;
    } catch (error: any) {
      console.error('🚨 Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }
}

export default new AuthenticationService();

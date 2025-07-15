// Environment configuration for client-side
interface Config {
  API_BASE_URL: string;
  WS_URL: string;
  USE_HTTPS: boolean;
  POLLING_INTERVAL: number;
  MAX_FILE_SIZE: number;
  ENABLE_DEBUG: boolean;
}

const config: Record<string, Config> = {
  development: {
    API_BASE_URL: 'http://localhost:3001/.netlify/functions', // Local server with functions
    WS_URL: 'http://localhost:3001',
    USE_HTTPS: false,
    POLLING_INTERVAL: 2000,
    MAX_FILE_SIZE: 52428800, // 50MB
    ENABLE_DEBUG: true,
  },
  production: {
    API_BASE_URL: '/api', // Use redirects from netlify.toml for cleaner URLs
    WS_URL: 'wss://cryptocall.netlify.app', // WebSocket not available in functions, will fallback
    USE_HTTPS: true,
    POLLING_INTERVAL: 2000,
    MAX_FILE_SIZE: 52428800, // 50MB
    ENABLE_DEBUG: false,
  },
  test: {
    API_BASE_URL: 'http://localhost:3001/.netlify/functions', // Local server with functions
    WS_URL: 'http://localhost:3001',
    USE_HTTPS: false,
    POLLING_INTERVAL: 1000, // Faster polling for tests
    MAX_FILE_SIZE: 10485760, // 10MB for tests
    ENABLE_DEBUG: true,
  }
};

// Detect environment based on multiple factors
const getEnvironment = (): string => {
  // Check React environment variables first
  if (process.env.REACT_APP_NODE_ENV) {
    return process.env.REACT_APP_NODE_ENV;
  }
  
  // Check Node environment
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  // Check if running on localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                       hostname === '127.0.0.1' ||
                       hostname.includes('localhost');
    
    // If not localhost and not explicitly development, assume production
    return isLocalhost ? 'development' : 'production';
  }
  
  // Default to development for server-side rendering
  return 'development';
};

const environment = getEnvironment();

// Additional debug logging
console.log('🔧 Environment detection:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV,
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side',
  selected: environment,
  availableConfigs: Object.keys(config),
  selectedConfig: config[environment]
});

// Validate configuration
if (!config[environment]) {
  console.error('❌ Invalid environment configuration!', environment);
  console.log('Available environments:', Object.keys(config));
}

export default config[environment] as Config;

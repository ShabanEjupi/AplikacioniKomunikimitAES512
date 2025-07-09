// Environment configuration for client-side
interface Config {
  API_BASE_URL: string;
  WS_URL: string;
  USE_HTTPS: boolean;
}

const config: Record<string, Config> = {
  development: {
    API_BASE_URL: 'http://localhost:3001/api',
    WS_URL: 'http://localhost:3001',
    USE_HTTPS: false,
  },
  production: {
    API_BASE_URL: 'https://cryptocall.netlify.app/api', // Use full domain for production
    WS_URL: 'wss://cryptocall.netlify.app', // WebSocket not available in functions, will fallback
    USE_HTTPS: true,
  },
  test: {
    API_BASE_URL: 'http://localhost:3001/api',
    WS_URL: 'http://localhost:3001',
    USE_HTTPS: false,
  }
};

// Force development mode when running locally (client-side detection)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const environment = (process.env.NODE_ENV === 'production' && isLocalhost) 
  ? 'development' 
  : (process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || 'development');

// Additional debug logging
console.log('🔧 Environment detection:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_NODE_ENV: process.env.REACT_APP_NODE_ENV,
  isLocalhost: isLocalhost,
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

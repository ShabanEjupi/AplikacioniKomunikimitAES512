// Environment configuration for client-side
interface Config {
  API_BASE_URL: string;
  WS_URL: string;
  USE_HTTPS: boolean;
}

const config: Record<string, Config> = {
  development: {
    API_BASE_URL: 'https://localhost:3001/api',
    WS_URL: 'https://localhost:3001',
    USE_HTTPS: true,
  },
  production: {
    API_BASE_URL: 'https://your-app-name.herokuapp.com/api', // We'll update this after deployment
    WS_URL: 'https://your-app-name.herokuapp.com',
    USE_HTTPS: true,
  },
  test: {
    API_BASE_URL: 'http://localhost:3001/api',
    WS_URL: 'http://localhost:3001',
    USE_HTTPS: false,
  }
};

const environment = process.env.NODE_ENV || 'development';

export default config[environment] as Config;

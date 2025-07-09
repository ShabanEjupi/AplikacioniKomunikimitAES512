// Simple configuration for client
const config = {
  production: {
    apiUrl: '/.netlify/functions',
    appName: 'Crypto 512'
  },
  development: {
    apiUrl: 'http://localhost:8888/.netlify/functions', 
    appName: 'Crypto 512 Dev'
  }
};

const environment = process.env.NODE_ENV || 'development';
export default config[environment as keyof typeof config];

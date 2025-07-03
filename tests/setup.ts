// Skedar i konfigurimit të testeve
// Ky skedar ekzekutohet para secilit skedar testi

// Variablat e simuluara të mjedisit
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e';
process.env.SESSION_SECRET = 'test-session-secret-a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2';
process.env.DB_URI = 'mongodb://localhost:27017/secure-comms-test';
process.env.PORT = '3001';
process.env.ALERT_THRESHOLD = '3';
process.env.TLS_KEY = 'certs/test-key.pem';
process.env.TLS_CERT = 'certs/test-cert.pem';


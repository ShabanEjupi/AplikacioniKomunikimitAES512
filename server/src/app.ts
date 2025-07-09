import express from 'express';
import { json } from 'body-parser';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { UserAuthentication } from './auth/authentication';
import SessionManager from './auth/session'; // Fix: default import
import router from './api/routes'; // Fix: default import
import { startServer } from './crypto/tls'; // Fix: use existing export
import { monitorAlerts } from './alerts/monitor';
import config from './config/index'; // Fix: default import
import { SESSION_SECRET } from './constants';

const app = express();
const PORT = config.port || 3000;

// Middleware
app.use(json());

// Vërtetimi i përdoruesit dhe menaxhimi i sesioneve
const userAuth = new UserAuthentication();
const sessionManager = new SessionManager(SESSION_SECRET); // Use SESSION_SECRET

// Konfigurimi i Tls
const tlsOptions = {
    key: readFileSync('./certs/key.pem'),
    cert: readFileSync('./certs/cert.pem'),
};

// Rruget
app.use('/api', router);

// Nisja e serverit
const server = createServer(tlsOptions, app);
server.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});

// Monitorimi i alarmeve
monitorAlerts();


const express = require('express');
const cors = require('cors');
const path = require('path');

// Import the functions
const loginFunction = require('./netlify/functions/login.js');
const registerFunction = require('./netlify/functions/register.js');
const usersFunction = require('./netlify/functions/users.js');
const messagesFunction = require('./netlify/functions/messages.js');
const statusFunction = require('./netlify/functions/registration-status.js');

const app = express();
const port = 8888;

// Enable CORS for all routes
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Function wrapper to make Netlify functions work with Express
const wrapFunction = (handler) => {
    return async (req, res) => {
        const event = {
            httpMethod: req.method,
            body: req.method === 'POST' ? JSON.stringify(req.body) : null,
            headers: req.headers,
            path: req.path,
            queryStringParameters: req.query
        };
        
        try {
            const result = await handler(event, {});
            res.status(result.statusCode || 200);
            
            // Set headers
            if (result.headers) {
                Object.keys(result.headers).forEach(key => {
                    res.set(key, result.headers[key]);
                });
            }
            
            res.send(result.body);
        } catch (error) {
            console.error('Function error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};

// API routes - directly mapping function names
app.post('/.netlify/functions/login', wrapFunction(loginFunction.handler));
app.post('/.netlify/functions/register', wrapFunction(registerFunction.handler));
app.get('/.netlify/functions/users', wrapFunction(usersFunction.handler));
app.post('/.netlify/functions/users', wrapFunction(usersFunction.handler));
app.get('/.netlify/functions/messages', wrapFunction(messagesFunction.handler));
app.post('/.netlify/functions/messages', wrapFunction(messagesFunction.handler));
app.get('/.netlify/functions/registration-status', wrapFunction(statusFunction.handler));

// Handle all other requests by serving the React app
app.get('*', (req, res) => {
    if (req.path.startsWith('/.netlify/')) {
        return res.status(404).json({ error: 'Function not found' });
    }
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📡 Functions available at http://localhost:${port}/.netlify/functions/`);
    console.log(`🔐 Login endpoint: http://localhost:${port}/.netlify/functions/login`);
});

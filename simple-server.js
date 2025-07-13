const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Import the functions
const loginFunction = require('./netlify/functions/login.js');
const registerFunction = require('./netlify/functions/register.js');
const usersFunction = require('./netlify/functions/users.js');
const messagesFunction = require('./netlify/functions/messages.js');
const statusFunction = require('./netlify/functions/registration-status.js');

const port = 3001;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

// Function handler mapping
const functionHandlers = {
    '/login': loginFunction.handler,
    '/register': registerFunction.handler,
    '/users': usersFunction.handler,
    '/messages': messagesFunction.handler,
    '/registration-status': statusFunction.handler
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle Netlify functions
    if (pathname.startsWith('/.netlify/functions/')) {
        const functionName = pathname.replace('/.netlify/functions/', '');
        const handler = functionHandlers['/' + functionName];
        
        if (handler) {
            let body = '';
            if (req.method === 'POST') {
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', async () => {
                    await handleFunction(handler, req, res, body, parsedUrl.query);
                });
            } else {
                await handleFunction(handler, req, res, '', parsedUrl.query);
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Function not found' }));
        }
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, 'build', pathname === '/' ? 'index.html' : pathname.substring(1));
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        // For client-side routing, serve index.html for non-API routes
        filePath = path.join(__dirname, 'build', 'index.html');
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

async function handleFunction(handler, req, res, body, query) {
    const event = {
        httpMethod: req.method,
        body: body || null,
        headers: req.headers,
        path: req.url,
        queryStringParameters: query || {}
    };

    try {
        console.log(`🔧 Handling function request: ${req.method} ${req.url}`);
        const result = await handler(event, {});
        
        res.writeHead(result.statusCode || 200, {
            'Content-Type': 'application/json',
            ...result.headers
        });
        
        res.end(result.body);
    } catch (error) {
        console.error('Function error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
    }
}

server.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📡 Functions available at http://localhost:${port}/.netlify/functions/`);
    console.log(`🔐 Login endpoint: http://localhost:${port}/.netlify/functions/login`);
});

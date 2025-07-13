# Crypto 512 - Secure Communication App

A simplified secure communication platform deployed on Netlify.

## 🚀 Live Demo

Visit: [cryptocall.netlify.app](https://cryptocall.netlify.app)

## 🏠 Localhost Development

### Quick Start Options

#### Option 1: Use the startup scripts
```bash
# Windows Batch File
start-development.bat

# PowerShell
.\start-development.ps1
```

#### Option 2: Manual startup
```bash
# Terminal 1: Start backend server (port 3001)
node simple-server.js

# Terminal 2: Start React frontend (port 3000)  
npm start
```

#### Option 3: Single command (requires concurrently package)
```bash
npm run dev-local
```

### 🔧 Troubleshooting

#### "No users available and registration is disabled"
This error occurs when the backend server is not running. Make sure:

1. Backend server is running on port 3001: `node simple-server.js`
2. You can test the API: `http://localhost:3001/.netlify/functions/registration-status`
3. The client should show test users available

#### Default Test Users
- **Username:** testuser, **Password:** testpass123  
- **Username:** alice, **Password:** alice123
- **Username:** bob, **Password:** bob123
- **Username:** charlie, **Password:** charlie123

#### Ports
- **Frontend (React):** http://localhost:3000
- **Backend (API):** http://localhost:3001  
- **API Functions:** http://localhost:3001/.netlify/functions/

## 📋 Features

- **User Authentication**: Simple register/login system
- **Real-time Chat**: Instant messaging with other users
- **Secure Communication**: Basic encryption for messages
- **Responsive Design**: Works on desktop and mobile
- **Netlify Functions**: Serverless backend for authentication and messaging

## 🔧 Technology Stack

### Frontend
- React 18 with TypeScript
- Modern CSS with gradient designs
- Responsive layout

### Backend (Netlify Functions)
- Simple user authentication
- In-memory message storage
- CORS-enabled API endpoints

## 🛠️ Development

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/ShabanEjupi/AplikacioniKomunikimiAES512.git
cd secure-comms1
```

2. Install client dependencies:
```bash
cd client
npm install --legacy-peer-deps
```

3. Start development server:
```bash
npm start
```

### Testing Netlify Functions Locally

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Run local development:
```bash
netlify dev
```

## 📁 Project Structure

```
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # React components (Login, Chat)
│   │   ├── api/          # API functions for backend communication
│   │   ├── config/       # Configuration settings
│   │   └── styles/       # CSS styles
│   └── package.json
├── netlify/
│   └── functions/        # Serverless functions
│       ├── login.js      # User authentication
│       ├── register.js   # User registration
│       ├── messages.js   # Message handling
│       └── users.js      # User management
├── netlify.toml          # Netlify configuration
└── package.json
```

## 🎯 Test Users

For testing purposes, the following users are pre-configured:

- **Username**: `testuser`, **Password**: `testpass123`
- **Username**: `alice`, **Password**: `alice123`

## 🔒 Security Notes

- This is a demo application with in-memory storage
- In production, use a proper database and stronger authentication
- Messages are stored temporarily and reset on function cold starts
- User passwords are hashed using SHA-256

## 🚢 Deployment

The app is automatically deployed to Netlify when changes are pushed to the main branch.

### Manual Deployment

1. Build the client:
```bash
cd client
npm run build
```

2. Deploy to Netlify:
```bash
netlify deploy --prod --dir=client/build
```

## 📝 API Endpoints

- `POST /.netlify/functions/register` - Register new user
- `POST /.netlify/functions/login` - User login
- `GET /.netlify/functions/messages` - Get all messages
- `POST /.netlify/functions/messages` - Send new message
- `GET /.netlify/functions/users` - Get user list

## 🐛 Known Issues

- Messages are stored in memory and reset on function restarts
- No real-time updates (uses polling every 3 seconds)
- No file upload support in this simplified version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

This project is for educational purposes.

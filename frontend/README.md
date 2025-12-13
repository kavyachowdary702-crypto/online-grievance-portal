# Frontend - React Application

## Overview
This is the frontend application for ResolveIT, built with React 18.2.

## Technologies
- React 18.2
- React Router 6
- Axios
- Context API for state management

## Running Locally

### Prerequisites
- Node.js 16+ and npm

### Install Dependencies
```bash
npm install
```

### Start Development Server
```bash
npm start
```

Application opens on: http://localhost:3000

### Build for Production
```bash
npm run build
```

## Project Structure
```
src/
├── components/       # Reusable components (Navbar)
├── context/          # Auth context for authentication
├── pages/            # Page components (Home, Login, etc.)
├── services/         # API service layer (Axios)
├── App.js            # Main app with routing
└── index.js          # Entry point
```

## Features
- JWT authentication
- Protected routes
- Anonymous complaint submission
- User dashboard
- Admin dashboard
- File upload support
- Real-time complaint tracking

## API Configuration
Backend API URL is configured in `src/services/api.js`:
```javascript
const API_URL = 'http://localhost:8080/api';
```

Proxy is configured in `package.json` for development.

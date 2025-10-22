# 🚀 HealthHub Backend - Quick Start Guide

Get your HealthHub backend API running in minutes!

## ⚡ Quick Setup (3 Steps)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Initialize Database
```bash
npm run init-db
```

### 3. Start Server
```bash
npm start
```

That's it! Your API is now running at `http://localhost:3001`

## 🧪 Test Your API

### Health Check
```bash
curl http://localhost:3001/health
```

### Get Remedies
```bash
curl http://localhost:3001/api/remedies
```

### Get Featured Remedies
```bash
curl http://localhost:3001/api/remedies/featured
```

### Search Remedies
```bash
curl "http://localhost:3001/api/remedies?search=honey&category=Respiratory"
```

## 🌐 Browser Testing

1. Open your browser
2. Go to `http://localhost:3001/health`
3. You should see: `{"status":"OK","timestamp":"...","uptime":...}`

## 📱 Connect Your Frontend

Update your frontend API calls to use:
```javascript
const API_BASE_URL = 'http://localhost:3001/api';

// Example: Fetch remedies
fetch(`${API_BASE_URL}/remedies`)
  .then(response => response.json())
  .then(data => console.log(data));
```

## 🔧 Development Mode

For auto-reload during development:
```bash
npm run dev
```

## 📊 Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Server health check |
| `GET /api/remedies` | All remedies with filtering |
| `GET /api/remedies/featured` | High-rated remedies |
| `GET /api/first-aid` | First aid instructions |
| `GET /api/symptoms` | Symptom database |
| `POST /api/symptoms/analyze` | Analyze symptoms |
| `POST /api/users/register` | Register user |
| `POST /api/users/login` | Login user |

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

### Database Issues
```bash
# Reinitialize database
npm run init-db
```

### Permission Issues (Windows)
Run as Administrator or use Git Bash

## 🎯 Next Steps

1. **Test with Postman**: Import the API endpoints
2. **Connect Frontend**: Update your frontend API calls
3. **Add Authentication**: Register users and use JWT tokens
4. **Deploy**: Use PM2 or Docker for production

## 📚 Full Documentation

See `README.md` for complete documentation, API details, and advanced configuration.

---

**Need help?** Check the troubleshooting section or review the server logs for error details.

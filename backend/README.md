# HealthHub Backend API

A comprehensive backend API for HealthHub - a natural remedies and first aid application. Built with Node.js, Express, and SQLite.

## 🚀 Features

- **Natural Remedies API**: Search, filter, and retrieve home remedies
- **First Aid Instructions**: Emergency procedures and step-by-step guides
- **AI Symptom Checker**: Analyze symptoms and get recommendations
- **User Management**: Registration, authentication, and profiles
- **Emergency Tools**: Contact management and medical information
- **Search & Favorites**: Save and track user preferences
- **RESTful API**: Clean, well-documented endpoints

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🛠️ Installation

1. **Clone or navigate to the backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize the database**
   ```bash
   npm run init-db
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Or start the production server**
   ```bash
   npm start
   ```

The API will be available at `http://localhost:3001`

## 📊 API Endpoints

### Health Check
- `GET /health` - Server health status

### Remedies
- `GET /api/remedies` - Get all remedies (with filtering)
- `GET /api/remedies/:id` - Get specific remedy
- `GET /api/remedies/categories/list` - Get all categories
- `GET /api/remedies/featured` - Get featured remedies
- `GET /api/remedies/search/suggestions` - Get search suggestions

### First Aid
- `GET /api/first-aid` - Get all first aid instructions
- `GET /api/first-aid/:id` - Get specific instruction
- `GET /api/first-aid/categories/list` - Get all categories
- `GET /api/first-aid/emergency` - Get emergency procedures only
- `GET /api/first-aid/search/suggestions` - Get search suggestions

### Symptoms
- `GET /api/symptoms` - Get all symptoms
- `GET /api/symptoms/:id` - Get specific symptom
- `POST /api/symptoms/analyze` - Analyze multiple symptoms
- `GET /api/symptoms/search/suggestions` - Get search suggestions
- `GET /api/symptoms/severity/list` - Get severity levels

### Users (Authentication Required)
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `POST /api/users/favorites` - Add to favorites
- `DELETE /api/users/favorites` - Remove from favorites

### Emergency (Authentication Required)
- `GET /api/emergency/contacts` - Get emergency contacts
- `POST /api/emergency/contacts` - Add emergency contact
- `PUT /api/emergency/contacts/:id` - Update contact
- `DELETE /api/emergency/contacts/:id` - Delete contact
- `GET /api/emergency/medical-info` - Get medical info
- `POST /api/emergency/medical-info` - Save medical info
- `GET /api/emergency/search-history` - Get search history
- `GET /api/emergency/quick-access` - Get quick access data

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_PATH=./database/healthhub.db

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
BCRYPT_ROUNDS=12

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,file://

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# API Configuration
API_VERSION=v1
```

## 📝 Usage Examples

### Get All Remedies
```bash
curl http://localhost:3001/api/remedies
```

### Search Remedies
```bash
curl "http://localhost:3001/api/remedies?search=honey&category=Respiratory"
```

### Get Featured Remedies
```bash
curl http://localhost:3001/api/remedies/featured
```

### Register a User
```bash
curl -X POST http://localhost:3001/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "full_name": "Test User"
  }'
```

### Login User
```bash
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### Analyze Symptoms
```bash
curl -X POST http://localhost:3001/api/symptoms/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": ["headache", "fever"]
  }'
```

### Get Emergency Contacts (Requires Authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/emergency/contacts
```

## 🧪 Testing

### Using Browser
1. Open your browser
2. Navigate to `http://localhost:3001/health`
3. You should see the server status

### Using Postman
1. Import the API collection (if available)
2. Set base URL to `http://localhost:3001`
3. Test various endpoints

### Using cURL
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test remedies endpoint
curl http://localhost:3001/api/remedies

# Test with query parameters
curl "http://localhost:3001/api/remedies?category=Immunity&limit=5"
```

## 🗄️ Database Schema

The API uses SQLite with the following main tables:

- **users**: User accounts and authentication
- **remedies**: Natural home remedies with ingredients and instructions
- **first_aid**: First aid procedures and emergency instructions
- **symptoms**: Symptom database for AI analysis
- **user_favorites**: User's saved remedies and first aid instructions
- **emergency_contacts**: User's emergency contact information
- **user_medical_info**: User's medical information
- **search_history**: User's search history

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Prevents API abuse
- **CORS Configuration**: Cross-origin request security
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: Parameterized queries

## 📱 Frontend Integration

To connect your frontend to this backend:

1. **Update API base URL** in your frontend to `http://localhost:3001/api`
2. **Handle CORS** - The backend is configured for common frontend URLs
3. **Authentication** - Include JWT tokens in Authorization headers
4. **Error Handling** - All responses follow a consistent format

### Example Frontend Integration

```javascript
// API base configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Fetch remedies
async function fetchRemedies() {
  try {
    const response = await fetch(`${API_BASE_URL}/remedies`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Remedies:', data.data);
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Authenticated request
async function fetchUserProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
}
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up proper database backup

### Docker (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Process Management
Consider using PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name healthhub-api
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find and kill process using port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Database initialization fails**
   ```bash
   # Ensure database directory exists
   mkdir -p database
   npm run init-db
   ```

3. **CORS errors**
   - Check CORS configuration in server.js
   - Ensure frontend URL is in allowed origins

4. **Authentication issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure Authorization header format: `Bearer <token>`

### Logs
- Server logs are displayed in the console
- Use `morgan` middleware for HTTP request logging
- Check database connection status in startup logs

## 📚 API Documentation

### Response Format
All API responses follow this format:

```json
{
  "success": true|false,
  "message": "Description of the result",
  "data": {...}, // Present on success
  "pagination": {...}, // Present for paginated endpoints
  "error": "..." // Present on error in development
}
```

### Error Codes
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (expired token)
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs for error details
4. Ensure all dependencies are installed correctly

---

**Happy coding! 🎉**

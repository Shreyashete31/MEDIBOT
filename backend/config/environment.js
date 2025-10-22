require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database Configuration
  database: {
    path: process.env.DB_PATH || './database/healthhub.db'
  },
  
  // Security Configuration
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // CORS Configuration
  cors: {
    origins: process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'file://']
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // API Configuration
  api: {
    version: process.env.API_VERSION || 'v1'
  }
};

module.exports = config;

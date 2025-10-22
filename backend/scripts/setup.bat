@echo off
REM HealthHub Backend Setup Script for Windows
REM This script sets up the HealthHub backend API

echo.
echo 🚀 HealthHub Backend Setup Script
echo ==================================

REM Check if Node.js is installed
echo ℹ️  Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16 or higher.
    echo ℹ️  Download from: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js is installed: %NODE_VERSION%

REM Check if npm is installed
echo ℹ️  Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm is installed: %NPM_VERSION%

echo.
echo ℹ️  Installing dependencies...
if not exist package.json (
    echo ❌ package.json not found. Are you in the correct directory?
    pause
    exit /b 1
)

npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed successfully

echo.
echo ℹ️  Setting up environment configuration...
if not exist .env (
    echo # Server Configuration > .env
    echo PORT=3001 >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # Database Configuration >> .env
    echo DB_PATH=./database/healthhub.db >> .env
    echo. >> .env
    echo # Security >> .env
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production >> .env
    echo BCRYPT_ROUNDS=12 >> .env
    echo. >> .env
    echo # CORS Origins (comma-separated) >> .env
    echo CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,file:// >> .env
    echo. >> .env
    echo # Rate Limiting >> .env
    echo RATE_LIMIT_WINDOW_MS=900000 >> .env
    echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
    echo. >> .env
    echo # API Configuration >> .env
    echo API_VERSION=v1 >> .env
    
    echo ✅ Created .env file with default configuration
    echo ⚠️  Please review and update the .env file as needed
) else (
    echo ✅ .env file already exists
)

echo.
echo ℹ️  Initializing database...
if not exist scripts\init-database.js (
    echo ❌ Database initialization script not found
    pause
    exit /b 1
)

npm run init-db
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize database
    pause
    exit /b 1
)
echo ✅ Database initialized successfully

echo.
echo ✅ Setup completed successfully!
echo.
echo ℹ️  Next steps:
echo   1. Start the server: npm start
echo   2. Or start in development mode: npm run dev
echo   3. Test the API: http://localhost:3001/health
echo   4. View API documentation: http://localhost:3001/api
echo.
echo ℹ️  Useful commands:
echo   • npm start          - Start production server
echo   • npm run dev        - Start development server with auto-reload
echo   • npm run init-db    - Reinitialize database
echo   • npm test           - Run tests
echo.

set /p START_SERVER="Would you like to start the server now? (y/n): "
if /i "%START_SERVER%"=="y" (
    echo ℹ️  Starting server...
    npm start
) else (
    echo ℹ️  You can start the server later with: npm start
)

pause

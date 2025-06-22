@echo off
echo ============================================
echo AI Discuss - Setup and Start Script
echo ============================================
echo.

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Dependencies installed successfully!
echo.
echo Starting development server...
echo The application will open at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

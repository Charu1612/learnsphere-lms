@echo off
REM LearnSphere Complete Startup Script
REM This script starts both backend and frontend servers

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║         LEARNSPHERE PLATFORM - COMPLETE STARTUP               ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd /d "c:\Users\dsdha\Downloads\LearnSphere-SaaS\LearnSphere-SaaS"

echo Setting DATABASE_URL environment variable...
set DATABASE_URL=postgresql://postgres:password@localhost:5432/learnsphere
echo DATABASE_URL=%DATABASE_URL%
echo.

echo ═════════════════════════════════════════════════════════════════
echo Step 1: Initializing Database
echo ═════════════════════════════════════════════════════════════════
echo.
.\.venv\Scripts\python.exe backend/init_db.py
echo.

echo ═════════════════════════════════════════════════════════════════
echo Step 2: Starting Backend Server (Port 8000)
echo ═════════════════════════════════════════════════════════════════
echo.
start "Backend Server" cmd /k ".\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000"
echo ✓ Backend server window opened
echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak
echo.

echo ═════════════════════════════════════════════════════════════════
echo Step 3: Starting Frontend Server (Port 5000)
echo ═════════════════════════════════════════════════════════════════
echo.
cd frontend
start "Frontend Server" cmd /k "npm run dev"
echo ✓ Frontend server window opened
echo Waiting 3 seconds for frontend to start...
timeout /t 3 /nobreak
echo.

cd ..

echo ═════════════════════════════════════════════════════════════════
echo ✅ PLATFORM STARTUP COMPLETE
echo ═════════════════════════════════════════════════════════════════
echo.
echo 🌐 OPEN IN BROWSER:
echo.
echo    http://localhost:5000
echo.
echo 🔐 Test Credentials:
echo.
echo    Admin:
echo    Email: admin@learnsphere.com
echo    Password: admin123
echo.
echo    Learner:
echo    Email: learner@learnsphere.com
echo    Password: learner123
echo.
echo ═════════════════════════════════════════════════════════════════
echo.
pause

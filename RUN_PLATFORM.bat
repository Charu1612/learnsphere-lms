@echo off
REM LearnSphere Platform - Complete Startup Script
REM This script will run backend and frontend with proper logging

setlocal enabledelayedexpansion

set WORKSPACE_ROOT=c:\Users\dsdha\Downloads\LearnSphere-SaaS\LearnSphere-SaaS
set DATABASE_URL=postgresql://postgres:password@localhost:5432/learnsphere

echo.
echo ========================================
echo   LearnSphere Platform - Complete Run
echo ========================================
echo.

REM Check PostgreSQL
echo Checking PostgreSQL status...
timeout /t 2 /nobreak > nul

REM Set environment variable
set DATABASE_URL=postgresql://postgres:password@localhost:5432/learnsphere
echo Database URL: %DATABASE_URL%
echo.

REM Initialize Database
echo Initializing database schema...
cd /d "%WORKSPACE_ROOT%"
call .\.venv\Scripts\python.exe backend/init_db.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Database initialization failed!
    echo Please ensure:
    echo 1. PostgreSQL is running and accessible
    echo 2. You can create a database named 'learnsphere'
    echo 3. Connection string is correct: %DATABASE_URL%
    echo.
    pause
    exit /b 1
)

echo.
echo Database initialized successfully!
echo.

echo ========================================
echo   STARTUP INSTRUCTIONS
echo ========================================
echo.
echo The backend and frontend are ready to start!
echo.
echo STEP 1: Open a NEW Command Prompt window and run:
echo.
echo    cd "%WORKSPACE_ROOT%"
echo    set DATABASE_URL=%DATABASE_URL%
echo    .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
echo.
echo This will start the Backend API at http://localhost:8000
echo.
echo ========================================
echo.
echo STEP 2: Open ANOTHER NEW Command Prompt window and run:
echo.
echo    cd "%WORKSPACE_ROOT%\frontend"
echo    npm run dev
echo.
echo This will start the Frontend at http://localhost:5000
echo.
echo ========================================
echo.
echo Once both servers are running:
echo.
echo 1. Open http://localhost:5000 in your browser
echo 2. Login with:
echo    - Email: admin@learnsphere.com
echo    - Password: admin123
echo.
echo 3. Or signup as a new user
echo.
echo Features available:
echo   - Admin Panel: Manage courses (active/inactive), users, roles
echo   - Instructor Dashboard: Create/edit courses
echo   - My Courses: View learning progress and course details
echo   - Quiz System: Complete quizzes with scoring
echo.
echo ========================================
echo.

pause

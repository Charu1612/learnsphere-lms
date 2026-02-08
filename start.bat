@echo off
REM LearnSphere Platform - Quick Start Script
REM This script helps initialize the database

setlocal enabledelayedexpansion

echo ========================================
echo   LearnSphere Platform - Startup Script
echo ========================================
echo.

set WORKSPACE_ROOT=c:\Users\dsdha\Downloads\LearnSphere-SaaS\LearnSphere-SaaS

echo Setting environment variables...
set DATABASE_URL=postgresql://postgres:password@localhost:5432/learnsphere

echo.
echo Initializing database schema and seed data...
cd /d "%WORKSPACE_ROOT%"
call .\.venv\Scripts\python.exe backend/init_db.py

if %ERRORLEVEL% neq 0 (
    echo.
    echo ERROR: Database initialization failed!
    echo Make sure PostgreSQL is running on your system.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Database initialized successfully!
echo ========================================
echo.

echo Next steps:
echo.
echo 1. Open a NEW Command Prompt and run:
echo    cd "%WORKSPACE_ROOT%"
echo    set DATABASE_URL=postgresql://postgres:password@localhost:5432/learnsphere
echo    .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000
echo.

echo 2. Open ANOTHER new Command Prompt and run:
echo    cd "%WORKSPACE_ROOT%\frontend"
echo    npm run dev
echo.

echo 3. Open in browser:
echo    Frontend: http://localhost:5000
echo    Backend API Docs: http://localhost:8000/docs
echo.

echo Test Accounts:
echo   Admin: admin@learnsphere.com / admin123
echo   Instructor: instructor@learnsphere.com / instructor123
echo.

pause

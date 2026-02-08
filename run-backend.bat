@echo off
REM LearnSphere Backend Server Startup

setlocal enabledelayedexpansion

set WORKSPACE_ROOT=c:\Users\dsdha\Downloads\LearnSphere-SaaS\LearnSphere-SaaS
set DATABASE_URL=postgresql://postgres:password@localhost:5432/learnsphere

echo.
echo ========================================
echo   LearnSphere - Backend Server
echo ========================================
echo.
echo Starting FastAPI server on port 8000...
echo Database: %DATABASE_URL%
echo.
echo The server will reload automatically when you make changes.
echo Press Ctrl+C to stop the server.
echo.
echo API Documentation available at:
echo   http://localhost:8000/docs
echo.
echo ========================================
echo.

cd /d "%WORKSPACE_ROOT%"
set DATABASE_URL=%DATABASE_URL%
.\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000

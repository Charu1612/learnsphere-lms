@echo off
REM LearnSphere Frontend Server Startup

setlocal enabledelayedexpansion

set WORKSPACE_ROOT=c:\Users\dsdha\Downloads\LearnSphere-SaaS\LearnSphere-SaaS\frontend

echo.
echo ========================================
echo   LearnSphere - Frontend Server
echo ========================================
echo.
echo Starting React + Vite development server on port 5000...
echo.
echo The server will reload automatically when you make changes.
echo Press Ctrl+C to stop the server.
echo.
echo Open your browser to:
echo   http://localhost:5000
echo.
echo ========================================
echo.

cd /d "%WORKSPACE_ROOT%"
call npm run dev

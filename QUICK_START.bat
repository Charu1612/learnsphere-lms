@echo off
echo ========================================
echo LearnSphere - Quick Start
echo ========================================
echo.

echo Step 1: Checking if backend is running...
netstat -ano | findstr :8000 > nul
if %errorlevel% == 0 (
    echo [OK] Backend is already running on port 8000
) else (
    echo [!] Backend is not running
    echo Starting backend...
    start "LearnSphere Backend" cmd /k "cd backend && python main_new.py"
    timeout /t 3 > nul
)

echo.
echo Step 2: Checking if frontend is running...
netstat -ano | findstr :5000 > nul
if %errorlevel% == 0 (
    echo [OK] Frontend is already running on port 5000
) else (
    echo [!] Frontend is not running
    echo Starting frontend...
    start "LearnSphere Frontend" cmd /k "cd frontend && npm run dev"
    timeout /t 3 > nul
)

echo.
echo ========================================
echo LearnSphere is starting!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5000
echo.
echo Press any key to open the application...
pause > nul

start http://localhost:5000

echo.
echo Application opened in your browser!
echo Keep this window open to see the status.
echo.
pause

@echo off
echo ======================================================================
echo 🔄 Restarting LearnSphere Backend and Frontend
echo ======================================================================
echo.

echo 1️⃣  Stopping any running processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *main_new.py*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *vite*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo 2️⃣  Starting Backend (Port 8000)...
start "LearnSphere Backend" cmd /k "cd backend && python main_new.py"
timeout /t 3 /nobreak >nul

echo.
echo 3️⃣  Starting Frontend (Port 5000)...
start "LearnSphere Frontend" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo ✅ Both servers starting!
echo ======================================================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5000
echo.
echo 📋 NEXT STEPS:
echo 1. Wait 10 seconds for servers to fully start
echo 2. Open: http://localhost:5000
echo 3. Logout if already logged in
echo 4. Login again as instructor@learnsphere.com / instructor123
echo.
echo ======================================================================
pause

@echo off
echo ======================================================================
echo 🎮 LearnSphere Gamification Setup
echo ======================================================================
echo.

echo Step 1: Run SQL Migration
echo ======================================================================
echo Please open Supabase Dashboard and run the SQL migration:
echo.
echo 1. Open: https://supabase.com/dashboard
echo 2. Select project: aqrlbobkgsrklyyuvcuf
echo 3. Go to SQL Editor
echo 4. Copy contents of: ADD_GAMIFICATION_SYSTEM.sql
echo 5. Paste and click "Run"
echo.
pause

echo.
echo Step 2: Generate Rich Courses
echo ======================================================================
python generate_rich_courses.py
echo.
pause

echo.
echo Step 3: Restart Backend
echo ======================================================================
echo Backend will start in a new window...
start "LearnSphere Backend" cmd /k "cd backend && python main_new.py"
timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo ✅ Setup Complete!
echo ======================================================================
echo.
echo 📋 What's been set up:
echo    • 5 FREE courses with rich content
echo    • 3 PAID courses
echo    • Badges and achievements system
echo    • Certificate generation
echo    • Celebration animations
echo.
echo 🚀 Next Steps:
echo    1. Login as learner: learner@learnsphere.com / learner123
echo    2. Browse courses and enroll
echo    3. Complete all lessons in a course
echo    4. Click "Complete Course" button
echo    5. See celebration animation and get certificate!
echo    6. Visit Achievements page to see all badges
echo.
echo 🎯 Test the features:
echo    • Complete lessons (they turn green)
echo    • Finish all lessons to unlock "Complete Course" button
echo    • Get certificate with confetti celebration
echo    • Download certificate as HTML
echo    • View achievements and badges
echo.
pause

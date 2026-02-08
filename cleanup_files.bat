@echo off
echo Cleaning up unnecessary files...

REM Delete test and utility Python files
del /F /Q test_*.py 2>nul
del /F /Q check_*.py 2>nul
del /F /Q fix_*.py 2>nul
del /F /Q run_*.py 2>nul
del /F /Q add_*.py 2>nul
del /F /Q complete_*.py 2>nul
del /F /Q remove_*.py 2>nul
del /F /Q setup_*.py 2>nul
del /F /Q create_*.py 2>nul
del /F /Q main.py 2>nul

REM Delete SQL files except database_schema.sql
for %%f in (*.sql) do (
    if not "%%f"=="database_schema.sql" (
        del /F /Q "%%f" 2>nul
    )
)

REM Delete old backend files
del /F /Q backend\main.py 2>nul
del /F /Q backend\main_supabase_api.py 2>nul
del /F /Q backend\main_api.py 2>nul
del /F /Q backend\main_local*.py 2>nul
del /F /Q backend\simple_backend.py 2>nul
del /F /Q backend\mock_server.py 2>nul
del /F /Q backend\start_backend.py 2>nul
del /F /Q backend\badge_system.py 2>nul
del /F /Q backend\learner_endpoints_with_badges.py 2>nul

REM Delete batch files except essential ones
for %%f in (*.bat) do (
    if not "%%f"=="RUN_ALL.bat" (
        if not "%%f"=="run-backend.bat" (
            if not "%%f"=="run-frontend.bat" (
                if not "%%f"=="cleanup_files.bat" (
                    del /F /Q "%%f" 2>nul
                )
            )
        )
    )
)

echo Cleanup complete!
echo.
echo Essential files kept:
echo - backend/main_new.py (main backend)
echo - frontend/ (all frontend files)
echo - generate_sample_data.py (for creating test data)
echo - database_schema.sql (database schema)
echo - README.md (documentation)
echo - package.json, pyproject.toml (dependencies)
echo - RUN_ALL.bat, run-backend.bat, run-frontend.bat (startup scripts)
pause

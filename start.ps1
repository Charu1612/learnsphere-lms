#!/usr/bin/env pwsh

# LearnSphere Platform - Startup Script
# This script helps set up and run the LearnSphere platform

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LearnSphere Platform - Setup & Run  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the workspace root
$WORKSPACE_ROOT = "c:\Users\dsdha\Downloads\LearnSphere-SaaS\LearnSphere-SaaS"

# Check if PostgreSQL is running
Write-Host "Checking PostgreSQL status..." -ForegroundColor Yellow
$postgresRunning = $null
try {
    $postgresRunning = Get-Process postgres -ErrorAction SilentlyContinue
}
catch {
    $postgresRunning = $null
}

if ($postgresRunning) {
    Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
} else {
    Write-Host "⚠ PostgreSQL is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start PostgreSQL before continuing:" -ForegroundColor Yellow
    Write-Host "  1. Open Windows Services (services.msc)" -ForegroundColor Gray
    Write-Host "  2. Find 'postgresql-x64-[version]'" -ForegroundColor Gray
    Write-Host "  3. Right-click and select 'Start'" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter once PostgreSQL is running..."
}

Write-Host ""
Write-Host "Setting environment variables..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/learnsphere"
Write-Host "✓ DATABASE_URL set" -ForegroundColor Green

Write-Host ""
Write-Host "Initializing database schema and seed data..." -ForegroundColor Yellow
cd $WORKSPACE_ROOT
try {
    & ".\.venv\Scripts\python.exe" backend/init_db.py
    Write-Host "✓ Database initialized successfully" -ForegroundColor Green
}
catch {
    Write-Host "✗ Database initialization failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL is running and accessible" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Ready to start servers!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Open a NEW PowerShell/Terminal window and run:" -ForegroundColor White
Write-Host "   cd '$WORKSPACE_ROOT'" -ForegroundColor Cyan
Write-Host '   $env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/learnsphere"' -ForegroundColor Cyan
Write-Host "   .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host ""

Write-Host "2. Open ANOTHER new PowerShell/Terminal window and run:" -ForegroundColor White
Write-Host "   cd '$WORKSPACE_ROOT\frontend'" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Once both servers are running, open in browser:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Backend API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test Accounts:" -ForegroundColor Green
Write-Host "  Admin: admin@learnsphere.com / admin123" -ForegroundColor Cyan
Write-Host "  Instructor: instructor@learnsphere.com / instructor123" -ForegroundColor Cyan
Write-Host ""

Write-Host "Press Enter to exit this script..." -ForegroundColor Gray
Read-Host

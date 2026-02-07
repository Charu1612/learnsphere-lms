# LearnSphere - eLearning Platform

## Overview
LearnSphere is a full-featured eLearning SaaS platform built with React (Vite) frontend and Python FastAPI backend, using PostgreSQL for data storage.

## Architecture
- **Frontend**: React + Vite (port 5000), React Router v6, React Context for state
- **Backend**: Python FastAPI (port 8000)
- **Database**: PostgreSQL (Replit built-in)
- **Auth**: Custom email/password with httpOnly session cookies

## Project Structure
```
frontend/           # React Vite application
  src/
    contexts/       # ThemeContext, AuthContext
    components/     # Navbar, Footer, ProtectedRoute
    pages/          # All page components
backend/
  main.py           # FastAPI application with all endpoints
  init_db.py        # Database initialization and seeding
```

## User Roles
1. **Learner** (default) - Browse, enroll, learn
2. **Instructor** - Create/manage courses, lessons, quizzes
3. **Admin** - Manage users, roles, moderate content

## Seed Accounts
- Admin: admin@learnsphere.com / admin123
- Instructor: instructor@learnsphere.com / instructor123

## Key Features
- Public-first: Browse courses without login
- Dark/light theme with localStorage persistence
- Course enrollment with progress tracking
- Lesson player with document/quiz types
- Quiz system with MCQs, timer, pass/fail
- Instructor dashboard for course management
- Admin panel for user/course moderation

## Recent Changes
- Initial build: Full platform with all features (Feb 2026)

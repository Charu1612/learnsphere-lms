# LearnSphere LMS

A full-stack Learning Management System with React + TypeScript frontend and FastAPI backend.

## Structure

- `frontend/` - React + TypeScript UI
- `backend/` - FastAPI Python backend
- `supabase/` - Database schema and storage config

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Features

- Role-based access (Admin, Instructor, Learner)
- Course management
- Video lessons
- Quizzes and assessments
- Progress tracking
- Reviews and ratings

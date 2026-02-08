# 🎓 LearnSphere - Full-Stack Learning Management System (LMS)

A modern, feature-rich Learning Management System built with React, FastAPI, and Supabase PostgreSQL.

![LearnSphere](https://img.shields.io/badge/LearnSphere-LMS-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791)

## 🌟 Features

### 👨‍🎓 For Learners
- **Course Enrollment & Progress Tracking** - Browse and enroll in courses with real-time progress updates
- **Interactive Lesson Player** - Support for video, document, and interactive content
- **Quiz System** - Take quizzes with instant feedback and scoring
- **Learning Streak Tracker** - Daily streak system like LeetCode to maintain learning consistency
- **Gamification** - Earn badges, points, and certificates for achievements
- **Study Plans** - Personalized learning paths with visual progress tracking
- **Achievements Dashboard** - Track badges, points, streaks, and completed courses
- **Certificate Generation** - Beautiful HTML certificates with grades and ranks (A+🏆, A🥇, B🥈, C🥉)

### 👨‍🏫 For Instructors
- **Course Creation & Management** - Rich course editor with lesson builder
- **Quiz Builder** - Create custom quizzes with multiple choice questions
- **Student Analytics** - Track student progress and engagement
- **Content Management** - Upload and organize course materials
- **Messaging System** - Communicate with students

### 👨‍💼 For Admins
- **User Management** - Manage learners, instructors, and admins
- **Course Approval** - Review and approve instructor-created courses
- **Reporting Dashboard** - Comprehensive analytics and insights
- **Platform Configuration** - System-wide settings and controls

## 🏗️ Project Structure

```
LearnSphere-SaaS/
├── backend/
│   ├── main_new.py              # FastAPI backend server
│   ├── migrations/              # Database migration scripts
│   └── __pycache__/
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable React components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── BadgeNotification.jsx
│   │   │   ├── CelebrationModal.jsx
│   │   │   ├── LessonEditor.jsx
│   │   │   ├── QuizBuilder.jsx
│   │   │   └── PaymentModal.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Landing page
│   │   │   ├── Login.jsx        # Authentication
│   │   │   ├── Signup.jsx
│   │   │   ├── admin/           # Admin dashboard pages
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── CoursesDashboard.jsx
│   │   │   │   ├── CourseForm.jsx
│   │   │   │   ├── UserManagement.jsx
│   │   │   │   ├── InstructorManagement.jsx
│   │   │   │   └── ReportingDashboard.jsx
│   │   │   ├── instructor/      # Instructor dashboard pages
│   │   │   │   ├── InstructorLayout.jsx
│   │   │   │   ├── InstructorDashboard.jsx
│   │   │   │   ├── EnhancedCourseForm.jsx
│   │   │   │   ├── InstructorCoursePlans.jsx
│   │   │   │   └── InstructorMessages.jsx
│   │   │   └── learner/         # Learner pages
│   │   │       ├── LearnerHome.jsx
│   │   │       ├── BrowseCourses.jsx
│   │   │       ├── MyCoursesPage.jsx
│   │   │       ├── CourseDetailPage.jsx
│   │   │       ├── LessonPlayer.jsx
│   │   │       ├── QuizPlayer.jsx
│   │   │       ├── StudyPlan.jsx
│   │   │       └── Achievements.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx  # Authentication context
│   │   │   └── ThemeContext.jsx # Theme management
│   │   ├── styles/              # CSS stylesheets
│   │   ├── App.jsx
│   │   ├── AppRoutes.jsx        # Route configuration
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
├── uploads/                     # File uploads directory
├── database_schema.sql          # Complete database schema
├── generate_sample_data.py      # Sample data generator
├── setup_gamification.py        # Gamification setup script
├── RUN_PLATFORM.bat            # Windows startup script
├── run-backend.bat             # Backend startup script
├── run-frontend.bat            # Frontend startup script
└── README.md
```

## � Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- PostgreSQL (Supabase account)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Charu1612/learnsphere-lms.git
cd learnsphere-lms
```

2. **Backend Setup**
```bash
cd backend
pip install -r requirements.txt
```

3. **Frontend Setup**
```bash
cd frontend
npm install
```

4. **Database Setup**
- Create a Supabase project at https://supabase.com
- Update `backend/main_new.py` with your Supabase credentials:
```python
SUPABASE_URL = "your-supabase-url"
SUPABASE_KEY = "your-supabase-anon-key"
```
- Run the database migrations:
```bash
python generate_sample_data.py
```

5. **Run the Application**

**Option 1: Using batch files (Windows)**
```bash
# Run both backend and frontend
RUN_PLATFORM.bat
```

**Option 2: Manual start**
```bash
# Terminal 1 - Backend
cd backend
uvicorn main_new:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

6. **Access the Application**
- Frontend: http://localhost:5001
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Default Test Accounts
```
Admin:
Email: admin@test.com
Password: password123

Instructor:
Email: instructor@test.com
Password: password123

Learner:
Email: learner@test.com
Password: password123
```

## 🎯 Key Features Explained

### 1. Learning Streak System
- Tracks daily learning activity
- Maintains streak with 1-day grace period
- Resets after missing 2 consecutive days
- Visual calendar showing last 60 days of activity
- Motivational badges for streak milestones

### 2. Gamification System
- **Points**: Earn 10 points per lesson, 100 points per course
- **Badges**: Unlock achievements for milestones
- **Certificates**: Auto-generated with beautiful HTML design
- **Ranks**: A+ (🏆), A (🥇), B (🥈), C (🥉)

### 3. Progress Tracking
- Real-time course completion percentage
- Lesson-by-lesson progress
- Visual progress bars and indicators
- Completion status badges

### 4. Course Management
- Rich text lesson content
- Video embedding support
- Quiz integration
- Downloadable resources
- Course prerequisites

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **React Router** - Navigation
- **Lucide React** - Icons
- **CSS3** - Styling

### Backend
- **FastAPI** - Python web framework
- **Uvicorn** - ASGI server
- **Supabase Client** - Database client
- **Python 3.9+** - Programming language

### Database
- **PostgreSQL** - Via Supabase
- **Supabase REST API** - Database access
- **Row Level Security** - Disabled for development

## 📊 Database Schema

### Core Tables
- `users` - User accounts and profiles
- `courses` - Course information
- `lessons` - Lesson content
- `enrollments` - Student course enrollments
- `lesson_progress` - Lesson completion tracking

### Gamification Tables
- `badges` - Available badges
- `user_badges` - User badge achievements
- `certificates` - Course completion certificates
- `achievements` - User achievements
- `user_points` - Points history

### Assessment Tables
- `quizzes` - Quiz definitions
- `quiz_attempts` - Quiz submission records

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (Admin, Instructor, Learner)
- Protected routes with middleware
- Session management with cookies

## 🎨 UI/UX Features

- Responsive design for all devices
- Dark/Light theme support
- Smooth animations and transitions
- Loading states and error handling
- Toast notifications
- Modal dialogs
- Celebration animations for achievements

## 📈 Analytics & Reporting

- Student progress tracking
- Course completion rates
- Engagement metrics
- Quiz performance analytics
- Instructor performance dashboard
- Platform-wide statistics

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `GET /api/auth/me` - Get current user

### Learner Endpoints
- `GET /api/learner/courses` - Browse courses
- `POST /api/learner/courses/{id}/enroll` - Enroll in course
- `GET /api/learner/courses/{id}` - Get course details
- `PUT /api/learner/lessons/{id}/complete` - Mark lesson complete
- `GET /api/learner/achievements` - Get achievements and streak
- `GET /api/learner/profile` - Get learner profile

### Instructor Endpoints
- `GET /api/instructor/courses` - Get instructor courses
- `POST /api/instructor/courses` - Create new course
- `PUT /api/instructor/courses/{id}` - Update course
- `GET /api/instructor/students` - Get enrolled students

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/{id}` - Update user
- `GET /api/admin/courses` - Get all courses
- `GET /api/admin/analytics` - Get platform analytics

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Charu** - Initial work - [Charu1612](https://github.com/Charu1612)

## 🙏 Acknowledgments

- Supabase for database hosting
- React team for the amazing framework
- FastAPI for the excellent Python framework
- All contributors and testers

## 📞 Support

For support, email support@learnsphere.com or open an issue in the GitHub repository.

---

Made with ❤️ by the LearnSphere Team

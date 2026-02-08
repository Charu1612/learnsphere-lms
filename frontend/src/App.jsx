import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Learner Pages
import Courses from './pages/learner/Courses';
import BrowseCourses from './pages/learner/BrowseCourses';
import MyCoursesPage from './pages/learner/MyCoursesPage';
import CourseDetailPage from './pages/learner/CourseDetailPage';
import StudyPlan from './pages/learner/StudyPlan';
import LessonPlayer from './pages/learner/LessonPlayer';
import QuizPlayer from './pages/learner/QuizPlayer';
import LearnerDashboard from './pages/learner/LearnerDashboard';
import LearnerHome from './pages/learner/LearnerHome';
import Achievements from './pages/learner/Achievements';

// Admin/Instructor Pages
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCoursePlans from './pages/instructor/InstructorCoursePlans';
import InstructorMessages from './pages/instructor/InstructorMessages';
import AdminPanel from './pages/AdminPanel';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<div className="main-wrapper"><Landing /></div>} />
            <Route path="/login" element={<div className="main-wrapper"><Login /></div>} />
            <Route path="/signup" element={<div className="main-wrapper"><Signup /></div>} />

            {/* Learner Routes */}
            <Route path="/home" element={<ProtectedRoute roles={['learner']}><LearnerHome /></ProtectedRoute>} />
            <Route path="/courses" element={<BrowseCourses />} />
            <Route path="/course/:courseId" element={<CourseDetailPage />} />
            <Route path="/course/:courseId/study-plan" element={<ProtectedRoute roles={['learner', 'admin', 'instructor']}><StudyPlan /></ProtectedRoute>} />
            <Route path="/my-courses" element={<ProtectedRoute roles={['learner', 'admin', 'instructor']}><MyCoursesPage /></ProtectedRoute>} />
            <Route path="/course/:courseId/lesson/:lessonId" element={<ProtectedRoute roles={['learner', 'admin', 'instructor']}><LessonPlayer /></ProtectedRoute>} />
            <Route path="/course/:courseId/lesson/:lessonId/quiz" element={<ProtectedRoute roles={['learner', 'admin', 'instructor']}><QuizPlayer /></ProtectedRoute>} />
            <Route path="/achievements" element={<ProtectedRoute roles={['learner', 'admin', 'instructor']}><div className="main-wrapper"><Achievements /></div></ProtectedRoute>} />

            {/* Admin/Instructor Routes */}
            <Route path="/instructor" element={<ProtectedRoute roles={['instructor', 'admin']}><div className="main-wrapper"><InstructorCoursePlans /></div></ProtectedRoute>} />
            <Route path="/instructor/messages" element={<ProtectedRoute roles={['instructor', 'admin']}><div className="main-wrapper"><InstructorMessages /></div></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><div className="main-wrapper"><AdminPanel /></div></ProtectedRoute>} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

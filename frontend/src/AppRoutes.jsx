import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Import pages 
import Login from './pages/Login';
import Landing from './pages/Landing';

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CoursesDashboard from './pages/admin/CoursesDashboard';
import CourseForm from './pages/admin/CourseForm';
import InstructorManagement from './pages/admin/InstructorManagement';
import UserManagement from './pages/admin/UserManagement';
import ReportingDashboard from './pages/admin/ReportingDashboard';

// Instructor pages
import InstructorLayout from './pages/instructor/InstructorLayout';
import InstructorDashboard from './pages/instructor/InstructorDashboard';
import InstructorMessages from './pages/instructor/InstructorMessages';

// Learner pages
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import LessonPlayer from './pages/LessonPlayer';
import Quiz from './pages/Quiz';
import MyCourses from './pages/MyCourses';
import LearnerHome from './pages/learner/LearnerHome';
import BrowseCourses from './pages/learner/BrowseCourses';
import MyCoursesPage from './pages/learner/MyCoursesPage';
import CourseDetailPage from './pages/learner/CourseDetailPage';
import StudyPlan from './pages/learner/StudyPlan';
import Achievements from './pages/learner/Achievements';

// Auth contexts and components
import { AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Styles
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      // Verify token is still valid
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/" element={<Landing />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']} user={user}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<CoursesDashboard />} />
            <Route path="courses/create" element={<CourseForm isAdmin={true} />} />
            <Route path="courses/:id" element={<CourseForm isAdmin={true} />} />
            <Route path="instructors" element={<InstructorManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<ReportingDashboard isAdmin={true} />} />
          </Route>

          {/* Instructor Routes */}
          <Route
            path="/instructor"
            element={
              <ProtectedRoute allowedRoles={['instructor']} user={user}>
                <InstructorLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/instructor/dashboard" replace />} />
            <Route path="dashboard" element={<InstructorDashboard />} />
            <Route path="courses" element={<CoursesDashboard />} />
            <Route path="courses/create" element={<CourseForm isAdmin={false} />} />
            <Route path="courses/:id" element={<CourseForm isAdmin={false} />} />
            <Route path="messages" element={<InstructorMessages />} />
            <Route path="students" element={<div>Students Dashboard (TODO)</div>} />
            <Route path="reports" element={<ReportingDashboard isAdmin={false} />} />
          </Route>

          {/* Learner Routes */}
          <Route path="/learner" element={<LearnerHome />} />
          <Route path="/learner/browse" element={<BrowseCourses />} />
          <Route path="/learner/my-courses" element={<MyCoursesPage />} />
          <Route path="/learner/achievements" element={<Achievements />} />
          <Route path="/courses" element={<Courses />} />
          {/* More specific routes must come before generic ones */}
          <Route path="/courses/:courseId/study-plan" element={<StudyPlan />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayer />} />
          <Route path="/courses/:courseId/quiz/:quizId" element={<Quiz />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/my-courses" element={<MyCourses />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;

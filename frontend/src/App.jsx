import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import MyCourses from './pages/MyCourses';
import LessonPlayer from './pages/LessonPlayer';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<div className="main-wrapper"><Landing /></div>} />
            <Route path="/login" element={<div className="main-wrapper"><Login /></div>} />
            <Route path="/signup" element={<div className="main-wrapper"><Signup /></div>} />
            <Route path="/courses" element={<div className="main-wrapper"><Courses /></div>} />
            <Route path="/courses/:id" element={<div className="main-wrapper"><CourseDetail /></div>} />
            <Route path="/my-courses" element={<ProtectedRoute><div className="main-wrapper"><MyCourses /></div></ProtectedRoute>} />
            <Route path="/learn/:courseId/:lessonId" element={<ProtectedRoute><LessonPlayer /></ProtectedRoute>} />
            <Route path="/instructor" element={<ProtectedRoute roles={['instructor', 'admin']}><div className="main-wrapper"><InstructorDashboard /></div></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><div className="main-wrapper"><AdminPanel /></div></ProtectedRoute>} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

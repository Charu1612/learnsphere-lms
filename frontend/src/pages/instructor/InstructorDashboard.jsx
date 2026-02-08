import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Instructor Dashboard Component
function InstructorDashboard() {
  const [stats, setStats] = useState(null);
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstructorStats();
    fetchMyCourses();
  }, []);

  const fetchInstructorStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(
        'http://localhost:8000/api/instructor/dashboard',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setStats(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
      console.error('Error fetching instructor stats:', err);
    }
  };

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(
        'http://localhost:8000/api/instructor/courses',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMyCourses(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
      setLoading(false);
      console.error('Error fetching courses:', err);
    }
  };

  if (loading) {
    return (
      <div className="instructor-dashboard loading">
        <div className="spinner">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="instructor-dashboard">
      <div className="dashboard-header">
        <h1>👨‍🏫 Instructor Dashboard</h1>
        <p>Create, manage and track your courses</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid instructor-stats">
        <div className="stat-card my-courses">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>My Courses</h3>
            <p className="stat-value">{stats?.my_courses || 0}</p>
          </div>
        </div>

        <div className="stat-card total-students">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Students</h3>
            <p className="stat-value">{stats?.total_students || 0}</p>
          </div>
        </div>

        <div className="stat-card completed-students">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Completed Courses</h3>
            <p className="stat-value">{stats?.completed_enrollments || 0}</p>
          </div>
        </div>

        <div className="stat-card in-progress">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>In Progress</h3>
            <p className="stat-value">{stats?.in_progress_enrollments || 0}</p>
          </div>
        </div>
      </div>

      {/* My Courses Section */}
      <div className="my-courses-section">
        <div className="section-header">
          <h2>📖 My Courses</h2>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/instructor/courses/new')}
          >
            ➕ Create New Course
          </button>
        </div>

        {myCourses.length === 0 ? (
          <div className="empty-state">
            <p>📭 You haven't created any courses yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/instructor/courses/new')}
            >
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {myCourses.map(course => (
              <div key={course.course_id} className="course-card">
                <div className="course-image">
                  {course.cover_image_url ? (
                    <img src={course.cover_image_url} alt={course.title} />
                  ) : (
                    <div className="placeholder">📚</div>
                  )}
                  {course.is_published && (
                    <span className="published-badge">Published</span>
                  )}
                </div>
                
                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p className="description">{course.short_description}</p>
                  
                  <div className="course-meta">
                    <span>📚 {course.lesson_count || 0} Lessons</span>
                    <span>👥 {course.enrollment_count || 0} Students</span>
                    <span>⏱️ {course.total_duration_minutes || 0} min</span>
                  </div>

                  <div className="course-actions">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => navigate(`/instructor/courses/${course.course_id}`)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/instructor/courses/${course.course_id}/lessons`)}
                    >
                      Lessons
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/instructor/courses/${course.course_id}/reports`)}
                    >
                      Reports
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="quick-links">
        <h2>📌 Quick Actions</h2>
        <div className="link-buttons">
          <button onClick={() => navigate('/instructor/reports')}>
            📊 View All Reports
          </button>
          <button onClick={() => navigate('/instructor/courses')}>
            📚 All My Courses
          </button>
          <button onClick={() => navigate('/instructor/students')}>
            👥 Manage Students
          </button>
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard;

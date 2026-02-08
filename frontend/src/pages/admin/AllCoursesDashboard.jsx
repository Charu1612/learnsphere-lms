import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CoursesDashboard.css';

const API_BASE = 'http://localhost:8000';

function AllCoursesDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPublished, setFilterPublished] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllCourses();
  }, []);

  const fetchAllCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(
        `${API_BASE}/api/admin/courses/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        }
      );
      setCourses(response.data.courses || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load courses');
      setLoading(false);
    }
  };

  const sendFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter feedback text');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      await axios.post(
        `${API_BASE}/api/admin/courses/${selectedCourse.id}/feedback/v2`,
        { feedback_text: feedbackText },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      alert('Feedback sent successfully! Instructor will be notified.');
      setShowFeedbackModal(false);
      setFeedbackText('');
      setSelectedCourse(null);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to send feedback');
    }
  };

  const togglePublish = async (courseId, currentStatus) => {
    if (!window.confirm(`${currentStatus ? 'Unpublish' : 'Publish'} this course?`)) return;

    try {
      const token = localStorage.getItem('authToken');
      await axios.put(
        `${API_BASE}/api/admin/courses/${courseId}`,
        { published: !currentStatus },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      setCourses(courses.map(c => 
        c.id === courseId ? { ...c, published: !currentStatus } : c
      ));
      alert(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update course');
    }
  };

  const openFeedbackModal = (course) => {
    setSelectedCourse(course);
    setShowFeedbackModal(true);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.instructor_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPublished = filterPublished === 'all' || 
                            (filterPublished === 'published' && course.published) ||
                            (filterPublished === 'draft' && !course.published);
    return matchesSearch && matchesPublished;
  });

  if (loading) {
    return <div className="courses-dashboard loading">Loading courses...</div>;
  }

  return (
    <div className="courses-dashboard">
      <div className="page-header">
        <h1>📚 All Courses Management</h1>
        <p>View and manage courses from all instructors</p>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search by course title or instructor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          value={filterPublished}
          onChange={(e) => setFilterPublished(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Courses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Stats */}
      <div className="course-stats">
        <div className="stat-card">
          <span className="stat-label">Total Courses</span>
          <span className="stat-value">{courses.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Published</span>
          <span className="stat-value">{courses.filter(c => c.published).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Draft</span>
          <span className="stat-value">{courses.filter(c => !c.published).length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Enrollments</span>
          <span className="stat-value">{courses.reduce((sum, c) => sum + (c.enrollment_count || 0), 0)}</span>
        </div>
      </div>

      {/* Courses Table */}
      <div className="table-container">
        <table className="courses-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Instructor</th>
              <th>Status</th>
              <th>Lessons</th>
              <th>Students</th>
              <th>Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map(course => (
              <tr key={course.id}>
                <td>
                  <div className="course-cell">
                    {course.image_url && (
                      <img src={course.image_url} alt={course.title} className="course-thumb" />
                    )}
                    <div className="course-info">
                      <h4>{course.title}</h4>
                      <p>{course.short_description}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="instructor-cell">
                    <strong>{course.instructor_name}</strong>
                    <small>{course.instructor_email}</small>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${course.published ? 'published' : 'draft'}`}>
                    {course.published ? '✓ Published' : '📝 Draft'}
                  </span>
                </td>
                <td className="center">{course.lesson_count || 0}</td>
                <td className="center">{course.enrollment_count || 0}</td>
                <td className="center">
                  {course.pending_feedback_count > 0 && (
                    <span className="feedback-badge">
                      {course.pending_feedback_count} pending
                    </span>
                  )}
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => openFeedbackModal(course)}
                      title="Send feedback to instructor"
                    >
                      💬 Feedback
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/admin/courses/${course.id}`)}
                    >
                      👁️ View
                    </button>
                    <button 
                      className={`btn btn-sm ${course.published ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => togglePublish(course.id, course.published)}
                    >
                      {course.published ? '📥 Unpublish' : '📤 Publish'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredCourses.length === 0 && (
          <div className="empty-state">
            <p>No courses found</p>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Send Feedback to Instructor</h2>
              <button className="close-btn" onClick={() => setShowFeedbackModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="course-info-box">
                <h3>{selectedCourse?.title}</h3>
                <p>Instructor: {selectedCourse?.instructor_name}</p>
              </div>
              <textarea
                className="feedback-textarea"
                placeholder="Enter your feedback or instructions for the instructor..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows="6"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFeedbackModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={sendFeedback}>
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllCoursesDashboard;

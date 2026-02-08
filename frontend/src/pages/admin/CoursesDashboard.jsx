import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CoursesDashboard.css';

// Courses Dashboard - Admin View
function AdminCoursesDashboard() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    // Filter courses based on search term
    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCourses(filtered);
  }, [searchTerm, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.get(
        'http://localhost:8000/api/admin/courses',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setCourses(response.data);
      setFilteredCourses(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCourse = async () => {
    if (!newCourseName.trim()) {
      alert('Please enter a course name');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      const response = await axios.post(
        'http://localhost:8000/api/instructor/courses',
        { title: newCourseName },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Refresh courses list
      fetchCourses();
      setNewCourseName('');
      setShowCreateModal(false);
      
      // Navigate to edit the new course
      navigate(`/admin/courses/${response.data.course_id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create course');
    }
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      
      await axios.delete(
        `http://localhost:8000/api/instructor/courses/${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete course');
    }
  };

  const publishCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('authToken');
      
      await axios.put(
        `http://localhost:8000/api/admin/courses/${courseId}/publish`,
        { is_published: true },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish course');
    }
  };

  if (loading) {
    return <div className="courses-dashboard loading">Loading courses...</div>;
  }

  return (
    <div className="courses-dashboard">
      <div className="dashboard-header">
        <h1>📚 Courses Management</h1>
        <p>Manage all courses on the platform</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={fetchCourses}>Retry</button>
        </div>
      )}

      {/* Toolbar */}
      <div className="courses-toolbar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="view-controls">
          <button
            className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
            onClick={() => setViewMode('kanban')}
            title="Kanban View"
          >
            📊 Kanban
          </button>
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List View"
          >
            📋 List
          </button>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ➕ New Course
        </button>
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Course</h2>
            <input
              type="text"
              placeholder="Enter course name"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && createCourse()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={createCourse}>
                Create Course
              </button>
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredCourses.length === 0 ? (
        <div className="empty-state">
          <p>No courses found</p>
          {searchTerm && <p>Try a different search term</p>}
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView courses={filteredCourses} onEdit={(id) => navigate(`/admin/courses/${id}`)} onDelete={deleteCourse} onPublish={publishCourse} />
      ) : (
        <ListView courses={filteredCourses} onEdit={(id) => navigate(`/admin/courses/${id}`)} onDelete={deleteCourse} onPublish={publishCourse} />
      )}
    </div>
  );
}

// Kanban View Component
function KanbanView({ courses, onEdit, onDelete, onPublish }) {
  const draft = courses.filter(c => !c.is_published);
  const published = courses.filter(c => c.is_published);

  return (
    <div className="kanban-view">
      <div className="kanban-column">
        <div className="column-header">
          <h3>📝 Draft ({draft.length})</h3>
        </div>
        <div className="kanban-cards">
          {draft.map(course => (
            <CourseCard 
              key={course.course_id} 
              course={course} 
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
            />
          ))}
        </div>
      </div>

      <div className="kanban-column">
        <div className="column-header">
          <h3>✅ Published ({published.length})</h3>
        </div>
        <div className="kanban-cards">
          {published.map(course => (
            <CourseCard 
              key={course.course_id} 
              course={course} 
              onEdit={onEdit}
              onDelete={onDelete}
              onPublish={onPublish}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// List View Component
function ListView({ courses, onEdit, onDelete, onPublish }) {
  return (
    <div className="list-view">
      <table className="courses-table">
        <thead>
          <tr>
            <th>Course Name</th>
            <th>Instructor</th>
            <th>Lessons</th>
            <th>Views</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.course_id}>
              <td className="course-title">{course.title}</td>
              <td>{course.instructor_name || 'N/A'}</td>
              <td><span className="badge">{course.lesson_count || 0}</span></td>
              <td><span className="badge">{course.views_count || 0}</span></td>
              <td>
                <span className={`status-badge ${course.is_published ? 'published' : 'draft'}`}>
                  {course.is_published ? '✅ Published' : '📝 Draft'}
                </span>
              </td>
              <td className="actions">
                <button onClick={() => onEdit(course.course_id)} className="btn-action" title="Edit">
                  ✏️
                </button>
                {!course.is_published && (
                  <button onClick={() => onPublish(course.course_id)} className="btn-action" title="Publish">
                    📤
                  </button>
                )}
                <button onClick={() => onDelete(course.course_id)} className="btn-action danger" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Course Card Component
function CourseCard({ course, onEdit, onDelete, onPublish }) {
  return (
    <div className="course-card kanban-card">
      <div className="card-header">
        {course.cover_image_url && (
          <img src={course.cover_image_url} alt={course.title} className="card-image" />
        )}
      </div>
      <div className="card-body">
        <h4>{course.title}</h4>
        <div className="card-stats">
          <span>📚 {course.lesson_count || 0} Lessons</span>
          <span>👥 {course.enrollment_count || 0} Students</span>
        </div>
        <div className="card-tags">
          {course.tags && course.tags.split(',').map((tag, i) => (
            <span key={i} className="tag">{tag.trim()}</span>
          ))}
        </div>
      </div>
      <div className="card-footer">
        <button onClick={() => onEdit(course.course_id)} className="btn-sm">Edit</button>
        {!course.is_published && (
          <button onClick={() => onPublish(course.course_id)} className="btn-sm primary">Publish</button>
        )}
      </div>
    </div>
  );
}

export default AdminCoursesDashboard;

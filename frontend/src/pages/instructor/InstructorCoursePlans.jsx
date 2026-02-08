import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react';
import EnhancedCourseForm from './EnhancedCourseForm';
import '../../styles/InstructorCoursePlans.css';

export default function InstructorCoursePlans() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/instructor/courses', { credentials: 'include' });
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCourse = async (courseData) => {
    try {
      const url = editingCourse 
        ? `/api/instructor/courses/${editingCourse.id}`
        : '/api/instructor/courses';
      
      const method = editingCourse ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(courseData)
      });

      if (response.ok) {
        alert(editingCourse ? 'Course updated!' : 'Course created!');
        setShowForm(false);
        setEditingCourse(null);
        fetchCourses();
      } else {
        const error = await response.json();
        alert('Error: ' + (error.detail || 'Failed to save course'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to save course');
    }
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    try {
      const response = await fetch(`/api/instructor/courses/${courseId}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ published: !currentStatus })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Toggle success:', data.message);
        // Refresh courses list
        await fetchCourses();
      } else {
        const error = await response.json();
        console.error('Toggle failed:', error);
        alert('Failed to toggle course: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to toggle course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course? This cannot be undone.')) return;
    
    try {
      await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchCourses();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div className="course-plans-page">
      <div className="page-header">
        <div>
          <h1>📚 Course Plans</h1>
          <p>Manage your courses and learning paths</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={20} />
          Create New Course
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{courses.length}</div>
            <div className="stat-label">Total Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{courses.filter(c => c.published).length}</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon inactive">
            <EyeOff size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{courses.filter(c => !c.published).length}</div>
            <div className="stat-label">Inactive Courses</div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="courses-section">
        <h2>All Courses</h2>
        
        {courses.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} />
            <h3>No courses yet</h3>
            <p>Create your first course to get started</p>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={20} />
              Create Course
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.map(course => (
              <div key={course.id} className={`course-card ${!course.published ? 'inactive' : ''}`}>
                <div className="course-image">
                  <img src={course.image_url || 'https://via.placeholder.com/400x200'} alt={course.title} />
                  <div className="course-status">
                    {course.published ? (
                      <span className="badge badge-success">Active</span>
                    ) : (
                      <span className="badge badge-secondary">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p>{course.short_description}</p>

                  <div className="course-meta">
                    <span>{course.access === 'free' ? 'Free' : `$${course.price}`}</span>
                    <span>{course.visibility}</span>
                  </div>

                  <div className="course-actions">
                    <button
                      className="btn-icon"
                      onClick={() => {
                        setEditingCourse(course);
                        setShowForm(true);
                      }}
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleTogglePublish(course.id, course.published)}
                      title={course.published ? 'Deactivate' : 'Activate'}
                    >
                      {course.published ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => handleDeleteCourse(course.id)}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Course Form Modal */}
      {showForm && (
        <EnhancedCourseForm
          course={editingCourse}
          onSave={handleSaveCourse}
          onCancel={() => {
            setShowForm(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}

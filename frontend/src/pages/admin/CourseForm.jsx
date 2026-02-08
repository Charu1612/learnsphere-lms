import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseForm.css';

// Course Form Component - Shared by Admin & Instructor
function CourseForm({ isAdmin = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('content');
  const [course, setCourse] = useState({
    title: '',
    short_description: '',
    full_description: '',
    cover_image_url: '',
    tags: '',
    website_slug: '',
    visibility: 'everyone',
    access_rule: 'open',
    price: null,
    is_published: false,
    course_admin_id: null
  });

  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(id ? true : false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      const endpoint = isAdmin 
        ? `http://localhost:8000/api/admin/courses/${id}`
        : `http://localhost:8000/api/instructor/courses/${id}`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourse(response.data);
      setLessons(response.data.lessons || []);
      setQuizzes(response.data.quizzes || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course');
      setLoading(false);
    }
  };

  const updateCourse = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      
      const endpoint = isAdmin
        ? `http://localhost:8000/api/admin/courses/${id}`
        : `http://localhost:8000/api/instructor/courses/${id}`;
      
      const method = id ? 'PUT' : 'POST';
      const url = id ? endpoint : 'http://localhost:8000/api/instructor/courses';
      
      const response = await axios({
        method,
        url,
        data: course,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCourse(response.data);
      setError(null);
      alert('Course saved successfully!');
      
      if (!id) {
        navigate(`/instructor/courses/${response.data.course_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('authToken');
      
      const response = await axios.put(
        `http://localhost:8000/api/admin/courses/${id}/publish`,
        { is_published: !course.is_published },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setCourse(response.data);
      setError(null);
      alert(response.data.is_published ? 'Course published!' : 'Course unpublished!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="course-form loading">Loading course...</div>;
  }

  return (
    <div className="course-form">
      <div className="form-header">
        <h1>{id ? 'Edit Course' : 'Create New Course'}</h1>
        <div className="header-actions">
          {id && isAdmin && (
            <button 
              className={`btn btn-${course.is_published ? 'danger' : 'success'}`}
              onClick={togglePublish}
              disabled={saving}
            >
              {course.is_published ? '📤 Unpublish' : '📤 Publish'}
            </button>
          )}
          <button 
            className="btn btn-primary"
            onClick={updateCourse}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Course'}
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Basic Course Info */}
      <div className="course-info-section">
        <div className="info-row">
          <div className="form-group">
            <label>Course Title *</label>
            <input
              type="text"
              value={course.title}
              onChange={(e) => setCourse({...course, title: e.target.value})}
              placeholder="Enter course title"
            />
          </div>
          <div className="form-group">
            <label>Course Image</label>
            <input
              type="text"
              value={course.cover_image_url || ''}
              onChange={(e) => setCourse({...course, cover_image_url: e.target.value})}
              placeholder="Image URL"
            />
          </div>
        </div>

        <div className="info-row">
          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              value={course.tags || ''}
              onChange={(e) => setCourse({...course, tags: e.target.value})}
              placeholder="e.g., Python, Web Development, Beginner"
            />
          </div>
          <div className="form-group">
            <label>Website Slug</label>
            <input
              type="text"
              value={course.website_slug || ''}
              onChange={(e) => setCourse({...course, website_slug: e.target.value})}
              placeholder="course-slug"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button 
            className={`tab ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            📚 Content
          </button>
          <button 
            className={`tab ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            📝 Description
          </button>
          <button 
            className={`tab ${activeTab === 'options' ? 'active' : ''}`}
            onClick={() => setActiveTab('options')}
          >
            ⚙️ Options
          </button>
          <button 
            className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quizzes')}
          >
            ❓ Quizzes
          </button>
        </div>

        {/* Content Tab */}
        {activeTab === 'content' && (
          <ContentTab 
            lessons={lessons} 
            courseId={id}
            onLessonsUpdate={setLessons}
          />
        )}

        {/* Description Tab */}
        {activeTab === 'description' && (
          <div className="tab-content">
            <h3>Course Description</h3>
            <label>Short Description</label>
            <textarea
              value={course.short_description || ''}
              onChange={(e) => setCourse({...course, short_description: e.target.value})}
              placeholder="Short description for course cards"
              rows="3"
            />
            
            <label>Full Description</label>
            <textarea
              value={course.full_description || ''}
              onChange={(e) => setCourse({...course, full_description: e.target.value})}
              placeholder="Detailed course description"
              rows="6"
            />
          </div>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <div className="tab-content">
            <h3>Access & Visibility Settings</h3>
            
            <div className="form-group">
              <label>Visibility</label>
              <select 
                value={course.visibility}
                onChange={(e) => setCourse({...course, visibility: e.target.value})}
              >
                <option value="everyone">👥 Everyone</option>
                <option value="signed_in">🔒 Signed In Users</option>
              </select>
            </div>

            <div className="form-group">
              <label>Access Rule</label>
              <select 
                value={course.access_rule}
                onChange={(e) => setCourse({...course, access_rule: e.target.value})}
              >
                <option value="open">🔓 Open (Anyone can join)</option>
                <option value="invitation">📧 By Invitation</option>
                <option value="payment">💳 Paid Course</option>
              </select>
            </div>

            {course.access_rule === 'payment' && (
              <div className="form-group">
                <label>Price ($)</label>
                <input
                  type="number"
                  value={course.price || ''}
                  onChange={(e) => setCourse({...course, price: parseFloat(e.target.value)})}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            )}

            {isAdmin && (
              <div className="form-group">
                <label>Course Admin/Responsible</label>
                <input
                  type="text"
                  placeholder="Select course admin"
                  disabled
                />
                <small>Select from instructors list</small>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <QuizzesTab 
            quizzes={quizzes}
            courseId={id}
            onQuizzesUpdate={setQuizzes}
          />
        )}
      </div>
    </div>
  );
}

// Content Tab Component
function ContentTab({ lessons, courseId, onLessonsUpdate }) {
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const token = localStorage.getItem('authToken');

  const deleteLesson = async (lessonId) => {
    if (!window.confirm('Delete this lesson?')) return;

    try {
      await axios.delete(
        `http://localhost:8000/api/instructor/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onLessonsUpdate(lessons.filter(l => l.lesson_id !== lessonId));
    } catch (err) {
      alert('Failed to delete lesson');
    }
  };

  return (
    <div className="tab-content content-tab">
      <h3>Lessons & Content</h3>
      
      <div className="lessons-list">
        {lessons.map((lesson, index) => (
          <div key={lesson.lesson_id} className="lesson-item">
            <div className="lesson-info">
              <span className="lesson-number">{index + 1}</span>
              <div className="lesson-details">
                <p className="lesson-title">{lesson.title}</p>
                <span className="lesson-type">{lesson.lesson_type}</span>
              </div>
            </div>
            <div className="lesson-actions">
              <button 
                className="btn-sm"
                onClick={() => {
                  setEditingLesson(lesson);
                  setShowLessonEditor(true);
                }}
              >
                ✏️ Edit
              </button>
              <button 
                className="btn-sm danger"
                onClick={() => deleteLesson(lesson.lesson_id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="btn btn-primary"
        onClick={() => {
          setEditingLesson(null);
          setShowLessonEditor(true);
        }}
      >
        ➕ Add Content
      </button>

      {showLessonEditor && (
        <LessonEditorModal
          lesson={editingLesson}
          courseId={courseId}
          onClose={() => setShowLessonEditor(false)}
          onSave={(updatedLessons) => {
            onLessonsUpdate(updatedLessons);
            setShowLessonEditor(false);
          }}
        />
      )}
    </div>
  );
}

// Quizzes Tab Component
function QuizzesTab({ quizzes, courseId, onQuizzesUpdate }) {
  const [showQuizEditor, setShowQuizEditor] = useState(false);
  const token = localStorage.getItem('authToken');

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Delete this quiz?')) return;

    try {
      await axios.delete(
        `http://localhost:8000/api/instructor/quizzes/${quizId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onQuizzesUpdate(quizzes.filter(q => q.quiz_id !== quizId));
    } catch (err) {
      alert('Failed to delete quiz');
    }
  };

  return (
    <div className="tab-content quizzes-tab">
      <h3>Course Quizzes</h3>
      
      <div className="quizzes-list">
        {quizzes.map((quiz, index) => (
          <div key={quiz.quiz_id} className="quiz-item">
            <div className="quiz-info">
              <span className="quiz-number">Quiz {index + 1}</span>
              <p className="quiz-title">{quiz.title}</p>
            </div>
            <div className="quiz-actions">
              <button className="btn-sm">✏️ Edit</button>
              <button 
                className="btn-sm danger"
                onClick={() => deleteQuiz(quiz.quiz_id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="btn btn-primary"
        onClick={() => setShowQuizEditor(true)}
      >
        ➕ Add Quiz
      </button>
    </div>
  );
}

// Lesson Editor Modal (Simplified)
function LessonEditorModal({ lesson, courseId, onClose, onSave }) {
  const [formData, setFormData] = useState(lesson || {
    title: '',
    lesson_type: 'video',
    video_url: '',
    duration_minutes: 0,
    description: ''
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <h2>{lesson ? 'Edit Lesson' : 'Add New Lesson'}</h2>
        <div className="form-group">
          <label>Lesson Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>
        <div className="form-group">
          <label>Lesson Type</label>
          <select value={formData.lesson_type} onChange={(e) => setFormData({...formData, lesson_type: e.target.value})}>
            <option value="video">🎥 Video</option>
            <option value="document">📄 Document</option>
            <option value="image">🖼️ Image</option>
          </select>
        </div>
        {formData.lesson_type === 'video' && (
          <div className="form-group">
            <label>Video URL</label>
            <input type="text" placeholder="https://..." value={formData.video_url} onChange={(e) => setFormData({...formData, video_url: e.target.value})} />
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => onSave([...lesson ? [] : [formData]])}>Save</button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default CourseForm;

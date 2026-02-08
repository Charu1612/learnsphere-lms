import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    fetch('/api/my-courses', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCourses(d.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleViewDetails = async (courseId) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, { credentials: 'include' });
      const data = await response.json();
      setCourseDetails(data);
      setSelectedCourse(courseId);
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleCloseDetails = () => {
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>My Learning Courses</h1>
          <p className="text-sm text-muted mt-4">Welcome back, {user?.full_name} • {courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>
        </div>
        <Link to="/courses" className="btn btn-outline btn-sm">Browse More</Link>
      </div>

      {courses.length > 0 && (
        <div className="search-input" style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search your courses..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 40 }} />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} style={{ marginBottom: 16, color: 'var(--text-muted)' }} />
          <h3>{courses.length === 0 ? "You haven't enrolled in any courses yet" : "No matches"}</h3>
          {courses.length === 0 && (
            <Link to="/courses" className="btn btn-primary mt-4">Browse Courses</Link>
          )}
        </div>
      ) : (
        <div>
          {/* Stats Overview */}
          <div className="dashboard-grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card">
              <div className="stat-value">{filtered.filter(c => c.progress_pct >= 100).length}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filtered.filter(c => c.progress_pct > 0 && c.progress_pct < 100).length}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filtered.filter(c => c.progress_pct === 0).length}</div>
              <div className="stat-label">Not Started</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{filtered.length > 0 ? Math.round(filtered.reduce((sum, c) => sum + c.progress_pct, 0) / filtered.length) : 0}%</div>
              <div className="stat-label">Avg Progress</div>
            </div>
          </div>

          {/* Course Grid */}
          <div className="course-grid">
            {filtered.map(course => (
              <div key={course.id} className="course-card">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="course-card-image" style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                ) : (
                  <div className="course-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', height: '160px', backgroundColor: 'var(--bg-tertiary)' }}>
                    <BookOpen size={40} />
                  </div>
                )}
                <div className="course-card-body">
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <h3 className="course-card-title">{course.title}</h3>
                    {course.progress_pct >= 100 ? (
                      <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
                    ) : course.progress_pct > 0 ? (
                      <TrendingUp size={20} style={{ color: '#f59e0b', flexShrink: 0 }} />
                    ) : (
                      <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
                    )}
                  </div>
                  
                  <p className="course-card-desc" style={{ fontSize: '0.85rem' }}>{course.description}</p>
                  
                  <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span className="text-sm text-muted">Learning Progress</span>
                      <span className="text-sm" style={{ fontWeight: 600, color: course.progress_pct >= 100 ? '#10b981' : '#f59e0b' }}>
                        {course.progress_pct || 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ 
                        width: `${course.progress_pct || 0}%`,
                        backgroundColor: course.progress_pct >= 100 ? '#10b981' : course.progress_pct >= 50 ? '#f59e0b' : '#ef4444'
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <span className={`badge ${course.progress_pct >= 100 ? 'badge-success' : course.progress_pct > 0 ? 'badge-warning' : 'badge-secondary'}`}>
                      {course.progress_pct >= 100 ? 'Completed' : course.progress_pct > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      By {course.instructor_name}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                      {course.progress_pct >= 100 ? 'Review' : course.progress_pct > 0 ? 'Continue' : 'Start'}
                    </Link>
                    <button
                      onClick={() => handleViewDetails(course.id)}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '6px 12px' }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourse && courseDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={handleCloseDetails}>
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            border: '1px solid var(--border-color)'
          }} onClick={e => e.stopPropagation()}>
            {courseDetails.course?.image && (
              <img 
                src={courseDetails.course.image} 
                alt={courseDetails.course.title}
                style={{
                  width: '100%',
                  height: '240px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ margin: '0 0 8px 0' }}>{courseDetails.course?.title}</h2>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>By {courseDetails.course?.instructor_name}</p>
              </div>
              <button onClick={handleCloseDetails} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span className="text-sm text-muted">Your Progress</span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <div className="progress-bar-fill" style={{ 
                  width: `${courseDetails.course?.progress_pct || 0}%`,
                  backgroundColor: courseDetails.course?.progress_pct >= 100 ? '#10b981' : '#3b82f6'
                }} />
              </div>
              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-sm">{courseDetails.course?.progress_pct || 0}% Complete</span>
                <span className="text-sm text-muted">{courseDetails.lessons?.length || 0} lessons</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <h4>Course Description</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: '0' }}>{courseDetails.course?.full_description || courseDetails.course?.short_description}</p>
            </div>

            {courseDetails.lessons && courseDetails.lessons.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <h4>Course Content ({courseDetails.lessons.length} lessons)</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {courseDetails.lessons.map((lesson, idx) => (
                    <div key={lesson.id} style={{
                      padding: '10px',
                      backgroundColor: 'var(--bg-tertiary)',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 2px 0', fontSize: '0.9rem', fontWeight: '500' }}>{lesson.title}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {lesson.lesson_type === 'quiz' ? '📝 Quiz' : '📄 Lesson'} {lesson.duration ? `• ${lesson.duration} min` : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/courses/${courseDetails.course?.id}`} className="btn btn-primary" style={{ flex: 1, textAlign: 'center' }}>
                Continue Learning
              </Link>
              <button onClick={handleCloseDetails} className="btn btn-outline" style={{ flex: 1 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

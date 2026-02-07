import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, Lock, PlayCircle, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${id}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        setCourse(d.course);
        setLessons(d.lessons || []);
        setEnrolled(d.enrolled);
        setProgress(d.progress || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login', { state: { from: `/courses/${id}` } }); return; }
    setEnrolling(true);
    try {
      await fetch(`/api/courses/${id}/enroll`, { method: 'POST', credentials: 'include' });
      setEnrolled(true);
    } catch {}
    setEnrolling(false);
  };

  const startLearning = () => {
    if (lessons.length > 0) {
      navigate(`/learn/${id}/${lessons[0].id}`);
    }
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;
  if (!course) return <div className="empty-state"><h3>Course not found</h3></div>;

  const totalDuration = lessons.reduce((s, l) => s + (l.duration || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 32, alignItems: 'start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>{course.title}</h1>
          <p className="text-muted mb-4" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={16} /> {course.instructor_name}
          </p>

          {enrolled && (
            <div className="mb-6">
              <div className="flex-between mb-4">
                <span className="text-sm text-muted">Progress</span>
                <span className="text-sm" style={{ fontWeight: 600 }}>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="tabs">
            <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`tab ${activeTab === 'lessons' ? 'active' : ''}`} onClick={() => setActiveTab('lessons')}>Lessons ({lessons.length})</button>
          </div>

          {activeTab === 'overview' && (
            <div>
              <div style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: course.full_description || course.short_description }} />
              {course.tags && (
                <div className="mt-6">
                  <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>Tags</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {course.tags.split(',').filter(Boolean).map(tag => (
                      <span key={tag} className="tag">{tag.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className="lesson-list">
              {lessons.map((lesson, i) => (
                <div
                  key={lesson.id}
                  className="lesson-item"
                  onClick={() => enrolled && navigate(`/learn/${id}/${lesson.id}`)}
                  style={{ cursor: enrolled ? 'pointer' : 'default' }}
                >
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 24 }}>{i + 1}</span>
                  {enrolled ? (
                    <PlayCircle size={20} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Lock size={20} style={{ color: 'var(--text-muted)' }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{lesson.title}</div>
                    <div className="text-sm text-muted">{lesson.lesson_type} &middot; {lesson.duration || 5} min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ position: 'sticky', top: 80 }}>
          {course.image_url && (
            <img src={course.image_url} alt={course.title} style={{ width: '100%', borderRadius: 'var(--radius-sm)', marginBottom: 16, maxHeight: 200, objectFit: 'cover' }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-between">
              <span className="text-sm text-muted">Lessons</span>
              <span style={{ fontWeight: 600 }}>{lessons.length}</span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">Duration</span>
              <span style={{ fontWeight: 600 }}>{totalDuration} min</span>
            </div>
            <div className="flex-between">
              <span className="text-sm text-muted">Access</span>
              <span className="badge badge-success">{course.access === 'free' ? 'Free' : `$${course.price}`}</span>
            </div>
            {enrolled ? (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={startLearning}>
                {progress > 0 ? 'Continue Learning' : 'Start Learning'}
              </button>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleEnroll} disabled={enrolling}>
                {enrolling ? <span className="inline-loader" /> : 'Enroll Now'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

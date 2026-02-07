import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function MyCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/my-courses', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setCourses(d.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div>
      <div className="flex-between mb-6">
        <div>
          <h1 className="section-title" style={{ margin: 0 }}>My Courses</h1>
          <p className="text-sm text-muted mt-4">Welcome back, {user?.full_name}</p>
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
        <div className="course-grid">
          {filtered.map(course => (
            <div key={course.id} className="course-card">
              {course.image_url ? (
                <img src={course.image_url} alt={course.title} className="course-card-image" />
              ) : (
                <div className="course-card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  <BookOpen size={40} />
                </div>
              )}
              <div className="course-card-body">
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.short_description}</p>
                <div className="mb-4">
                  <div className="flex-between" style={{ marginBottom: 4 }}>
                    <span className="text-sm text-muted">Progress</span>
                    <span className="text-sm" style={{ fontWeight: 600 }}>{course.progress_pct || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${course.progress_pct || 0}%` }} />
                  </div>
                </div>
                <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  {course.progress_pct >= 100 ? 'Review' : course.progress_pct > 0 ? 'Continue' : 'Start'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

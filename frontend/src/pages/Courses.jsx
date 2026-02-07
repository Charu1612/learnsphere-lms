import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => setCourses(d.courses || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.tags?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div>
      <h1 className="section-title">Explore Courses</h1>
      <div className="search-input" style={{ position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={48} style={{ marginBottom: 16, color: 'var(--text-muted)' }} />
          <h3>No courses found</h3>
          <p>Try a different search term</p>
        </div>
      ) : (
        <div className="course-grid">
          {filtered.map(course => (
            <Link to={`/courses/${course.id}`} key={course.id} style={{ textDecoration: 'none' }}>
              <div className="course-card">
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
                  <div className="course-card-tags">
                    {course.tags?.split(',').filter(Boolean).slice(0, 3).map(tag => (
                      <span key={tag} className="tag">{tag.trim()}</span>
                    ))}
                  </div>
                  <div className="flex-between">
                    <span className="text-sm text-muted">by {course.instructor_name}</span>
                    <span className="btn btn-primary btn-sm">
                      {!user ? 'View' : (user.role === 'instructor' || user.role === 'admin') ? 'View' : 'Start'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

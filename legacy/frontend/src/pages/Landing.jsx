import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Award, TrendingUp } from 'lucide-react';

export default function Landing() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => setCourses(d.courses?.slice(0, 6) || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Unlock Your Potential with LearnSphere</h1>
        <p>Discover world-class courses, learn at your own pace, and gain skills that matter. Start your learning journey today.</p>
        <div className="hero-actions">
          <Link to="/courses" className="btn btn-primary btn-lg">Browse Courses</Link>
          <Link to="/signup" className="btn btn-outline btn-lg">Get Started Free</Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24, marginBottom: 60 }}>
        {[
          { icon: <BookOpen size={32} />, label: 'Quality Courses', desc: 'Expert-crafted content' },
          { icon: <Users size={32} />, label: 'Learn Together', desc: 'Join a community of learners' },
          { icon: <Award size={32} />, label: 'Track Progress', desc: 'See your growth over time' },
          { icon: <TrendingUp size={32} />, label: 'Grow Skills', desc: 'Advance your career' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--accent)', marginBottom: 12 }}>{item.icon}</div>
            <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{item.label}</h3>
            <p className="text-sm text-muted">{item.desc}</p>
          </div>
        ))}
      </section>

      {courses.length > 0 && (
        <section>
          <div className="flex-between mb-6">
            <h2 className="section-title" style={{ margin: 0 }}>Featured Courses</h2>
            <Link to="/courses" className="btn btn-outline btn-sm">View All</Link>
          </div>
          <div className="course-grid">
            {courses.map(course => (
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
                    <span className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }}>View Course</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

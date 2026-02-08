import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, User, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function BrowseCourses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = courses.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.short_description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchTerm, courses]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/learner/courses', { credentials: 'include' });
      const data = await response.json();
      
      // Sort: Free courses first, then by creation date
      const sorted = (data.courses || []).sort((a, b) => {
        if (a.access === 'free' && b.access !== 'free') return -1;
        if (a.access !== 'free' && b.access === 'free') return 1;
        return 0;
      });
      
      setCourses(sorted);
      setFilteredCourses(sorted);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  return (
    <div className="main-wrapper">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <h1 className="section-title">Browse Courses</h1>

        {/* Search Bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ position: 'relative', maxWidth: '600px' }}>
            <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search courses by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BookOpen size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3>No courses found</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {searchTerm ? 'Try a different search term' : 'No courses available at the moment'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Course Image */}
                <div style={{
                  height: '180px',
                  backgroundColor: '#e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  {course.image_url ? (
                    <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <BookOpen size={48} style={{ color: '#999' }} />
                  )}
                  {course.enrolled && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}>
                      Enrolled
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 600 }}>{course.title}</h3>
                  
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: '1.5', height: '40px', overflow: 'hidden' }}>
                    {course.short_description || course.full_description || 'No description available'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={16} />
                      <span>{course.instructor_name}</span>
                    </div>
                    {course.lesson_count > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={16} />
                        <span>{course.lesson_count} lessons</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar (if enrolled) */}
                  {course.enrolled && course.progress_percentage > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem' }}>
                        <span>Progress</span>
                        <span>{course.progress_percentage}%</span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', backgroundColor: '#10b981', width: `${course.progress_percentage}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Price/Access Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${course.access === 'free' ? 'badge-success' : 'badge-info'}`}>
                      {course.access === 'free' ? 'Free' : `$${course.price}`}
                    </span>
                    {course.enrolled && (
                      <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                        {course.progress_percentage === 0 ? 'Start' : course.progress_percentage === 100 ? 'Completed' : 'Continue'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Award, TrendingUp, Play, ShoppingCart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [coursesRes, profileRes] = await Promise.all([
        fetch('/api/learner/my-courses', { credentials: 'include' }),
        fetch('/api/learner/profile', { credentials: 'include' })
      ]);
      
      const coursesData = await coursesRes.json();
      const profileData = await profileRes.json();
      
      setCourses(coursesData.courses || []);
      setProfile(profileData.profile || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getButtonState = (course) => {
    if (!course.is_paid && course.access === 'paid') {
      return { text: 'Buy Course', icon: ShoppingCart, className: 'btn-warning' };
    }
    if (course.progress_percentage === 0) {
      return { text: 'Start', icon: Play, className: 'btn-success' };
    }
    if (course.progress_percentage === 100) {
      return { text: 'Review', icon: BookOpen, className: 'btn-info' };
    }
    return { text: 'Continue', icon: Play, className: 'btn-primary' };
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;

  if (!user) {
    return (
      <div className="main-wrapper">
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>Please login to view your courses</h2>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <h1 className="section-title">My Courses</h1>

        {/* Profile Panel */}
        {profile && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '32px',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 auto 12px'
              }}>
                {profile.full_name?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 4px 0' }}>{profile.full_name}</h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>{profile.email}</p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <TrendingUp size={32} style={{ color: '#10b981', marginBottom: '8px' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{profile.total_points}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Total Points</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Award size={32} style={{ color: '#f59e0b', marginBottom: '8px' }} />
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{profile.badge_level}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Badge Level</div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <BookOpen size={32} style={{ color: '#3b82f6', marginBottom: '8px' }} />
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{profile.total_courses}</div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enrolled Courses</div>
            </div>
          </div>
        )}

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BookOpen size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3>No enrolled courses yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Start learning by browsing our course catalog
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/courses')}>
              Browse Courses
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {courses.map(course => {
              const buttonState = getButtonState(course);
              const ButtonIcon = buttonState.icon;

              return (
                <div
                  key={course.id}
                  style={{
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
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
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => handleCourseClick(course.id)}
                  >
                    {course.image_url ? (
                      <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <BookOpen size={48} style={{ color: '#999' }} />
                    )}
                    
                    {/* Status Badge */}
                    {course.status === 'completed' && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        ✓ Completed
                      </div>
                    )}
                    {course.status === 'in_progress' && course.progress_percentage > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        In Progress
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => handleCourseClick(course.id)}>
                      {course.title}
                    </h3>
                    
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      By {course.instructor_name}
                    </p>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.875rem' }}>
                        <span>Progress</span>
                        <span style={{ fontWeight: 600 }}>{course.progress_percentage}%</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: course.progress_percentage === 100 ? '#10b981' : '#3b82f6',
                          width: `${course.progress_percentage}%`,
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className={`btn ${buttonState.className}`}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      onClick={() => handleCourseClick(course.id)}
                    >
                      <ButtonIcon size={18} />
                      {buttonState.text}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

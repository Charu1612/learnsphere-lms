import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, User, Clock, CheckCircle, Circle, Search, Play, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import CelebrationModal from '../../components/CelebrationModal';
import PaymentModal from '../../components/PaymentModal';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLessons, setFilteredLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseDetail();
  }, [courseId, user]);

  useEffect(() => {
    if (course && course.lessons) {
      if (searchTerm) {
        const filtered = course.lessons.filter(lesson =>
          lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredLessons(filtered);
      } else {
        setFilteredLessons(course.lessons);
      }
    }
  }, [searchTerm, course]);

  const fetchCourseDetail = async () => {
    try {
      const response = await fetch(`/api/learner/courses/${courseId}`, { credentials: 'include' });
      const data = await response.json();
      console.log('Course data:', data);
      setCourse(data.course);
      setFilteredLessons(data.course.lessons || []);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if course is paid
    if (course.access === 'paid' && course.price > 0) {
      setShowPaymentModal(true);
      return;
    }

    // Free course - enroll directly
    await enrollInCourse();
  };

  const enrollInCourse = async () => {
    try {
      const response = await fetch(`/api/learner/courses/${courseId}/enroll`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        alert('✅ Enrolled successfully!');
        fetchCourseDetail(); // Refresh to show enrolled state
      } else {
        alert('Failed to enroll');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Failed to enroll');
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    enrollInCourse();
  };

  const handleCompleteCourse = async () => {
    try {
      const response = await fetch(`/api/learner/courses/${courseId}/complete`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Course completed:', data);
        
        // Get certificate details
        if (data.certificate) {
          const certResponse = await fetch(`/api/learner/certificates/${data.certificate.id}`, {
            credentials: 'include'
          });
          const certData = await certResponse.json();
          setCertificate(certData.certificate);
          setShowCelebration(true);
        }
        
        // Refresh course data
        fetchCourseDetail();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to complete course');
      }
    } catch (error) {
      console.error('Error completing course:', error);
      alert('Failed to complete course');
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificate) return;
    
    // Generate certificate HTML
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${certificate.certificate_number}</title>
        <style>
          body {
            font-family: 'Georgia', serif;
            text-align: center;
            padding: 50px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .certificate {
            background: white;
            padding: 60px;
            border: 10px solid #FFD700;
            border-radius: 20px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            font-size: 3rem;
            color: #333;
            margin-bottom: 20px;
          }
          .subtitle {
            font-size: 1.5rem;
            color: #666;
            margin-bottom: 40px;
          }
          .student-name {
            font-size: 2.5rem;
            color: #667eea;
            font-weight: bold;
            margin: 30px 0;
          }
          .course-title {
            font-size: 1.8rem;
            color: #333;
            margin: 20px 0;
          }
          .cert-number {
            font-size: 1rem;
            color: #999;
            margin-top: 40px;
          }
          .date {
            font-size: 1rem;
            color: #666;
            margin-top: 10px;
          }
          .logo {
            font-size: 3rem;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">🎓</div>
          <h1>Certificate of Completion</h1>
          <p class="subtitle">This is to certify that</p>
          <div class="student-name">${certificate.users?.full_name || user?.full_name || 'Student Name'}</div>
          <p class="subtitle">has successfully completed</p>
          <div class="course-title">${certificate.courses?.title || course?.title || 'Course Title'}</div>
          <p class="cert-number">Certificate No: ${certificate.certificate_number}</p>
          <p class="date">Issued: ${new Date(certificate.issued_date).toLocaleDateString()}</p>
          <p class="date">Grade: ${certificate.grade || 'A'}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificate-${certificate.certificate_number}.html`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Mark as downloaded
    fetch(`/api/learner/certificates/${certificate.id}/download`, {
      method: 'PUT',
      credentials: 'include'
    });
  };

  const handleLessonClick = (lessonId) => {
    if (!course.enrolled) {
      // For free courses, show enroll message
      if (course.access === 'free') {
        alert('Please enroll in this course first');
      } else {
        // For paid courses, show payment modal
        setShowPaymentModal(true);
      }
      return;
    }
    navigate(`/courses/${courseId}/lessons/${lessonId}`);
  };

  const isLessonCompleted = (lessonId) => {
    return course.completed_lessons && course.completed_lessons.includes(lessonId);
  };

  if (loading) return <div className="page-loader"><div className="inline-loader" /></div>;
  if (!course) return <div className="main-wrapper"><h2>Course not found</h2></div>;

  const incompleteCount = course.total_lessons - course.completed_count;

  return (
    <div className="main-wrapper">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Course Header */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '32px' }}>
            {/* Left: Course Info */}
            <div>
              <h1 style={{ margin: '0 0 16px 0', fontSize: '2rem' }}>{course.title}</h1>
              
              <p style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                {course.short_description || course.full_description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} />
                  <span>{course.instructor_name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} />
                  <span>{course.total_lessons} lessons</span>
                </div>
              </div>

              {/* Tags */}
              {course.tags && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {course.tags.split(',').map((tag, index) => (
                    <span key={index} className="badge badge-info">{tag.trim()}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Course Image */}
            <div style={{
              height: '200px',
              backgroundColor: '#e0e0e0',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              {course.image_url ? (
                <img src={course.image_url} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <BookOpen size={64} style={{ color: '#999' }} />
              )}
            </div>
          </div>

          {/* Progress Section (if enrolled) */}
          {course.enrolled && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Your Progress</span>
                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#3b82f6' }}>{course.progress_percentage}%</span>
              </div>
              <div style={{ height: '12px', backgroundColor: '#e0e0e0', borderRadius: '6px', overflow: 'hidden', marginBottom: '12px' }}>
                <div style={{
                  height: '100%',
                  backgroundColor: course.progress_percentage === 100 ? '#10b981' : '#3b82f6',
                  width: `${course.progress_percentage}%`,
                  transition: 'width 0.3s'
                }} />
              </div>
              <div style={{ display: 'flex', gap: '24px', fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <span>✓ {course.completed_count} completed</span>
                <span>○ {incompleteCount} incomplete</span>
              </div>
              
              {/* View Study Plan Button */}
              <button
                className="btn btn-primary"
                style={{ fontSize: '1rem', padding: '10px 24px', marginBottom: '12px' }}
                onClick={() => navigate(`/courses/${courseId}/study-plan`)}
              >
                📚 View Study Plan
              </button>
              
              {/* Show completion status if 100% */}
              {course.progress_percentage === 100 && (
                <div style={{ 
                  padding: '12px 20px', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: '8px',
                  color: '#10b981',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginTop: '12px'
                }}>
                  🎉 Course Completed! Check your achievements for certificate.
                </div>
              )}
            </div>
          )}

          {/* Enroll Button (if not enrolled) */}
          {!course.enrolled && (
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '1.1rem', padding: '12px 32px' }}
                onClick={handleEnroll}
              >
                {user ? (course.access === 'free' ? 'Enroll for Free' : `Buy for $${course.price}`) : 'Login to Enroll'}
              </button>
            </div>
          )}
        </div>

        {/* Lessons Section */}
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>Course Content</h2>
            
            {/* Search Lessons */}
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 40px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Lessons List */}
          {filteredLessons.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {searchTerm ? 'No lessons found' : 'No lessons available yet'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredLessons.map((lesson, index) => {
                const completed = isLessonCompleted(lesson.id);
                
                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonClick(lesson.id)}
                    style={{
                      padding: '16px 20px',
                      backgroundColor: completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      cursor: course.enrolled ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s',
                      opacity: course.enrolled ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (course.enrolled) {
                        e.currentTarget.style.backgroundColor = completed ? 'rgba(16, 185, 129, 0.15)' : '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-primary)';
                    }}
                  >
                    {/* Status Icon */}
                    <div>
                      {completed ? (
                        <CheckCircle size={24} style={{ color: '#10b981' }} />
                      ) : course.enrolled ? (
                        <Circle size={24} style={{ color: '#3b82f6' }} />
                      ) : (
                        <Lock size={24} style={{ color: '#999' }} />
                      )}
                    </div>

                    {/* Lesson Number */}
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', minWidth: '40px' }}>
                      Lesson {index + 1}
                    </div>

                    {/* Lesson Title */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{lesson.title}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        <span className="badge badge-info" style={{ marginRight: '8px' }}>{lesson.lesson_type}</span>
                        {lesson.duration > 0 && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {lesson.duration} min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Play Icon */}
                    {course.enrolled && (
                      <Play size={20} style={{ color: completed ? '#10b981' : '#3b82f6' }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          course={course}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Celebration Modal */}
      {showCelebration && certificate && (
        <CelebrationModal
          certificate={certificate}
          onClose={() => {
            setShowCelebration(false);
            navigate('/achievements');
          }}
          onDownload={handleDownloadCertificate}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Play, CheckCircle, Lock, Award, TrendingUp, Clock, FileText, Image, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/StudyPlan.css';

export default function StudyPlan() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('StudyPlan mounted, courseId:', courseId);
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      console.log('Fetching course data for courseId:', courseId);
      const response = await fetch(`http://localhost:8000/api/learner/courses/${courseId}`, { 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Course not found (${response.status})`);
      }
      const data = await response.json();
      console.log('Course data received:', data);
      setCourse(data.course);
      setLessons(data.course.lessons || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching course:', error);
      setError(error.message);
      // Don't navigate away immediately, show error
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lesson) => {
    if (!course.enrolled) {
      alert('Please enroll in this course first');
      return;
    }
    navigate(`/courses/${courseId}/lessons/${lesson.id}`);
  };

  const isLessonCompleted = (lessonId) => {
    return course?.completed_lessons?.includes(lessonId);
  };

  const getLessonIcon = (lesson) => {
    const completed = isLessonCompleted(lesson.id);
    
    if (completed) {
      return <CheckCircle size={24} className="lesson-icon completed" />;
    }
    
    // Check content type
    if (lesson.content_type === 'video') {
      return <Video size={24} className="lesson-icon video" />;
    } else if (lesson.content_type === 'quiz') {
      return <Award size={24} className="lesson-icon quiz" />;
    } else if (lesson.content_type === 'image') {
      return <Image size={24} className="lesson-icon image" />;
    } else {
      return <FileText size={24} className="lesson-icon text" />;
    }
  };

  if (loading) {
    return (
      <div className="page-loader" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="inline-loader" />
        <p style={{ marginLeft: '10px' }}>Loading study plan...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-message" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>⚠️ Error Loading Study Plan</h2>
        <p>{error}</p>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/learner/my-courses')}
          style={{ marginTop: '20px' }}
        >
          ← Back to My Courses
        </button>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="error-message" style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Course not found</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/learner/my-courses')}
          style={{ marginTop: '20px' }}
        >
          ← Back to My Courses
        </button>
      </div>
    );
  }

  const completedCount = course.completed_count || 0;
  const totalLessons = course.total_lessons || 0;
  const progressPercent = course.progress_percentage || 0;

  return (
    <div className="study-plan-page">
      {/* Header Section */}
      <div className="study-plan-header">
        <div className="header-content">
          <button className="btn-back" onClick={() => navigate('/learner/my-courses')}>
            ← Back to My Courses
          </button>
          <h1>{course.title}</h1>
          <p className="course-instructor">
            <BookOpen size={16} />
            Instructor: {course.instructor_name}
          </p>
        </div>
      </div>

      {/* Progress Dashboard */}
      <div className="progress-dashboard">
        <div className="dashboard-card">
          <div className="card-icon progress-icon">
            <TrendingUp size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Overall Progress</div>
            <div className="card-value">{progressPercent}%</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon completed-icon">
            <CheckCircle size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Completed Lessons</div>
            <div className="card-value">{completedCount} / {totalLessons}</div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon time-icon">
            <Clock size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Duration</div>
            <div className="card-value">
              {lessons.reduce((sum, l) => sum + (l.duration || 0), 0)} min
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-icon lessons-icon">
            <BookOpen size={32} />
          </div>
          <div className="card-content">
            <div className="card-label">Total Lessons</div>
            <div className="card-value">{totalLessons}</div>
          </div>
        </div>
      </div>

      {/* Study Plan Grid */}
      <div className="study-plan-content">
        <h2 className="section-title">📚 Your Learning Path</h2>
        
        <div className="lessons-grid">
          {lessons.map((lesson, index) => {
            const completed = isLessonCompleted(lesson.id);
            
            return (
              <div
                key={lesson.id}
                className={`lesson-card ${completed ? 'completed' : ''}`}
                onClick={() => handleLessonClick(lesson)}
              >
                <div className="lesson-number">
                  {index + 1}
                </div>
                
                <div className="lesson-icon-wrapper">
                  {getLessonIcon(lesson)}
                </div>

                <div className="lesson-details">
                  <h3 className="lesson-title">{lesson.title}</h3>
                  
                  <div className="lesson-meta">
                    {lesson.duration && (
                      <span className="meta-item">
                        <Clock size={14} />
                        {lesson.duration} min
                      </span>
                    )}
                    {lesson.content_type && (
                      <span className="meta-item type-badge">
                        {lesson.content_type}
                      </span>
                    )}
                  </div>

                  {completed && (
                    <div className="completion-badge">
                      <CheckCircle size={16} />
                      Completed
                    </div>
                  )}
                </div>

                <div className="lesson-action">
                  {completed ? (
                    <button className="btn-review">Review</button>
                  ) : (
                    <button className="btn-start">
                      <Play size={16} />
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Course Button */}
        {progressPercent === 100 && course.status !== 'completed' && (
          <div className="complete-course-section">
            <div className="complete-card">
              <Award size={48} className="trophy-icon" />
              <h3>🎉 Congratulations!</h3>
              <p>You've completed all lessons. Ready to finish this course?</p>
              <button
                className="btn btn-success btn-large"
                onClick={async () => {
                  try {
                    const response = await fetch(`http://localhost:8000/api/learner/courses/${courseId}/complete`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                      }
                    });
                    if (response.ok) {
                      alert('🎉 Course completed! Well done!');
                      fetchCourseData();
                    }
                  } catch (error) {
                    console.error('Error:', error);
                  }
                }}
              >
                Complete This Course
              </button>
            </div>
          </div>
        )}

        {course.status === 'completed' && (
          <div className="completed-banner">
            <CheckCircle size={32} />
            <span>Course Completed!</span>
          </div>
        )}
      </div>
    </div>
  );
}
